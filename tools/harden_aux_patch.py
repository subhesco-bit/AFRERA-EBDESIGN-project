from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\patch_ai_auxiliary_truth_paths.py')
t=p.read_text(encoding='utf-8')
t=t.replace("pat=r\"async function getCurrentPrice\\(crop, location\\) \\{.*?\\n\\}\"", "pat=r\"async function getCurrentPrice\\(crop, location\\) \\{.*?(?=\\n/\\*\\*)\"")
t=t.replace("pat2=r\"async function getMarketDemand\\(crop\\) \\{.*?\\n\\}\"", "pat2=r\"async function getMarketDemand\\(crop\\) \\{.*?(?=\\n/\\*\\*)\"")
t=t.replace("pat3=r\"async function transcribeAudio\\(audioData, language\\) \\{.*?\\n\\}\"", "pat3=r\"async function transcribeAudio\\(audioData, language\\) \\{.*?(?=\\n/\\*\\*)\"")
p.write_text(t,encoding='utf-8')
print('auxiliary patch boundaries hardened')