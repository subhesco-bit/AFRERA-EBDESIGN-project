-- 9995_village_commodity_master_seed.sql
-- Starter taxonomy; scheme/legal/product rules remain jurisdiction-aware.

BEGIN;

INSERT INTO village_production_commodities (commodity_code, commodity_name, category, subcategory, default_unit, market_form, perishable, cold_chain_required)
VALUES
('FISH_FRESH','Fresh Fish','protein','aquaculture','kg','fresh/chilled',true,true),
('PORK','Pig / Pork','protein','livestock','kg','live/fresh/chilled',true,true),
('CHICKEN','Chicken / Poultry Meat','protein','poultry','kg','live/fresh/chilled',true,true),
('GOAT_MEAT','Goat / Mutton','protein','livestock','kg','live/fresh/chilled',true,true),
('DUCK_MEAT','Duck Meat','protein','poultry','kg','fresh/chilled',true,true),
('EGG','Eggs','protein','poultry','dozen','fresh',true,false),
('COW_MILK','Cow Milk','dairy','milk','litre','fresh',true,true),
('BUFFALO_MILK','Buffalo Milk','dairy','milk','litre','fresh',true,true),
('GOAT_MILK','Goat Milk','dairy','milk','litre','fresh',true,true),
('CURD','Curd','dairy','processed','kg','chilled',true,true),
('PANEER','Paneer','dairy','processed','kg','chilled',true,true),
('GHEE','Ghee','dairy','processed','kg','packaged',false,false),
('TOMATO','Tomato','vegetable','fruiting','kg','fresh',true,false),
('BRINJAL','Brinjal','vegetable','fruiting','kg','fresh',true,false),
('CABBAGE','Cabbage','vegetable','leafy','kg','fresh',true,false),
('CAULIFLOWER','Cauliflower','vegetable','flowering','kg','fresh',true,false),
('BEANS','Beans','vegetable','legume','kg','fresh',true,false),
('CHILLI','Chilli','vegetable','fruiting','kg','fresh',true,false),
('POTATO','Potato','vegetable','tuber','kg','fresh',false,false),
('ONION','Onion','vegetable','bulb','kg','fresh',false,false),
('PUMPKIN','Pumpkin','vegetable','gourd','kg','fresh',false,false),
('BOTTLE_GOURD','Bottle Gourd','vegetable','gourd','kg','fresh',true,false),
('RICE','Rice','cereal','grain','kg','milled',false,false),
('MAIZE','Maize','cereal','grain','kg','grain',false,false),
('PULSES','Pulses','pulse','grain','kg','dry',false,false),
('MUSTARD','Mustard Seed','oilseed','seed','kg','dry',false,false),
('GINGER','Ginger','spice','rhizome','kg','fresh/dry',true,false),
('TURMERIC','Turmeric','spice','rhizome','kg','fresh/dry',false,false),
('HONEY','Honey','other','apiary','kg','packaged',false,false)
ON CONFLICT (commodity_code) DO UPDATE SET
  commodity_name=EXCLUDED.commodity_name,
  category=EXCLUDED.category,
  subcategory=EXCLUDED.subcategory,
  default_unit=EXCLUDED.default_unit,
  market_form=EXCLUDED.market_form,
  perishable=EXCLUDED.perishable,
  cold_chain_required=EXCLUDED.cold_chain_required,
  updated_at=NOW();

COMMIT;
