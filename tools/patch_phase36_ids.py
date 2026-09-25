from pathlib import Path

root=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN')

p=root/'backend/src/core/signalBus.js'
t=p.read_text(encoding='utf-8')
old="correlationId: meta.correlationId || `sig_${Date.now()}_${Math.round(Math.random() * 1e6)}`,"
new="correlationId: meta.correlationId || crypto.randomUUID(),"
if old in t:
    t=t.replace(old,new,1)
if "cloudEvent: meta.cloudEvent || null" not in t:
    anchor="      timestamp: new Date().toISOString(),"
    repl=anchor+"\n      eventId: meta.eventId || null,\n      schemaVersion: meta.schemaVersion || null,\n      traceparent: meta.traceparent || null,\n      cloudEvent: meta.cloudEvent || null,"
    if anchor not in t: raise RuntimeError('signal timestamp anchor missing')
    t=t.replace(anchor,repl,1)
p.write_text(t,encoding='utf-8')

p=root/'backend/src/core/decisionEngine.js'
t=p.read_text(encoding='utf-8')
old="id: `dec_${Date.now()}_${Math.round(Math.random() * 1e6)}`,"
new="id: 'dec_' + crypto.randomUUID(),"
if old in t:
    t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
print('phase36 strong-id patch applied')
