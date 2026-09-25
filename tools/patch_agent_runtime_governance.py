from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\agentRuntimeService.js')
t=p.read_text(encoding='utf-8')
old="    this.sdkLoader=options.sdkLoader||(()=>import('ai'));"
new="    this.sdkLoader=options.sdkLoader||(()=>import('ai'));\n    this.governance=options.governance||aiGovernance;"
if old not in t: raise RuntimeError('sdk loader anchor missing')
t=t.replace(old,new,1)
old2='const audit=await aiGovernance.audit({'
new2='const audit=await this.governance.audit({'
if old2 not in t: raise RuntimeError('governance audit anchor missing')
t=t.replace(old2,new2,1)
p.write_text(t,encoding='utf-8')
print('agent runtime governance injected')