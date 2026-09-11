-- M041 — Village Registry canonical data model reference
--
-- IMPORTANT: runtime schema is owned by migrations, not this reference file.
-- Canonical village table:
--   012_governance_module.sql  -> villages
--   053_village_registry_completion.sql -> village registry extensions
-- Canonical community-resource table:
--   9511_m041_m041.sql -> village_resources
--
-- This file intentionally contains no CREATE TABLE statements so it cannot
-- create a competing `villages` schema with a different primary key/type.

/*
VILLAGES — canonical runtime table

Identity
  id                         SERIAL PRIMARY KEY
  village_code               VARCHAR(50) UNIQUE NOT NULL
  name                       VARCHAR(255) NOT NULL

Geography
  state                      VARCHAR(255) NOT NULL
  district                   VARCHAR(255) NOT NULL
  block                      VARCHAR(255)
  tehsil                     VARCHAR(255)
  gram_panchayat             VARCHAR(255)
  pincode                    VARCHAR(10)
  coordinates                JSONB
  area_sq_km                 NUMERIC(12,3)
  elevation                  NUMERIC(10,2)
  climate_zone               VARCHAR(100)
  soil_type                  VARCHAR(100)

Demographics / economy
  population                 INTEGER
  households                 INTEGER
  demographics               JSONB
  avg_income                 NUMERIC(15,2)
  literacy_rate              NUMERIC(5,2)
  irrigation_coverage        NUMERIC(5,2)
  agricultural_land_area     NUMERIC(12,3)

Resources / production
  water_sources              JSONB
  infrastructure             JSONB
  major_crops                JSONB
  livestock_count            JSONB

Infrastructure services
  electrified_households     INTEGER
  road_access                BOOLEAN
  market_distance_km         NUMERIC(10,2)
  financial_institutions_count INTEGER
  schools_count              INTEGER
  health_centers_count       INTEGER
  cooperative_societies_count INTEGER

AI / governance
  ai_development_index       NUMERIC(5,2)
  notes                      TEXT
  status                     VARCHAR(30)
  created_at                 TIMESTAMP
  updated_at                 TIMESTAMP

VILLAGE_RESOURCES — canonical runtime table

  resource_id                VARCHAR(50) PRIMARY KEY
  village_id                 VARCHAR(50) NOT NULL
  resource_type              VARCHAR(50)
  resource_name              VARCHAR(200)
  capacity                   DECIMAL(15,2)
  current_utilization        DECIMAL(5,2)
  condition                  VARCHAR(20)
  last_maintenance_date      DATE
  next_maintenance_date      DATE
  responsible_person         VARCHAR(100)
  created_at                 TIMESTAMP
  updated_at                 TIMESTAMP

APPLICATION CONTRACT

  GET    /backend-modules/M041/villages
  GET    /backend-modules/M041/villages/:villageId
  POST   /backend-modules/M041/villages
  PUT    /backend-modules/M041/villages/:villageId
  DELETE /backend-modules/M041/villages/:villageId
  POST   /backend-modules/M041/villages/:villageId/resources
  GET    /backend-modules/M041/villages/:villageId/analytics
*/
