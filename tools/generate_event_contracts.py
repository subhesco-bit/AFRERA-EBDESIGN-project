import json,re
from pathlib import Path

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
signal_file=ROOT/"backend"/"src"/"core"/"signalBus.js"
detailed_file=ROOT/"backend"/"src"/"contracts"/"asyncapi-events.json"
out_file=ROOT/"backend"/"src"/"contracts"/"asyncapi-events-all.json"

text=signal_file.read_text(encoding="utf-8",errors="replace")
block=re.search(r'const\s+SIGNAL\s*=\s*Object\.freeze\(\{(.*?)\}\);',text,re.S)
if not block:
    raise SystemExit("SIGNAL registry not found")
signals=[]
for m in re.finditer(r'^\s*([A-Z0-9_]+)\s*:\s*[\'"]([^\'"]+)[\'"]',block.group(1),re.M):
    signals.append((m.group(1),m.group(2)))

base=json.loads(detailed_file.read_text(encoding="utf-8"))
channels=dict(base.get("channels",{}))
messages=dict((base.get("components") or {}).get("messages",{}))

address_to_message={}
for cname,ch in channels.items():
    address=ch.get("address")
    refs=list((ch.get("messages") or {}).keys())
    if address and refs:
        address_to_message[address.replace("/",".")]=(cname,refs[0])

def safe_name(value):
    parts=re.split(r'[^A-Za-z0-9]+',value)
    return ''.join([parts[0].lower()]+[p[:1].upper()+p[1:] for p in parts[1:] if p]) or "event"

generic=0
for constant,event_type in signals:
    if event_type in address_to_message:
        cname,mname=address_to_message[event_type]
        messages[mname]["x-afrera-signal-constant"]=constant
        messages[mname]["x-afrera-governance-level"]="detailed-payload"
        continue
    cname=safe_name(event_type)
    mname=cname
    suffix=1
    while cname in channels:
        suffix+=1
        cname=safe_name(event_type)+str(suffix)
        mname=cname
    channels[cname]={
        "address":event_type.replace(".","/"),
        "messages":{mname:{"$ref":"#/components/messages/"+mname}}
    }
    messages[mname]={
        "name":mname,
        "title":event_type,
        "summary":"Generic governed envelope contract; domain payload schema remains to be specialized.",
        "contentType":"application/json",
        "payload":{"type":"object","additionalProperties":True},
        "x-afrera-schema-version":"1.0.0",
        "x-afrera-signal-constant":constant,
        "x-afrera-governance-level":"generic-envelope"
    }
    generic+=1

doc={
    "asyncapi":"3.1.0",
    "info":{
        "title":"AFRERA Complete Governed Event Contract",
        "version":"1.0.0",
        "description":"All registered AFRERA signal types are contract-addressable. Detailed payload schemas are preserved where verified; remaining signals use an explicit generic governed envelope until specialized."
    },
    "defaultContentType":"application/json",
    "channels":channels,
    "components":{"messages":messages},
    "x-cloudevents":base.get("x-cloudevents",{"specversion":"1.0"}),
    "x-observability":base.get("x-observability",{}),
    "x-afrera-governance":{
        "signalCount":len(signals),
        "genericEnvelopeContracts":generic,
        "detailedPayloadContracts":len(signals)-generic,
        "rule":"Generic envelope contracts are not evidence of detailed domain payload validation."
    }
}
out_file.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,"signals":len(signals),"channels":len(channels),"generic":generic,"detailed":len(signals)-generic}))
