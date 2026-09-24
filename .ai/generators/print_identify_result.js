const fs = require('fs');
const path = require('path');
const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'identify_result.json'), 'utf8')).data.result;
console.log('top:', r.top.id, r.top.name, 'confidence:', r.top.confidence, 'matched:', JSON.stringify(r.top.matched_symptoms));
console.log('fallback_ran:', r.symptom_extraction_fallback, 'symptoms_used:', JSON.stringify(r.symptoms_used));
