from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\routes\aiAgentRoutes.js')
t=p.read_text(encoding='utf-8')
old="""    templates:c.agents.templates,
    streams:c.agents.streams,
    domains:c.domains.canonicalDomains,"""
new="""    templates:c.agents.templates,
    streams:c.agents.streams,
    medicalTemplates:c.agents.medicalTemplates,
    domains:c.domains.canonicalDomains,"""
if old not in t: raise RuntimeError('health compatibility anchor missing')
p.write_text(t.replace(old,new,1),encoding='utf-8')
print('health compatibility field restored')