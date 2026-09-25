from pathlib import Path

p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_api_contract_catalog.py')
t=p.read_text(encoding='utf-8')
t=t.replace('asyncapi_file=ROOT/"backend"/"src"/"contracts"/"asyncapi-events.json"','asyncapi_file=(ROOT/"backend"/"src"/"contracts"/"asyncapi-events-all.json") if (ROOT/"backend"/"src"/"contracts"/"asyncapi-events-all.json").exists() else (ROOT/"backend"/"src"/"contracts"/"asyncapi-events.json")')
old='''        event_contracts.append({\n            "name":name,\n            "address":ch.get("address"),\n            "messages":list((ch.get("messages") or {}).keys()),\n            "sourceFile":asyncapi_file.relative_to(ROOT).as_posix(),\n            "asyncapi":asyncapi.get("asyncapi"),\n            "cloudEventsSpecVersion":(asyncapi.get("x-cloudevents") or {}).get("specversion")\n        })'''
new='''        message_names=list((ch.get("messages") or {}).keys())\n        component_messages=(asyncapi.get("components") or {}).get("messages",{})\n        levels=[]\n        for message_name in message_names:\n            msg=component_messages.get(message_name,{})\n            if msg.get("x-afrera-governance-level"): levels.append(msg.get("x-afrera-governance-level"))\n        event_contracts.append({\n            "name":name,\n            "address":ch.get("address"),\n            "messages":message_names,\n            "governanceLevels":sorted(set(levels)),\n            "sourceFile":asyncapi_file.relative_to(ROOT).as_posix(),\n            "asyncapi":asyncapi.get("asyncapi"),\n            "cloudEventsSpecVersion":(asyncapi.get("x-cloudevents") or {}).get("specversion")\n        })'''
if old not in t: raise RuntimeError('event contract block not found')
t=t.replace(old,new)
t=t.replace(' "governedEventContracts":len(event_contracts),',' "governedEventContracts":len(event_contracts),\n "detailedEventContracts":sum(1 for x in event_contracts if "detailed-payload" in x.get("governanceLevels",[])),\n "genericEnvelopeEventContracts":sum(1 for x in event_contracts if "generic-envelope" in x.get("governanceLevels",[])),')
t=t.replace('"governedEventContracts","signalTypes","uncontractedSignalTypes"','"governedEventContracts","detailedEventContracts","genericEnvelopeEventContracts","signalTypes","uncontractedSignalTypes"')
p.write_text(t,encoding='utf-8')
print('api builder event governance patched')
