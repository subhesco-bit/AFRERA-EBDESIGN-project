from pathlib import Path
root=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN')

# nested voice import + truthful comments
for rel,nested in [('backend/src/services/advancedVoiceAI.js',False),('backend/src/services/ai/advancedVoiceAI.js',True)]:
 p=root/rel; t=p.read_text(encoding='utf-8',errors='replace')
 if nested: t=t.replace("require('./commerce/marketPriceTruthService')","require('../commerce/marketPriceTruthService')")
 t=t.replace('Get Current Price (Mock implementation)','Get Current Price (observed market intelligence; unavailable when no evidence exists)')
 t=t.replace('Get Market Demand (Mock implementation)','Get Market Demand (explicitly unimplemented until a validated forecast model is connected)')
 t=t.replace('Transcribe Audio (Mock implementation)','Transcribe Audio (fail-closed until a real speech provider is connected)')
 p.write_text(t,encoding='utf-8')

# remove unreachable placeholder SQL from alternate advisory scaffold; make ephemeral status explicit
p=root/'backend/src/services/ai/aiAdvisoryService.js'
t=p.read_text(encoding='utf-8',errors='replace')
old="""  try {
    const pg = getPostgreSQL();
    if (pg && false) {
      const result = await pg.query('SELECT * FROM _placeholder ORDER BY created_at DESC LIMIT 100');
      return res.json({ success: true, data: result.rows });
    }
    res.json({ success: true, data: _items });
  } catch (error) {
    logger.warn('aiAdvisoryService list query failed, falling back to in-memory store', { error: error.message });
    res.json({ success: true, data: _items });
  }"""
new="""  res.json({ success: true, data: _items, storage: 'ephemeral_in_memory', authoritative: false });"""
if old in t: t=t.replace(old,new,1)
t=t.replace("const { getPostgreSQL } = require('../../database/connection');\n",'')
p.write_text(t,encoding='utf-8')

# omnichannel transcribe fail-closed in both copies
for rel in ['backend/src/services/ai/omnichannelAIService.js','backend/src/services/legacy/omnichannelAIService.js']:
 p=root/rel; t=p.read_text(encoding='utf-8',errors='replace')
 start=t.find('async function transcribeAudio(audioFile, language) {')
 if start!=-1:
  end=t.find('\n}',start)
  if end!=-1:
   replacement="""async function transcribeAudio(audioFile, language) {
  const error = new Error('Voice transcription provider is not configured for omnichannel AI.');
  error.code = 'VOICE_TRANSCRIPTION_NOT_CONFIGURED';
  throw error;
}"""
   t=t[:start]+replacement+t[end+2:]
 t=t.replace('// Mock transcription - in production, would use speech-to-text API','// Transcription fails closed unless a real speech provider is configured')
 t=t.replace('confidence: 0.95,','confidence: null,')
 t=t.replace('// Mock implementation','// Fail-closed compatibility path')
 p.write_text(t,encoding='utf-8')
print('AI auxiliary truth paths finalized')