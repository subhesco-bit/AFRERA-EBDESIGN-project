-- Advance-warning ingestion: make the alert vocabulary match what the real
-- national and international feeds actually emit, and give the forecast
-- pipeline grid points to hang observations on.
--
-- climate_alerts.alert_type was written before any feed was connected. Its
-- eleven values cannot express most of what NDMA Sachet publishes: on the day
-- this was written, of 73 live Sachet alerts the largest categories were
-- thunderstorm and gusty-wind warnings, neither of which had a value. The
-- previous options were to drop those alerts or file them as heavy_rain. A
-- lightning warning recorded as heavy rain is worse than no alert, because the
-- farmer reads the recommended action for the wrong hazard.
--
-- So the vocabulary grows to fit the source rather than the source being bent
-- to fit it. Nothing is removed; every existing value stays legal.

ALTER TABLE climate_alerts DROP CONSTRAINT IF EXISTS climate_alerts_alert_type_check;
ALTER TABLE climate_alerts ADD CONSTRAINT climate_alerts_alert_type_check
  CHECK (alert_type IN (
    'heavy_rain','flood','landslide','drought','hailstorm','cold_wave',
    'heat_wave','cyclone','earthquake','frost','pest_outbreak',
    'thunderstorm','lightning','high_wind','dust_storm','fog',
    'wildfire','volcano','tsunami'
  ));

-- Provenance. source/source_ref existed but nothing recorded who fetched what,
-- when, or whether the fetch even succeeded. Without that, an empty alert
-- table is indistinguishable from a quiet day -- the single most dangerous
-- ambiguity a warning system can have.
CREATE TABLE IF NOT EXISTS warning_source_runs (
  id                BIGSERIAL PRIMARY KEY,
  provider          VARCHAR(40)  NOT NULL,
  scope             VARCHAR(20)  NOT NULL CHECK (scope IN ('national','international')),
  kind              VARCHAR(20)  NOT NULL CHECK (kind IN ('alert','forecast','observation')),
  started_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at       TIMESTAMP,
  outcome           VARCHAR(20)  NOT NULL DEFAULT 'running'
                      CHECK (outcome IN ('running','ok','partial','failed','unavailable')),
  records_seen      INTEGER      NOT NULL DEFAULT 0,
  records_written   INTEGER      NOT NULL DEFAULT 0,
  records_skipped   INTEGER      NOT NULL DEFAULT 0,
  unmapped          JSONB,
  error             TEXT,
  CHECK (outcome <> 'failed' OR error IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_warning_runs_provider ON warning_source_runs (provider, started_at DESC);

-- How stale is each feed right now? A warning system that cannot answer this
-- is trusting silence.
CREATE OR REPLACE VIEW v_warning_source_health AS
SELECT DISTINCT ON (provider)
       provider, scope, kind, outcome,
       started_at AS last_run_at,
       records_written AS last_written,
       error AS last_error,
       ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) / 60)::INT AS minutes_since_run
  FROM warning_source_runs
 ORDER BY provider, started_at DESC;

-- Grid points. These are NOT IMD stations and must not be mistaken for them:
-- station_type 'grid' and operator 'open-meteo' say so on every row. They are
-- district-headquarters coordinates used to pull reanalysis and model output
-- for districts that have no instrument in them -- which is every district the
-- platform serves.
-- station_type allowed imd / awse / private / farm_sensor / satellite_derived /
-- manual. A model grid point is none of those, and 'satellite_derived' would
-- be a false claim -- ERA5 assimilates satellite data but is a model
-- reanalysis, not an observation from orbit. 'grid' names it for what it is.
ALTER TABLE weather_stations DROP CONSTRAINT IF EXISTS weather_stations_station_type_check;
ALTER TABLE weather_stations ADD CONSTRAINT weather_stations_station_type_check
  CHECK (station_type IN ('imd','awse','private','farm_sensor','satellite_derived','manual','grid'));

INSERT INTO weather_stations (station_code, station_name, state, district, latitude, longitude, station_type, operator, active)
VALUES
  ('GRID-AS-KAMRUP',   'Guwahati (grid)',        'Assam','Kamrup Metropolitan',26.1445,91.7362,'grid','open-meteo',TRUE),
  ('GRID-AS-JORHAT',   'Jorhat (grid)',          'Assam','Jorhat',             26.7509,94.2037,'grid','open-meteo',TRUE),
  ('GRID-AS-DIBRU',    'Dibrugarh (grid)',       'Assam','Dibrugarh',          27.4728,94.9120,'grid','open-meteo',TRUE),
  ('GRID-AS-CACHAR',   'Silchar (grid)',         'Assam','Cachar',             24.8333,92.7789,'grid','open-meteo',TRUE),
  ('GRID-AS-NAGAON',   'Nagaon (grid)',          'Assam','Nagaon',             26.3464,92.6840,'grid','open-meteo',TRUE),
  ('GRID-AS-SONITPUR', 'Tezpur (grid)',          'Assam','Sonitpur',           26.6338,92.7999,'grid','open-meteo',TRUE),
  ('GRID-AS-TINSUKIA', 'Tinsukia (grid)',        'Assam','Tinsukia',           27.4922,95.3468,'grid','open-meteo',TRUE),
  ('GRID-AS-BARPETA',  'Barpeta (grid)',         'Assam','Barpeta',            26.3222,91.0055,'grid','open-meteo',TRUE),
  ('GRID-AS-GOLAGHAT', 'Golaghat (grid)',        'Assam','Golaghat',           26.5137,93.9598,'grid','open-meteo',TRUE),
  ('GRID-AS-KARIMGANJ','Karimganj (grid)',       'Assam','Karimganj',          24.8697,92.3592,'grid','open-meteo',TRUE),
  ('GRID-AS-DHUBRI',   'Dhubri (grid)',          'Assam','Dhubri',             26.0207,89.9776,'grid','open-meteo',TRUE),
  ('GRID-AS-BONGAI',   'Bongaigaon (grid)',      'Assam','Bongaigaon',         26.4831,90.5586,'grid','open-meteo',TRUE),
  ('GRID-AS-SIVASAGAR','Sivasagar (grid)',       'Assam','Sivasagar',          26.9826,94.6425,'grid','open-meteo',TRUE),
  ('GRID-AS-GOALPARA', 'Goalpara (grid)',        'Assam','Goalpara',           26.1667,90.6259,'grid','open-meteo',TRUE),
  ('GRID-AS-MORIGAON', 'Morigaon (grid)',        'Assam','Morigaon',           26.2506,92.3417,'grid','open-meteo',TRUE),
  ('GRID-AS-LAKHIMPUR','North Lakhimpur (grid)', 'Assam','Lakhimpur',          27.2359,94.1052,'grid','open-meteo',TRUE),
  ('GRID-ML-EKH',      'Shillong (grid)',        'Meghalaya','East Khasi Hills',25.5788,91.8933,'grid','open-meteo',TRUE),
  ('GRID-ML-WGH',      'Tura (grid)',            'Meghalaya','West Garo Hills', 25.5138,90.2172,'grid','open-meteo',TRUE),
  ('GRID-ML-WJH',      'Jowai (grid)',           'Meghalaya','West Jaintia Hills',25.4497,92.2019,'grid','open-meteo',TRUE),
  ('GRID-ML-WKH',      'Nongstoin (grid)',       'Meghalaya','West Khasi Hills',25.5192,91.2639,'grid','open-meteo',TRUE),
  ('GRID-MN-IMPHALW',  'Imphal West (grid)',     'Manipur','Imphal West',      24.8074,93.9384,'grid','open-meteo',TRUE),
  ('GRID-MN-IMPHALE',  'Imphal East (grid)',     'Manipur','Imphal East',      24.8103,94.0000,'grid','open-meteo',TRUE),
  ('GRID-MN-CCPUR',    'Churachandpur (grid)',   'Manipur','Churachandpur',    24.3333,93.6833,'grid','open-meteo',TRUE),
  ('GRID-MN-BISHNU',   'Bishnupur (grid)',       'Manipur','Bishnupur',        24.6333,93.7833,'grid','open-meteo',TRUE),
  ('GRID-MN-UKHRUL',   'Ukhrul (grid)',          'Manipur','Ukhrul',           25.1050,94.3608,'grid','open-meteo',TRUE),
  ('GRID-MZ-AIZAWL',   'Aizawl (grid)',          'Mizoram','Aizawl',           23.7271,92.7176,'grid','open-meteo',TRUE),
  ('GRID-MZ-LUNGLEI',  'Lunglei (grid)',         'Mizoram','Lunglei',          22.8879,92.7332,'grid','open-meteo',TRUE),
  ('GRID-MZ-CHAMPHAI', 'Champhai (grid)',        'Mizoram','Champhai',         23.4560,93.3290,'grid','open-meteo',TRUE),
  ('GRID-MZ-KOLASIB',  'Kolasib (grid)',         'Mizoram','Kolasib',          24.2237,92.6784,'grid','open-meteo',TRUE),
  ('GRID-NL-KOHIMA',   'Kohima (grid)',          'Nagaland','Kohima',          25.6751,94.1086,'grid','open-meteo',TRUE),
  ('GRID-NL-DIMAPUR',  'Dimapur (grid)',         'Nagaland','Dimapur',         25.9063,93.7276,'grid','open-meteo',TRUE),
  ('GRID-NL-MKG',      'Mokokchung (grid)',      'Nagaland','Mokokchung',      26.3220,94.5230,'grid','open-meteo',TRUE),
  ('GRID-NL-MON',      'Mon (grid)',             'Nagaland','Mon',             26.7500,95.0600,'grid','open-meteo',TRUE),
  ('GRID-TR-WEST',     'Agartala (grid)',        'Tripura','West Tripura',     23.8315,91.2868,'grid','open-meteo',TRUE),
  ('GRID-TR-DHALAI',   'Ambassa (grid)',         'Tripura','Dhalai',           23.9370,91.8540,'grid','open-meteo',TRUE),
  ('GRID-TR-SOUTH',    'Belonia (grid)',         'Tripura','South Tripura',    23.2500,91.4500,'grid','open-meteo',TRUE),
  ('GRID-TR-NORTH',    'Dharmanagar (grid)',     'Tripura','North Tripura',    24.3667,92.1667,'grid','open-meteo',TRUE),
  ('GRID-AR-PAPUM',    'Itanagar (grid)',        'Arunachal Pradesh','Papum Pare',27.0844,93.6053,'grid','open-meteo',TRUE),
  ('GRID-AR-TAWANG',   'Tawang (grid)',          'Arunachal Pradesh','Tawang', 27.5860,91.8590,'grid','open-meteo',TRUE),
  ('GRID-AR-ESIANG',   'Pasighat (grid)',        'Arunachal Pradesh','East Siang',28.0667,95.3333,'grid','open-meteo',TRUE),
  ('GRID-AR-LSUB',     'Ziro (grid)',            'Arunachal Pradesh','Lower Subansiri',27.6300,93.8300,'grid','open-meteo',TRUE),
  ('GRID-AR-LOHIT',    'Tezu (grid)',            'Arunachal Pradesh','Lohit',  27.9200,96.1600,'grid','open-meteo',TRUE),
  ('GRID-SK-GANGTOK',  'Gangtok (grid)',         'Sikkim','East Sikkim',       27.3314,88.6138,'grid','open-meteo',TRUE),
  ('GRID-SK-NAMCHI',   'Namchi (grid)',          'Sikkim','South Sikkim',      27.1667,88.3500,'grid','open-meteo',TRUE),
  ('GRID-SK-GYALSHING','Gyalshing (grid)',       'Sikkim','West Sikkim',       27.2833,88.2600,'grid','open-meteo',TRUE),
  ('GRID-SK-MANGAN',   'Mangan (grid)',          'Sikkim','North Sikkim',      27.5100,88.5300,'grid','open-meteo',TRUE)
ON CONFLICT (station_code) DO NOTHING;

-- Observation provenance vocabulary. weather_observations.source allowed only
-- imd / isro / openweather / farm_sensor / manual / interpolated, and
-- quality_flag only raw / validated / suspect / interpolated / rejected.
-- Reanalysis is none of those. It is not an instrument reading and it is not
-- an interpolation between instrument readings -- it is a physical model's
-- best estimate of what the weather was, and filing it as 'interpolated' would
-- claim gauges existed nearby to interpolate between. In these districts there
-- are none, which is the whole reason this data is being pulled.
--
-- So the vocabulary gains honest values instead. A district reading its own
-- rainfall history can then see that no gauge stood in that field.
ALTER TABLE weather_observations DROP CONSTRAINT IF EXISTS weather_observations_source_check;
ALTER TABLE weather_observations ADD CONSTRAINT weather_observations_source_check
  CHECK (source IN ('imd','isro','openweather','farm_sensor','manual','interpolated',
                    'era5','ecmwf','open_meteo'));

ALTER TABLE weather_observations DROP CONSTRAINT IF EXISTS weather_observations_quality_flag_check;
ALTER TABLE weather_observations ADD CONSTRAINT weather_observations_quality_flag_check
  CHECK (quality_flag IN ('raw','validated','suspect','interpolated','rejected','reanalysis'));

-- climate_alerts.source had no CHECK at all and defaulted to 'imd', so an
-- ingested Sachet alert would have been indistinguishable from an IMD one had
-- the adapter forgotten to set it. Name the sources that may write here.
ALTER TABLE climate_alerts DROP CONSTRAINT IF EXISTS climate_alerts_source_check;
ALTER TABLE climate_alerts ADD CONSTRAINT climate_alerts_source_check
  CHECK (source IN ('imd','ndma_sachet','gdacs','sdma','manual','internal_model','ecmwf'));
