import json,re
from pathlib import Path
from collections import defaultdict

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
OUT=ROOT/".audit"/"phase-program"/"api-contract-catalog"
OUT.mkdir(parents=True,exist_ok=True)

def server_owner(owner):
    if not owner: return False
    low=str(owner).lower()
    return low in {"router","app"} or low.endswith("router")

struct_dir=ROOT/".audit"/"phase-program"/"structural-code"
sm=json.loads((struct_dir/"manifest.json").read_text(encoding="utf-8"))
rest=[]
client_calls=[]
mounts=[]
discarded_method_calls=0

for sh in sm.get("shards",[]):
    with (struct_dir/sh["file"]).open("r",encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            rec=json.loads(line)
            source=rec.get("path","")
            for route in rec.get("routes",[]):
                owner=route.get("owner")
                method=route.get("method")
                item={"sourceFile":source,"owner":owner,"method":method,"path":route.get("path")}
                if method=="use" and server_owner(owner):
                    mounts.append(item)
                elif method in {"get","post","put","patch","delete","all"} and server_owner(owner):
                    rest.append(item)
                elif source.startswith("frontend/src/") and owner=="api" and method in {"get","post","put","patch","delete"}:
                    client_calls.append(item)
                else:
                    discarded_method_calls+=1

collisions=[]
grp=defaultdict(list)
for r in rest:
    grp[(r["sourceFile"],r["owner"],r["method"],r["path"])].append(r)
for k,v in grp.items():
    if len(v)>1:
        collisions.append({"sourceFile":k[0],"owner":k[1],"method":k[2],"path":k[3],"count":len(v)})

graphql=[]
gql_patterns=[re.compile(r'\btype\s+(Query|Mutation|Subscription)\b'),re.compile(r'\bextend\s+type\s+(Query|Mutation|Subscription)\b')]
graphql_candidates=list((ROOT/"backend").rglob("*.graphql"))+list((ROOT/"backend").rglob("*.gql"))+list((ROOT/"backend"/"src").rglob("*.js"))
for p in graphql_candidates:
    if any(part in {"node_modules","dist","build","coverage"} for part in p.parts): continue
    try: text=p.read_text(encoding="utf-8",errors="replace")
    except Exception: continue
    if p.suffix in {".graphql",".gql"} or "ApolloServer" in text or "type Query" in text or "type Mutation" in text:
        types=sorted(set(m.group(1) for pat in gql_patterns for m in pat.finditer(text)))
        fields=[]
        for block in re.finditer(r'(?:type|extend\s+type)\s+(Query|Mutation|Subscription)\s*\{(.*?)\}',text,re.S):
            for ln in block.group(2).splitlines():
                m=re.match(r'\s*([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*:',ln)
                if m: fields.append({"type":block.group(1),"field":m.group(1)})
        graphql.append({"sourceFile":p.relative_to(ROOT).as_posix(),"operationTypes":types,"fields":fields[:500]})

websocket=[]
socket_event_re=re.compile(r'\.(on|once|emit)\s*\(\s*[\'"]([^\'"]+)[\'"]')
for p in (ROOT/"backend"/"src").rglob("*.js"):
    if any(part in {"node_modules","dist","build","coverage"} for part in p.parts): continue
    try: text=p.read_text(encoding="utf-8",errors="replace")
    except Exception: continue
    if not re.search(r'\bsocket\.|\bio\.|socket\.io|WebSocket|new\s+Server\s*\(',text,re.I):
        continue
    matches=[{"operation":m.group(1),"event":m.group(2)} for m in socket_event_re.finditer(text)]
    if matches:
        websocket.append({"sourceFile":p.relative_to(ROOT).as_posix(),"events":matches[:1000]})

event_contracts=[]
asyncapi_file=(ROOT/"backend"/"src"/"contracts"/"asyncapi-events-all.json") if (ROOT/"backend"/"src"/"contracts"/"asyncapi-events-all.json").exists() else (ROOT/"backend"/"src"/"contracts"/"asyncapi-events.json")
if asyncapi_file.exists():
    asyncapi=json.loads(asyncapi_file.read_text(encoding="utf-8"))
    for name,ch in asyncapi.get("channels",{}).items():
        message_names=list((ch.get("messages") or {}).keys())
        component_messages=(asyncapi.get("components") or {}).get("messages",{})
        levels=[]
        for message_name in message_names:
            msg=component_messages.get(message_name,{})
            if msg.get("x-afrera-governance-level"): levels.append(msg.get("x-afrera-governance-level"))
        event_contracts.append({
            "name":name,
            "address":ch.get("address"),
            "messages":message_names,
            "governanceLevels":sorted(set(levels)),
            "sourceFile":asyncapi_file.relative_to(ROOT).as_posix(),
            "asyncapi":asyncapi.get("asyncapi"),
            "cloudEventsSpecVersion":(asyncapi.get("x-cloudevents") or {}).get("specversion")
        })

signal_types=[]
signal_file=ROOT/"backend"/"src"/"core"/"signalBus.js"
if signal_file.exists():
    text=signal_file.read_text(encoding="utf-8",errors="replace")
    block=re.search(r'const\s+SIGNAL\s*=\s*Object\.freeze\(\{(.*?)\}\);',text,re.S)
    if block:
        for m in re.finditer(r'^\s*([A-Z0-9_]+)\s*:\s*[\'"]([^\'"]+)[\'"]',block.group(1),re.M):
            signal_types.append({"constant":m.group(1),"type":m.group(2),"sourceFile":"backend/src/core/signalBus.js"})

contracted_addresses={x["address"].replace("/",".") if x.get("address") else None for x in event_contracts}
uncontracted=[x for x in signal_types if x["type"] not in contracted_addresses]

integrations=[]
url_re=re.compile(r'https?://[A-Za-z0-9._~:/?#\[\]@!$&\'()*+,;=%-]+')
env_re=re.compile(r'process\.env\.([A-Z0-9_]+)')
for base in [ROOT/"backend"/"src",ROOT/"frontend"/"src"]:
    if not base.exists(): continue
    for p in base.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in {".js",".jsx",".ts",".tsx"}: continue
        if any(part in {"node_modules","dist","build","coverage"} for part in p.parts): continue
        try: text=p.read_text(encoding="utf-8",errors="replace")
        except Exception: continue
        urls=sorted(set(url_re.findall(text)))
        envs=sorted(set(env_re.findall(text)))
        api_env=[x for x in envs if any(k in x for k in ["URL","API","HOST","ENDPOINT","KEY","TOKEN","SECRET","WEBHOOK"])]
        if urls or api_env:
            integrations.append({"sourceFile":p.relative_to(ROOT).as_posix(),"urls":urls[:50],"envDependencies":api_env[:100]})

manifest={
 "schemaVersion":2,
 "restServerOperations":len(rest),
 "restClientCalls":len(client_calls),
 "mountCalls":len(mounts),
 "discardedGenericMethodCalls":discarded_method_calls,
 "restLocalCollisions":len(collisions),
 "graphqlSources":len(graphql),
 "graphqlFields":sum(len(x["fields"]) for x in graphql),
 "graphqlStatus":"ABSENT_IN_TRACKED_SOURCE" if not graphql else "DISCOVERED",
 "websocketSources":len(websocket),
 "websocketEvents":sum(len(x["events"]) for x in websocket),
 "asyncApiVersion":"3.1.0" if event_contracts else None,
 "governedEventContracts":len(event_contracts),
 "detailedEventContracts":sum(1 for x in event_contracts if "detailed-payload" in x.get("governanceLevels",[])),
 "genericEnvelopeEventContracts":sum(1 for x in event_contracts if "generic-envelope" in x.get("governanceLevels",[])),
 "signalTypes":len(signal_types),
 "uncontractedSignalTypes":len(uncontracted),
 "integrationSources":len(integrations),
 "rules":[
   "Only router/app/*Router AST calls are counted as backend REST server operations.",
   "Frontend api.* calls are catalogued separately as client contracts.",
   "Generic object .get/.post calls are explicitly excluded from REST counts.",
   "GraphQL zero means no executable GraphQL schema/server evidence was found; dependency presence alone is not implementation.",
   "WebSocket events require socket/WebSocket context and are separated from internal EventEmitter signals.",
   "Governed domain events are sourced from checked-in AsyncAPI and signal constants.",
   "Environment dependency names may be catalogued; secret values are never captured."
 ],
 "collisionSamples":collisions[:250]
}

(OUT/"rest.jsonl").write_text("".join(json.dumps(x)+"\n" for x in rest),encoding="utf-8")
(OUT/"client-rest.jsonl").write_text("".join(json.dumps(x)+"\n" for x in client_calls),encoding="utf-8")
(OUT/"mounts.jsonl").write_text("".join(json.dumps(x)+"\n" for x in mounts),encoding="utf-8")
(OUT/"graphql.json").write_text(json.dumps(graphql,indent=2)+"\n",encoding="utf-8")
(OUT/"websocket.json").write_text(json.dumps(websocket,indent=2)+"\n",encoding="utf-8")
(OUT/"events.json").write_text(json.dumps({"governedContracts":event_contracts,"signalTypes":signal_types,"uncontractedSignalTypes":uncontracted},indent=2)+"\n",encoding="utf-8")
(OUT/"integrations.json").write_text(json.dumps(integrations,indent=2)+"\n",encoding="utf-8")
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,**{k:manifest[k] for k in ["restServerOperations","restClientCalls","mountCalls","discardedGenericMethodCalls","restLocalCollisions","graphqlSources","websocketEvents","governedEventContracts","detailedEventContracts","genericEnvelopeEventContracts","signalTypes","uncontractedSignalTypes","integrationSources"]}}))
