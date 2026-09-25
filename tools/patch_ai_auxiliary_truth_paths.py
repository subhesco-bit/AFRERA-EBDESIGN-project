from pathlib import Path
import re
root=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN')

def patch_advanced(path):
    p=root/path
    if not p.exists(): return
    t=p.read_text(encoding='utf-8',errors='replace')
    if "const crypto = require('crypto');" not in t:
        # insert after express require when available
        if "const express = require('express');" in t:
            t=t.replace("const express = require('express');", "const express = require('express');\nconst crypto = require('crypto');",1)
        else:
            t="const crypto = require('crypto');\n"+t
    # Replace every getCurrentPrice definition with truthful market intelligence lookup
    pat=r"async function getCurrentPrice\(crop, location\) \{.*?(?=\n/\*\*)"
    repl="""async function getCurrentPrice(crop, location) {
  try {
    const marketPriceTruth = require('./commerce/marketPriceTruthService');
    const snapshot = await marketPriceTruth.marketSnapshot({ productName: String(crop || ''), days: 30 });
    const current = snapshot.current;
    if (!current || !Number.isFinite(Number(current.pricePerKgInr))) {
      return { price: null, status: 'unavailable', source: null, observed_at: null };
    }
    return {
      price: Number(current.pricePerKgInr),
      status: 'observed',
      source: current.sourceName || current.sourceType || null,
      observed_at: current.observedAt || null,
      location: location || current.geography || null,
    };
  } catch (error) {
    logger.warn('Voice price lookup unavailable', { crop, location, error: error.message });
    return { price: null, status: 'unavailable', source: null, observed_at: null };
  }
}"""
    t,n=re.subn(pat,repl,t,flags=re.S)
    # Replace market demand fake function(s)
    pat2=r"async function getMarketDemand\(crop\) \{.*?(?=\n/\*\*)"
    repl2="""async function getMarketDemand(crop) {
  const price = await getCurrentPrice(crop);
  return { demand: null, price: price.price, status: 'not_implemented', reason: 'No validated demand-forecast model is connected to the voice service.' };
}"""
    t,_=re.subn(pat2,repl2,t,flags=re.S)
    # Replace transcription mocks
    pat3=r"async function transcribeAudio\(audioData, language\) \{.*?(?=\n/\*\*)"
    repl3="""async function transcribeAudio(audioData, language) {
  const error = new Error('Voice transcription provider is not configured for this service.');
  error.code = 'VOICE_TRANSCRIPTION_NOT_CONFIGURED';
  throw error;
}"""
    t,_=re.subn(pat3,repl3,t,flags=re.S)
    # crypto conversation ids
    t=re.sub(r"`CONV-\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)\}`", "'CONV-'+crypto.randomUUID()", t)
    p.write_text(t,encoding='utf-8')
    print('patched',path,'getCurrentPrice replacements',n)

patch_advanced(Path('backend/src/services/advancedVoiceAI.js'))
patch_advanced(Path('backend/src/services/ai/advancedVoiceAI.js'))

# Make preserved legacy AI gateway execute the canonical compatibility adapter without deleting historical body.
p=root/'backend/src/services/legacy/aiGatewayService.js'
t=p.read_text(encoding='utf-8',errors='replace')
old='module.exports = new AiGatewayService();'
if old in t:
    t=t.replace(old, "module.exports = require('../ai/aiGatewayService');", 1)
elif "module.exports = require('../ai/aiGatewayService');" not in t:
    raise RuntimeError('legacy aiGateway export anchor missing')
p.write_text(t,encoding='utf-8')
print('legacy aiGateway routed to canonical compatibility adapter')