from pathlib import Path
root=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN')

p=root/'backend/src/core/ai/agentRuntimeService.js'
t=p.read_text(encoding='utf-8')
t=t.replace("const aiGovernance = require('../../services/aiGovernanceService');\n","")
t=t.replace("    this.governance=options.governance||aiGovernance;","    this.governance=options.governance||null;")
old="    const audit=await this.governance.audit({"
new="    const governance=this.governance||require('../../services/aiGovernanceService');\n    const audit=await governance.audit({"
if old not in t: raise RuntimeError('audit anchor missing')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')

p=root/'tools/build-agent-template-catalog.js'
t=p.read_text(encoding='utf-8')
t=t.replace("const { AgentRuntimeService }=require(path.join(root,'backend','src','core','ai','agentRuntimeService'));\n","")
t=t.replace("const runtime=new AgentRuntimeService({templateBundle:{promptRegistry,agentRegistry},toolRegistry,env:{},governance:{audit:async()=>({persisted:false})}});\n","")
p.write_text(t,encoding='utf-8')
print('removed metadata-time governance/db side effects')