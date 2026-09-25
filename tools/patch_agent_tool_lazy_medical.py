from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\agentToolRegistry.js')
t=p.read_text(encoding='utf-8')
t=t.replace("const { advancedMedicalCodingService } = require('../../services/advancedMedicalCodingService');\n","")
old="      systems:advancedMedicalCodingService.getMedicalCodeSystems(),"
new="      systems:require('../../services/advancedMedicalCodingService').advancedMedicalCodingService.getMedicalCodeSystems(),"
if old not in t: raise RuntimeError('medical systems anchor missing')
t=t.replace(old,new,1)
old2="      result:input.context==='dietitian'?advancedMedicalCodingService.getDietitianKnowledge(input.condition):advancedMedicalCodingService.getNaturalTherapistKnowledge(input.condition),"
new2="      result:(()=>{const svc=require('../../services/advancedMedicalCodingService').advancedMedicalCodingService;return input.context==='dietitian'?svc.getDietitianKnowledge(input.condition):svc.getNaturalTherapistKnowledge(input.condition);})(),"
if old2 not in t: raise RuntimeError('medical context anchor missing')
t=t.replace(old2,new2,1)
p.write_text(t,encoding='utf-8')
print('medical agent tools lazy-loaded')