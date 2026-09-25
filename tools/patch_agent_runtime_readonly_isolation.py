from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\agentRuntimeService.js')
t=p.read_text(encoding='utf-8')
old="  async _compileTools(template,sdk){\n    const compiled={};\n    for(const toolId of template.tools){\n      const def=this.toolRegistry.get(toolId);\n      if(!def){const e=new Error('Template references unregistered tool: '+toolId);e.code='AGENT_TOOL_UNREGISTERED';throw e;}\n      compiled[toolId]=sdk.tool({"
new="  async _compileTools(template,sdk,options={}){\n    const compiled={};\n    const readOnly=options.toolPolicy==='read_only';\n    for(const toolId of template.tools){\n      const def=this.toolRegistry.get(toolId);\n      if(!def){const e=new Error('Template references unregistered tool: '+toolId);e.code='AGENT_TOOL_UNREGISTERED';throw e;}\n      if(readOnly && (def.mutates || def.needsApproval)) continue;\n      compiled[toolId]=sdk.tool({"
if old not in t: raise RuntimeError('compileTools block missing')
t=t.replace(old,new,1)
old2="    const tools=await this._compileTools(template,sdk);"
new2="    const tools=await this._compileTools(template,sdk,options);"
if old2 not in t: raise RuntimeError('compileTools call missing')
t=t.replace(old2,new2,1)
old3="      metadata:{templateId,templateVersion:template.version,model:plan.selectedModel,promptHash:plan.prompt.instructionsSha256,usage},"
new3="      metadata:{templateId,templateVersion:template.version,model:plan.selectedModel,promptHash:plan.prompt.instructionsSha256,usage,toolPolicy:options.toolPolicy||'governed'},"
if old3 not in t: raise RuntimeError('audit metadata block missing')
t=t.replace(old3,new3,1)
old4="      warnings:result.warnings||[],"
new4="      warnings:result.warnings||[],\n      toolPolicy:options.toolPolicy||'governed',\n      toolCountPresented:Object.keys(tools).length,"
if old4 not in t: raise RuntimeError('result warnings block missing')
t=t.replace(old4,new4,1)
p.write_text(t,encoding='utf-8')
print('agent runtime external isolation tool policy added')