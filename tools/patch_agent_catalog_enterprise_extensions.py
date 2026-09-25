from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\agentTemplateCatalog.js')
t=p.read_text(encoding='utf-8')
if "enterpriseAgentTemplateExtensions" not in t:
    t=t.replace("const { PromptTemplateRegistry, AgentTemplateRegistry } = require('./agentTemplateRegistry');", "const { PromptTemplateRegistry, AgentTemplateRegistry } = require('./agentTemplateRegistry');\nconst { registerEnterpriseAgentExtensions } = require('./enterpriseAgentTemplateExtensions');",1)
anchor="  register('GRANT_SUBSIDY_AGENT',{name:'Grant/Subsidy Readiness Agent',stream:'funding',domain:'SCHEMES_SUBSIDY',pattern:'augmented_llm',riskClass:'elevated',promptId:'grant.subsidy',tools:['knowledge_search'],maxSteps:10,approvalPolicy:{humanReviewRequired:true},tags:['grant','subsidy','funding']});\n\n  return {promptRegistry:prompts,agentRegistry:agents};"
replacement="  register('GRANT_SUBSIDY_AGENT',{name:'Grant/Subsidy Readiness Agent',stream:'funding',domain:'SCHEMES_SUBSIDY',pattern:'augmented_llm',riskClass:'elevated',promptId:'grant.subsidy',tools:['knowledge_search'],maxSteps:10,approvalPolicy:{humanReviewRequired:true},tags:['grant','subsidy','funding']});\n\n  registerEnterpriseAgentExtensions(prompts, agents);\n\n  return {promptRegistry:prompts,agentRegistry:agents};"
if anchor not in t: raise RuntimeError('agent catalog return anchor missing')
t=t.replace(anchor,replacement,1)
p.write_text(t,encoding='utf-8')
print('enterprise template extensions wired')