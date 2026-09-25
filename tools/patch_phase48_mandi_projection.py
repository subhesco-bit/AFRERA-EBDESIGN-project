from pathlib import Path

# 1) Extend source catalog with manual APMC and trader-report classes.
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\commerce\marketPriceTruthService.js')
t=p.read_text(encoding='utf-8')
anchor="  AFRERA_FARMER_LISTING_ASK: {"
insert="""  APMC_MANUAL: {
    sourceType:'apmc_manual', sourceName:'Manual APMC observation', sourceAuthority:'manual_observation',
    collectionMethod:'manual_observation', marketLevel:'mandi_wholesale', verificationStatus:'OBSERVED_MANUAL',
    baseConfidence:0.70, freshnessDays:3, benchmarkEligible:true,
  },
  TRADER_REPORT: {
    sourceType:'trader_report', sourceName:'Trader-reported market price', sourceAuthority:'reported_market',
    collectionMethod:'manual_observation', marketLevel:'mandi_wholesale', verificationStatus:'REPORTED_UNCORROBORATED',
    baseConfidence:0.55, freshnessDays:2, benchmarkEligible:false,
  },
"""
if anchor not in t: raise RuntimeError('source catalog anchor missing')
if "APMC_MANUAL" not in t: t=t.replace(anchor,insert+anchor,1)
p.write_text(t,encoding='utf-8')

# 2) Remove hard-coded sample API key from official loader.
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\jobs\loadMandiPrices.js')
t=p.read_text(encoding='utf-8')
old="""// data.gov.in publishes a shared sample key for public datasets. A deployment
// should set DATA_GOV_IN_KEY to its own — the shared one is rate-limited and
// will start returning empty pages under any real load, which looks exactly
// like \"no market data today\".
const SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
"""
new="""function requireApiKey(apiKey) {
  const key = apiKey || process.env.DATA_GOV_IN_KEY;
  if (!key) {
    const error = new Error('DATA_GOV_IN_KEY is required for the official data.gov.in mandi feed');
    error.code = 'MANDI_API_KEY_MISSING';
    throw error;
  }
  return key;
}
"""
if old not in t: raise RuntimeError('sample key block missing')
t=t.replace(old,new,1)
t=t.replace("'api-key': apiKey || process.env.DATA_GOV_IN_KEY || SAMPLE_KEY,","'api-key': requireApiKey(apiKey),",1)
t=t.replace("module.exports = { run, fetchPage, toIsoDate, NE_STATES };","module.exports = { run, fetchPage, toIsoDate, requireApiKey, NE_STATES };",1)
p.write_text(t,encoding='utf-8')

# 3) Project raw mandi modal observations into canonical price_intelligence.
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\legacy\marketDataService.js')
t=p.read_text(encoding='utf-8')
if "marketPriceTruthService" not in t:
    t=t.replace("const { logger } = require('../../utils/logger');","const { logger } = require('../../utils/logger');\nconst marketPriceTruth = require('../commerce/marketPriceTruthService');",1)
t=t.replace("const out = { inserted: 0, skipped: 0, rejected: [] };","const out = { inserted: 0, skipped: 0, rejected: [], projected: 0, projectionSkipped: 0, projectionErrors: [] };",1)
old="""      if (res.rows.length) out.inserted += 1; else out.skipped += 1;
    } catch (err) {
      out.rejected.push({ record: r, reason: err.message });
    }
"""
new="""      if (res.rows.length) {
        out.inserted += 1;
        if (modal !== null) {
          const sourceKey = {
            agmarknet: 'AGMARKNET_OGD',
            enam: 'ENAM_TRADED',
            apmc_manual: 'APMC_MANUAL',
            trader_report: 'TRADER_REPORT',
            estimated: 'ESTIMATED',
          }[source];
          try {
            const projected = await marketPriceTruth.persistObservation({
              sourceKey,
              commodity: r.commodity,
              productName: r.commodity,
              variety: r.variety ?? null,
              grade: r.grade ?? null,
              price: modal,
              unit: 'qtl',
              priceKind: 'modal',
              observedAt: r.date ?? r.price_date,
              geography: {
                country: 'India',
                state: r.state ?? null,
                district: r.district ?? null,
                market: r.market ?? r.market_name,
              },
              matchConfidence: 1,
              sourceRecordId: `mandi:${res.rows[0].id}:modal`,
            }, { db: pool });
            if (projected.inserted) out.projected += 1; else out.projectionSkipped += 1;
          } catch (projectionError) {
            out.projectionErrors.push({ sourceRecordId: `mandi:${res.rows[0].id}:modal`, reason: projectionError.message });
          }
        }
      } else {
        out.skipped += 1;
      }
    } catch (err) {
      out.rejected.push({ record: r, reason: err.message });
    }
"""
if old not in t: raise RuntimeError('mandi insert result block missing')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')

print('phase48 official loader and mandi truth projection patched')