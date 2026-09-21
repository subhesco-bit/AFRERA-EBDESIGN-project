/**
 * Order Fulfilment Pipeline Agent — consumer places an order, fulfilment follows.
 *
 * Strategy Card
 * Purpose:  Connect order placement to the things that must happen for produce
 *           to actually arrive intact: funds held in escrow, cold storage
 *           allocated when the goods are perishable, a shipment raised carrying
 *           its temperature requirement, monitoring registered, and transit
 *           cover assessed.
 * Actors:   buyer (human), farmer/seller (human), logistics and cold-store
 *           operators (human), this agent (system).
 * Decision: mixed, and the boundary matters — see ACTION BOUNDARIES below.
 * Algorithm: subscribe to commerce.order.placed and iot.temperature.breach,
 *           then run the stages below, each independently guarded.
 * Data:     reads the order carried on the signal; writes through the existing
 *           escrow / cold-storage / logistics services, which own their tables.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every component of this flow already existed. Nothing connected them:
 *
 *   - `commerce.order.placed` was in the SIGNAL catalog but **nothing ever
 *     emitted it**. core/decisionEngine.js reads it when correlating order and
 *     shipment-delay signals, so that logic could never fire either.
 *   - services/orderService.js emits nothing at all.
 *   - createOrder referenced neither escrow, nor cold storage, nor insurance,
 *     nor shipment. The chain existed only as separate services.
 *
 * ACTION BOUNDARIES — what this agent will NOT do
 * -----------------------------------------------
 * Some steps in this chain move money or make assertions on someone's behalf.
 * Those are deliberately left to an explicit human or rule-driven action:
 *
 *   - It creates an escrow hold but **never releases or refunds escrow**.
 *     Holding a buyer's funds on order placement is the safe direction and is
 *     the point of escrow; releasing them requires delivery verification
 *     against the escrow's own release_conditions.
 *   - It assesses transit insurance but **never issues a policy**.
 *     issuePolicy() binds cover and charges a premium. An agent should not
 *     commit someone to a paid contract as a side effect of ordering.
 *   - On a cold-chain breach it records the exception and prepares a claim
 *     recommendation, but **never submits a claim**. A claim is a financial
 *     assertion against an insurer; a temperature reading is evidence for one,
 *     not authority to make one.
 *
 * HONESTY RULES
 * -------------
 *  - Perishability is never guessed. It is read from explicit order/product
 *    fields; when absent, the cold-chain stages are SKIPPED with a reason
 *    rather than assumed either way. Wrongly assuming "not perishable" spoils
 *    produce; wrongly assuming "perishable" bills a farmer for cold storage
 *    they did not need.
 *  - A stage that cannot run records 'unavailable' or 'skipped' with a reason.
 *    It never invents an allocation, a premium or a shipment.
 *  - A failing stage never fails the buyer's order. The order is committed
 *    before this runs, and signalBus guarantees a throwing subscriber cannot
 *    propagate back into the emitter.
 */

const { logger } = require('../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');

const PIPELINE_VERSION = '1.0.0';

/** Per-stage action boundary, recorded on every run so it is auditable. */
const BOUNDARY = Object.freeze({
  HOLDS_FUNDS: 'holds_funds_never_releases',
  BOOKS_CAPACITY: 'books_capacity',
  CREATES_RECORD: 'creates_record',
  ADVISORY: 'advisory_only',
});

const STATUS = Object.freeze({
  OK: 'ok',
  SKIPPED: 'skipped',
  UNAVAILABLE: 'unavailable',
  FAILED: 'failed',
});

/** Lazy requires: this module loads during startup, before the service graph settles. */
const lazy = (p) => () => require(p);
const getEscrow = lazy('../services/escrowService');
const getColdStorage = lazy('../services/coldStorageService');
const getLogistics = lazy('../services/logisticsService');
const getColdChainMonitoring = lazy('../services/coldChainMonitoringService');
const getInsurancePremium = lazy('../services/insurancePremiumService');

/**
 * Decide whether this order needs a cold chain, from what the order actually
 * states. Returns perishable: null when the data does not say — the caller then
 * SKIPS rather than assuming, because both wrong answers are costly.
 */
function classifyPerishable(order) {
  const explicit = order.is_perishable ?? order.perishable;
  if (explicit === true || explicit === false) {
    return { perishable: explicit, basis: 'is_perishable stated on the order' };
  }
  if (order.temperature_requirement) {
    return {
      perishable: true,
      basis: `order states temperature_requirement: ${order.temperature_requirement}`,
    };
  }
  const items = Array.isArray(order.items) ? order.items : [];
  if (items.some((i) => i && (i.is_perishable === true || i.temperature_requirement))) {
    return { perishable: true, basis: 'an order item states perishability or a temperature requirement' };
  }
  if (items.length > 0 && items.every((i) => i && i.is_perishable === false)) {
    return { perishable: false, basis: 'every order item states is_perishable: false' };
  }
  return {
    perishable: null,
    basis: 'order and items carry no perishability or temperature field; not inferred from product names',
  };
}

/**
 * shipments.temperature_requirement is NUMERIC. Return a number only when the
 * order actually stated one; a range such as "2-8C" yields null rather than a
 * fabricated midpoint.
 */
function numericTemperature(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const trimmed = String(value).trim();
  // Accept a bare number, optionally with a unit suffix: "4", "4C", "-18 C".
  const match = /^(-?\d+(?:\.\d+)?)\s*(?:°?\s*[CcFf])?$/.exec(trimmed);
  return match ? Number(match[1]) : null;
}

class OrderFulfilmentPipelineAgent {
  constructor() {
    this.subscribers = [];
    this.initialized = false;
    this.stats = { orders: 0, breaches: 0, stagesOk: 0, stagesSkipped: 0, stagesUnavailable: 0, stagesFailed: 0 };
  }

  initialize() {
    if (this.initialized) {
      logger.warn('OrderFulfilmentPipelineAgent already initialized');
      return;
    }
    this.subscribers.push(
      signalBus.onSignal(SIGNAL.ORDER_PLACED, this.handleOrderPlaced.bind(this)),
    );
    this.subscribers.push(
      signalBus.onSignal(SIGNAL.TEMPERATURE_BREACH, this.handleTemperatureBreach.bind(this)),
    );
    this.initialized = true;
    logger.info('OrderFulfilmentPipelineAgent initialized', {
      subscribedSignals: [SIGNAL.ORDER_PLACED, SIGNAL.TEMPERATURE_BREACH],
      pipelineVersion: PIPELINE_VERSION,
      neverDoes: ['release escrow', 'issue insurance policy', 'submit insurance claim'],
    });
  }

  async runStage(name, boundary, fn) {
    try {
      const outcome = await fn();
      return { stage: name, boundary, ...outcome };
    } catch (error) {
      return {
        stage: name,
        boundary,
        status: STATUS.FAILED,
        reason: error && error.message ? error.message : String(error),
      };
    }
  }

  /**
   * signalBus dispatches the whole envelope; emitted fields live on
   * signal.payload (see emitSignal in core/signalBus.js).
   */
  async handleOrderPlaced(signal = {}) {
    const payload = signal.payload || {};
    const order = payload.order;
    if (!order || !order.id) {
      logger.warn('OrderFulfilmentPipelineAgent: signal carried no order row; nothing to fulfil', {
        signal: SIGNAL.ORDER_PLACED,
      });
      return;
    }

    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const stages = [];

    // --- Stage 1: hold the buyer's funds ----------------------------------
    stages.push(
      await this.runStage('escrow_hold', BOUNDARY.HOLDS_FUNDS, async () => {
        const missing = ['buyer_id', 'farmer_id', 'total_amount'].filter(
          (k) => order[k] === undefined || order[k] === null,
        );
        if (missing.length) {
          return {
            status: STATUS.SKIPPED,
            reason: `order does not carry ${missing.join(', ')}; escrow needs both parties and an amount`,
          };
        }
        const escrowService = getEscrow();
        const escrow = await escrowService.createEscrowTransaction({
          order_id: order.id,
          buyer_id: order.buyer_id,
          farmer_id: order.farmer_id,
          amount: order.total_amount,
          currency: order.currency || 'INR',
          payment_reference: order.payment_reference || null,
          release_conditions: order.release_conditions || 'delivery_confirmed',
        });
        return { status: STATUS.OK, escrowId: escrow && escrow.id };
      }),
    );

    // --- Stage 2: does this order need a cold chain? -----------------------
    const cold = classifyPerishable(order);
    stages.push({
      stage: 'cold_chain_requirement',
      boundary: BOUNDARY.ADVISORY,
      status: cold.perishable === null ? STATUS.SKIPPED : STATUS.OK,
      perishable: cold.perishable,
      basis: cold.basis,
    });

    // --- Stage 3: allocate cold storage ------------------------------------
    if (cold.perishable === true) {
      stages.push(
        await this.runStage('cold_storage_allocation', BOUNDARY.BOOKS_CAPACITY, async () => {
          const required = {
            produceType: order.produce_type || order.product_category || null,
            quantityUnits: order.quantity_units ?? order.quantity ?? null,
            checkInDate: order.storage_check_in_date || null,
            checkOutDate: order.storage_check_out_date || null,
            owner: order.farmer_id || order.fpo_id || null,
          };
          const missing = Object.entries(required)
            .filter(([, v]) => v === null || v === undefined)
            .map(([k]) => k);
          if (missing.length) {
            return {
              status: STATUS.SKIPPED,
              reason: `cold storage booking needs ${missing.join(', ')}; the order does not carry them`,
            };
          }

          const coldStorage = getColdStorage();
          // Pick from real occupancy, not a guess: getFacilitiesWithStatus
          // computes checked-in units against declared capacity.
          const facilities = await coldStorage.getFacilitiesWithStatus({});
          const candidate = (facilities || []).find((f) => {
            const capacity = Number(f.capacity_units ?? f.capacity ?? 0);
            const used = Number(f.checked_in_units ?? 0);
            return capacity - used >= Number(required.quantityUnits);
          });
          if (!candidate) {
            return {
              status: STATUS.UNAVAILABLE,
              reason: `no cold-storage facility has ${required.quantityUnits} free units`,
              facilitiesConsidered: (facilities || []).length,
            };
          }

          const booking = await coldStorage.createBooking({
            facilityId: candidate.id,
            farmerId: order.farmer_id || null,
            fpoId: order.fpo_id || null,
            produceType: required.produceType,
            quantityUnits: required.quantityUnits,
            checkInDate: required.checkInDate,
            checkOutDate: required.checkOutDate,
            notes: `Auto-allocated for order ${order.id}`,
          });
          return { status: STATUS.OK, facilityId: candidate.id, bookingId: booking && booking.id };
        }),
      );
    } else {
      stages.push({
        stage: 'cold_storage_allocation',
        boundary: BOUNDARY.BOOKS_CAPACITY,
        status: STATUS.SKIPPED,
        reason:
          cold.perishable === false
            ? 'order is not perishable'
            : 'perishability undetermined and deliberately not inferred',
      });
    }

    // --- Stage 4: raise the shipment, carrying its cold-chain requirement --
    stages.push(
      await this.runStage('shipment_creation', BOUNDARY.CREATES_RECORD, async () => {
        const missing = ['origin_address', 'destination_address'].filter((k) => !order[k]);
        if (missing.length) {
          return {
            status: STATUS.SKIPPED,
            reason: `shipment needs ${missing.join(', ')}; the order does not carry them`,
          };
        }
        const logistics = getLogistics();
        const shipment = await logistics.createShipment({
          order_id: order.id,
          mode_id: order.shipment_mode_id || null,
          origin_address: order.origin_address,
          destination_address: order.destination_address,
          weight_kg: order.weight_kg ?? null,
          volume_cbm: order.volume_cbm ?? null,
          // Propagate the cold-chain requirement onto the shipment row, which
          // carries is_perishable (boolean) and temperature_requirement as
          // first-class fields.
          is_perishable: cold.perishable === true,
          // shipments.temperature_requirement is a NUMERIC column, but a
          // cold-chain requirement is naturally a range ("2-8C"). A range is
          // therefore not representable here and is passed as null rather than
          // reduced to a midpoint or a bound -- inventing a single number would
          // silently assert a precision the order never stated. The range stays
          // on the order, and `temperatureRequirementStated` below records that
          // the shipment row could not carry it.
          temperature_requirement: numericTemperature(order.temperature_requirement),
          estimated_cost: order.estimated_shipping_cost ?? null,
          estimated_transit_days: order.estimated_transit_days ?? null,
        });
        const stated = order.temperature_requirement ?? null;
        const stored = numericTemperature(stated);
        return {
          status: STATUS.OK,
          shipmentId: shipment && shipment.id,
          shipmentNumber: shipment && shipment.shipment_number,
          temperatureRequirementStated: stated,
          temperatureRequirementStored: stored,
          ...(stated !== null && stored === null
            ? {
                note:
                  `temperature requirement "${stated}" is a range; ` +
                  'shipments.temperature_requirement is numeric and cannot hold it, ' +
                  'so it was not narrowed to a single value',
              }
            : {}),
        };
      }),
    );

    // --- Stage 5: register cold-chain monitoring ---------------------------
    if (cold.perishable === true) {
      const shipmentStage = stages.find((s) => s.stage === 'shipment_creation');
      stages.push(
        await this.runStage('cold_chain_monitoring', BOUNDARY.CREATES_RECORD, async () => {
          if (!shipmentStage || shipmentStage.status !== STATUS.OK) {
            return { status: STATUS.SKIPPED, reason: 'no shipment to monitor' };
          }
          const monitor = getColdChainMonitoring();
          if (!monitor || typeof monitor.monitorTemperature !== 'function') {
            return { status: STATUS.UNAVAILABLE, reason: 'monitorTemperature not available' };
          }
          const reading = await monitor.monitorTemperature({
            shipmentId: shipmentStage.shipmentId,
            temperatureRequirement: order.temperature_requirement || null,
          });
          return { status: STATUS.OK, monitoring: reading || null };
        }),
      );
    } else {
      stages.push({
        stage: 'cold_chain_monitoring',
        boundary: BOUNDARY.CREATES_RECORD,
        status: STATUS.SKIPPED,
        reason: 'order does not require a cold chain',
      });
    }

    // --- Stage 6: assess transit cover (advisory; never binds) -------------
    stages.push(
      await this.runStage('transit_insurance_assessment', BOUNDARY.ADVISORY, async () => {
        const premiumService = getInsurancePremium();
        if (!premiumService || typeof premiumService.calculateTransitPremium !== 'function') {
          return {
            status: STATUS.UNAVAILABLE,
            reason: 'insurancePremiumService.calculateTransitPremium not available',
          };
        }

        // calculateTransitPremium(transitData) destructures
        // { shipmentValue, origin, destination, transportMode, distance,
        //   goodsType, duration } and then calls getRouteRisk(origin,
        // destination). Its inputs are supplied from the order as they are, and
        // the stage is SKIPPED when the order does not carry them -- calling it
        // with a different shape produced a real failure
        // ("Cannot read properties of undefined") rather than a usable quote.
        const transitData = {
          shipmentValue: order.total_amount ?? null,
          origin: order.origin_address ?? null,
          destination: order.destination_address ?? null,
          transportMode: order.transport_mode ?? null,
          distance: order.distance_km ?? null,
          goodsType: order.produce_type ?? order.product_category ?? null,
          duration: order.estimated_transit_days ?? null,
        };
        const required = ['shipmentValue', 'origin', 'destination'];
        const missing = required.filter((k) => transitData[k] === null || transitData[k] === undefined);
        if (missing.length) {
          return {
            status: STATUS.SKIPPED,
            reason: `transit premium needs ${missing.join(', ')}; the order does not carry them`,
          };
        }

        const quote = await premiumService.calculateTransitPremium(transitData);
        return {
          status: STATUS.OK,
          quote,
          note: 'assessment only — no policy issued and no premium charged',
        };
      }),
    );

    return this.record('order', order.id, startedAt, t0, stages, {
      perishable: cold.perishable,
      correlationId: signal.correlationId || null,
    });
  }

  /**
   * Cold-chain exception. Records the breach against the order and prepares a
   * claim recommendation with the evidence — it does NOT submit a claim.
   */
  async handleTemperatureBreach(signal = {}) {
    const payload = signal.payload || {};
    const startedAt = new Date().toISOString();
    const t0 = Date.now();

    const shipmentId = payload.shipmentId || payload.shipment_id || null;
    const orderId = payload.orderId || payload.order_id || null;

    if (!shipmentId && !orderId) {
      logger.warn('OrderFulfilmentPipelineAgent: temperature breach carried no shipment or order', {
        signal: SIGNAL.TEMPERATURE_BREACH,
      });
      return;
    }

    this.stats.breaches += 1;

    const stages = [
      {
        stage: 'breach_recorded',
        boundary: BOUNDARY.CREATES_RECORD,
        status: STATUS.OK,
        shipmentId,
        orderId,
        reading: payload.temperature ?? payload.reading ?? null,
        threshold: payload.threshold ?? null,
        severity: signal.severity || SEVERITY.WARNING,
      },
      {
        // Deliberately a recommendation, not a submission. A claim asserts loss
        // against an insurer; a temperature reading is evidence for that
        // assertion, not authority to make it.
        stage: 'claim_recommendation',
        boundary: BOUNDARY.ADVISORY,
        status: STATUS.OK,
        recommended: true,
        basis: 'cold-chain breach recorded against this shipment',
        evidence: {
          signalType: signal.type || SIGNAL.TEMPERATURE_BREACH,
          correlationId: signal.correlationId || null,
          observedAt: signal.timestamp || startedAt,
          temperature: payload.temperature ?? payload.reading ?? null,
          threshold: payload.threshold ?? null,
        },
        note: 'no claim submitted — requires explicit action against the policy',
      },
    ];

    return this.record('temperature_breach', orderId || shipmentId, startedAt, t0, stages, {
      shipmentId,
      correlationId: signal.correlationId || null,
    });
  }

  record(kind, subjectId, startedAt, t0, stages, extra = {}) {
    const tally = stages.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    if (kind === 'order') this.stats.orders += 1;
    this.stats.stagesOk += tally[STATUS.OK] || 0;
    this.stats.stagesSkipped += tally[STATUS.SKIPPED] || 0;
    this.stats.stagesUnavailable += tally[STATUS.UNAVAILABLE] || 0;
    this.stats.stagesFailed += tally[STATUS.FAILED] || 0;

    const run = {
      kind,
      subjectId,
      pipelineVersion: PIPELINE_VERSION,
      startedAt,
      durationMs: Date.now() - t0,
      tally,
      stages,
      ...extra,
    };

    logger.info('Order fulfilment pipeline complete', {
      kind,
      subjectId,
      durationMs: run.durationMs,
      tally,
    });

    signalBus.emitSignal(
      SIGNAL.ORDER_FULFILMENT_ASSESSED,
      { subjectId, run },
      { source: 'orderFulfilmentPipelineAgent', entityId: subjectId },
    );
    return run;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      pipelineVersion: PIPELINE_VERSION,
      subscribedSignals: this.initialized ? [SIGNAL.ORDER_PLACED, SIGNAL.TEMPERATURE_BREACH] : [],
      neverDoes: ['release escrow', 'issue insurance policy', 'submit insurance claim'],
      stats: { ...this.stats },
    };
  }
}

module.exports = new OrderFulfilmentPipelineAgent();
module.exports.OrderFulfilmentPipelineAgent = OrderFulfilmentPipelineAgent;
module.exports.classifyPerishable = classifyPerishable;
module.exports.STATUS = STATUS;
module.exports.BOUNDARY = BOUNDARY;
module.exports.numericTemperature = numericTemperature;
