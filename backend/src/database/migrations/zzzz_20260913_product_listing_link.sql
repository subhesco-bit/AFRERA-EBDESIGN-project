-- Relate product_listings to products, and put its id on the same type as
-- every other id in the schema.
--
-- The database held two parallel product entities with nothing joining them:
--
--   products          id uuid    catalogue item      (order_items.product_id FKs here)
--   product_listings  id varchar marketplace offer   (seller, price, nutrition, visibility)
--
-- Seven ecommerce services join order_items.product_id (uuid) straight to
-- product_listings.id (varchar), which Postgres rejects — 15 API 500s reading
-- "operator does not exist: uuid = character varying". Joining products
-- instead does not work either: those queries select seller_id,
-- listing_status, nutrition_score, visibility_score, product_name and
-- quantity, none of which exist on products.
--
-- The two entities are both legitimate — a catalogue item can be offered by
-- several sellers — so the fix is the relationship that was missing, not the
-- deletion of either side. A listing now belongs to a product, and the
-- analytics reaches listings through that relationship rather than by
-- pretending an order line is a listing id.
--
-- The id type is corrected in the same change because the varchar was not an
-- isolated slip: 16 foreign keys across 16 tables mirror it. Every one of
-- those tables is empty today, so this is a metadata-only change; once
-- product_listings carries data it stops being cheap.

-- ---------------------------------------------------------------- drop FKs

ALTER TABLE dietitian_collection_products    DROP CONSTRAINT IF EXISTS dietitian_collection_products_product_id_fkey;
ALTER TABLE recipe_product_recommendations   DROP CONSTRAINT IF EXISTS recipe_product_recommendations_product_id_fkey;
ALTER TABLE user_health_product_interactions DROP CONSTRAINT IF EXISTS user_health_product_interactions_product_id_fkey;
ALTER TABLE nutrition_pricing_history        DROP CONSTRAINT IF EXISTS nutrition_pricing_history_product_id_fkey;
ALTER TABLE product_recipe_compatibility     DROP CONSTRAINT IF EXISTS product_recipe_compatibility_product_id_fkey;
ALTER TABLE inventory_optimization           DROP CONSTRAINT IF EXISTS inventory_optimization_product_id_fkey;
ALTER TABLE market_basket_analysis           DROP CONSTRAINT IF EXISTS market_basket_analysis_product_a_id_fkey;
ALTER TABLE market_basket_analysis           DROP CONSTRAINT IF EXISTS market_basket_analysis_product_b_id_fkey;
ALTER TABLE inventory_adjustments            DROP CONSTRAINT IF EXISTS inventory_adjustments_product_id_fkey;
ALTER TABLE purchase_orders                  DROP CONSTRAINT IF EXISTS purchase_orders_product_id_fkey;
ALTER TABLE production_orders                DROP CONSTRAINT IF EXISTS production_orders_product_id_fkey;
ALTER TABLE sponsored_products               DROP CONSTRAINT IF EXISTS sponsored_products_product_id_fkey;
ALTER TABLE retargeting_campaigns            DROP CONSTRAINT IF EXISTS retargeting_campaigns_product_id_fkey;
ALTER TABLE nutrient_content_verification    DROP CONSTRAINT IF EXISTS nutrient_content_verification_product_id_fkey;
ALTER TABLE nutrient_value_pricing           DROP CONSTRAINT IF EXISTS nutrient_value_pricing_product_id_fkey;
ALTER TABLE nutrient_certificates            DROP CONSTRAINT IF EXISTS nutrient_certificates_product_id_fkey;

-- ------------------------------------------------------- convert to uuid

ALTER TABLE product_listings
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE uuid USING NULLIF(id, '')::uuid,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE dietitian_collection_products    ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE recipe_product_recommendations   ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE user_health_product_interactions ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE nutrition_pricing_history        ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE product_recipe_compatibility     ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE inventory_optimization           ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE market_basket_analysis           ALTER COLUMN product_a_id TYPE uuid USING NULLIF(product_a_id, '')::uuid;
ALTER TABLE market_basket_analysis           ALTER COLUMN product_b_id TYPE uuid USING NULLIF(product_b_id, '')::uuid;
ALTER TABLE inventory_adjustments            ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE purchase_orders                  ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE production_orders                ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE sponsored_products               ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE retargeting_campaigns            ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE nutrient_content_verification    ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE nutrient_value_pricing           ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;
ALTER TABLE nutrient_certificates            ALTER COLUMN product_id   TYPE uuid USING NULLIF(product_id, '')::uuid;

-- --------------------------------------------------------- restore FKs

ALTER TABLE dietitian_collection_products    ADD CONSTRAINT dietitian_collection_products_product_id_fkey    FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE recipe_product_recommendations   ADD CONSTRAINT recipe_product_recommendations_product_id_fkey   FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE user_health_product_interactions ADD CONSTRAINT user_health_product_interactions_product_id_fkey FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE nutrition_pricing_history        ADD CONSTRAINT nutrition_pricing_history_product_id_fkey        FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE product_recipe_compatibility     ADD CONSTRAINT product_recipe_compatibility_product_id_fkey     FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE inventory_optimization           ADD CONSTRAINT inventory_optimization_product_id_fkey           FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE market_basket_analysis           ADD CONSTRAINT market_basket_analysis_product_a_id_fkey         FOREIGN KEY (product_a_id) REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE market_basket_analysis           ADD CONSTRAINT market_basket_analysis_product_b_id_fkey         FOREIGN KEY (product_b_id) REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE inventory_adjustments            ADD CONSTRAINT inventory_adjustments_product_id_fkey            FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE purchase_orders                  ADD CONSTRAINT purchase_orders_product_id_fkey                  FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE production_orders                ADD CONSTRAINT production_orders_product_id_fkey                FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE sponsored_products               ADD CONSTRAINT sponsored_products_product_id_fkey               FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE retargeting_campaigns            ADD CONSTRAINT retargeting_campaigns_product_id_fkey            FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE nutrient_content_verification    ADD CONSTRAINT nutrient_content_verification_product_id_fkey    FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE nutrient_value_pricing           ADD CONSTRAINT nutrient_value_pricing_product_id_fkey           FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;
ALTER TABLE nutrient_certificates            ADD CONSTRAINT nutrient_certificates_product_id_fkey            FOREIGN KEY (product_id)   REFERENCES product_listings(id) ON DELETE CASCADE;

-- ------------------------------------- the relationship that was missing

-- A listing is an offer OF a catalogue product. Nullable, because a seller may
-- draft a listing before it is matched to a catalogue entry; the analytics
-- joins are LEFT joins for the same reason.
ALTER TABLE product_listings
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_listings_product_id ON product_listings (product_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_seller_id  ON product_listings (seller_id);

COMMENT ON COLUMN product_listings.product_id IS
  'The catalogue product this listing offers. order_items.product_id references products(id), so analytics reaches listing attributes as order_items -> products -> product_listings, never by equating an order line with a listing id.';
