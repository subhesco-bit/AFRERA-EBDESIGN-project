-- Order-to-cash fulfillment: stock reservation and saga state
--
-- WHY THIS EXISTS
--
-- 1. There is no stock reservation anywhere in this codebase. A grep across
--    every service finds no reserveStock / reserveInventory implementation,
--    and `warehouse_inventory` carries a `quantity` column with nothing to
--    subtract committed-but-not-yet-shipped stock from. Two concurrent orders
--    for the same product therefore both see the full on-hand quantity and
--    both succeed: the platform oversells and only finds out at the
--    warehouse. `inventory_reservations` is the missing held-stock ledger;
--    available = quantity - SUM(held).
--
-- 2. The order-to-cash chain (reserve -> allocate -> transport -> insure ->
--    escrow -> invoice -> dispatch -> ledger) spans eight tables owned by
--    different modules and has no transactional boundary across them. Without
--    a durable record of which steps ran, a failure halfway through leaves
--    stock held, money in escrow and no shipment, with nothing to unwind it
--    from. `fulfillment_sagas` and `fulfillment_saga_steps` are that record,
--    and they are what compensation reads to unwind in reverse order.
--
-- Idempotent per the project convention.

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID NOT NULL,
    product_id    UUID NOT NULL,
    warehouse_id  INTEGER,
    quantity      NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    status        VARCHAR(20) NOT NULL DEFAULT 'held'
                  CHECK (status IN ('held', 'consumed', 'released', 'expired')),
    reserved_by   UUID,
    expires_at    TIMESTAMP,
    released_at   TIMESTAMP,
    consumed_at   TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- The availability query sums held rows for a product; without this it is a
-- sequential scan of every reservation ever made.
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_held
    ON inventory_reservations (product_id)
    WHERE status = 'held';

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order
    ON inventory_reservations (order_id);

-- One live reservation per (order, product): a retried reserve step must not
-- silently double-hold stock.
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_reservations_order_product_live
    ON inventory_reservations (order_id, product_id)
    WHERE status = 'held';

CREATE TABLE IF NOT EXISTS fulfillment_sagas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running', 'completed', 'compensating', 'compensated', 'failed')),
    failed_step    VARCHAR(40),
    failure_reason TEXT,
    started_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_sagas_order
    ON fulfillment_sagas (order_id);

CREATE TABLE IF NOT EXISTS fulfillment_saga_steps (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_id      UUID NOT NULL REFERENCES fulfillment_sagas(id) ON DELETE CASCADE,
    step_name    VARCHAR(40) NOT NULL,
    step_order   INTEGER NOT NULL,
    -- 'skipped' is a first-class outcome, not a failure: a step whose
    -- prerequisite table cannot be satisfied for this order records why and
    -- lets the chain continue, rather than failing a saga that is otherwise
    -- sound. It is never silently omitted.
    status       VARCHAR(20) NOT NULL
                 CHECK (status IN ('succeeded', 'skipped', 'failed', 'compensated')),
    reason       TEXT,
    result       JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_saga_steps_saga
    ON fulfillment_saga_steps (saga_id, step_order);
