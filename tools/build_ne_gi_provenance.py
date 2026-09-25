import json, re, hashlib, unicodedata
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import pdfplumber

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
PDF=ROOT/".audit/external-evidence/ipindia/State_wise_Registered_GI_of_India.pdf"
MASTER=ROOT/"backend/src/data/product-master/ne-products.jsonl"
OUT=ROOT/".audit/phase-program/gi-certification-provenance"
PROD=ROOT/"backend/src/data/product-master"
OUT.mkdir(parents=True,exist_ok=True)
PROD.mkdir(parents=True,exist_ok=True)

SOURCE_URL="https://ipindia.gov.in/frontend/pdf/gi/registered/State_wise_Registered_GI_of_India.pdf"
PUBLISHER_PAGE="https://www.ipindia.gov.in/geographical-indications-track-application-list-of-registered-geographical-indications-and-authorised-users-part-a-register-list-of-registered-gi-of-india"
NE_STATES=("Assam","Arunachal Pradesh","Manipur","Meghalaya","Mizoram","Nagaland","Sikkim","Tripura")

def norm(s):
    s=unicodedata.normalize("NFKD",str(s or ""))
    s="".join(ch for ch in s if not unicodedata.combining(ch))
    s=s.lower().replace("&"," and ")
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()

def sha256_file(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def parse_app_numbers(value):
    return re.findall(r"\d+",str(value or ""))

# Explicit aliases are evidence-preserving normalization only; they never override a state conflict.
ALIASES={
    "assam orthodox tea":"Assam (Orthodox)",
    "joha rice":"Joha Rice of Assam",
    "chokuwa rice":"Chokuwa Rice of Assam",
    "chak hao black rice":"Chak - Hao",
    "queen pineapple":"Tripura Queen Pineapple",
    "large cardamom":"Sikkim Large Cardamom",
    "keradapini bodo traditional plant":"Bodo Keradapini",
    "karbi anglong ginger":"Assam Karbi Anglong Ginger",
}
# "Sweet Cucumber" is intentionally NOT aliased to Naga Cucumber; that requires external product-identity evidence.
# "Memang Narang" is intentionally NOT aliased to "Memong Narang" because the prototype origin conflicts with the register.

DERIVATIVE_SUFFIXES=("pickle","jam","flour","extract","powder","concentrate","noodles","oil","juice","paste","sauce","dried","flakes")

rows=[]
with pdfplumber.open(str(PDF)) as pdf:
    for page_no,page in enumerate(pdf.pages):
        table=page.extract_table() or []
        for raw in table:
            if not raw or len(raw)<7: continue
            if str(raw[0]).strip().lower() in {"sl.no.","sl no","sl.no"}: continue
            sl,app_no,name,status,filing_date,goods,state=[str(x or "").replace("\n"," ").strip() for x in raw[:7]]
            if not sl.isdigit() or not name: continue
            rec={
                "slNo":int(sl),
                "applicationNumberRaw":app_no,
                "applicationNumbers":parse_app_numbers(app_no),
                "registeredName":name,
                "status":status,
                "dateOfFiling":filing_date,
                "goods":goods,
                "state":state,
                "pdfPage":page_no+1,
            }
            rows.append(rec)

# Keep all official rows as source evidence, plus a North-East subset for matching.
ne_rows=[]
for r in rows:
    state_norm=norm(r["state"])
    if any(norm(s) in state_norm for s in NE_STATES):
        ne_rows.append(r)

products=[json.loads(line) for line in MASTER.read_text(encoding="utf-8").splitlines() if line.strip()]
official_by_norm={norm(r["registeredName"]):r for r in ne_rows}

def state_compatible(product_origin, official_state):
    po=norm(product_origin)
    os=norm(official_state)
    if not po or not os:return False
    return po in os or os in po

def direct_match(product):
    pn=norm(product["identity"]["name"])
    if pn in official_by_norm:
        return official_by_norm[pn],"EXACT_NAME"
    alias=ALIASES.get(pn)
    if alias and norm(alias) in official_by_norm:
        return official_by_norm[norm(alias)],"EXPLICIT_ALIAS"
    return None,None

def derivative_match(product):
    pn=norm(product["identity"]["name"])
    for official in ne_rows:
        on=norm(official["registeredName"])
        variants={on}
        # Add normalized alias keys that point to this official name.
        for alias_name,target in ALIASES.items():
            if norm(target)==on: variants.add(alias_name)
        for base in sorted(variants,key=len,reverse=True):
            if pn.startswith(base+" "):
                suffix=pn[len(base):].strip()
                if suffix and any(tok in suffix.split() for tok in DERIVATIVE_SUFFIXES):
                    return official,base,suffix
    # Project-specific obvious derivative families where official names include geography qualifiers.
    special=[
        ("kaji nemu","Kaji Nemu"),
        ("kachai lemon","Kachai Lemon"),
        ("pineapple","Tripura Queen Pineapple"),
        ("joha rice","Joha Rice of Assam"),
        ("black rice","Chak - Hao"),
        ("assam tea","Assam (Orthodox)"),
        ("tea","Assam (Orthodox)"),
    ]
    for base,target in special:
        if pn.startswith(base+" ") and norm(target) in official_by_norm:
            suffix=pn[len(base):].strip()
            if any(tok in suffix.split() for tok in DERIVATIVE_SUFFIXES):
                return official_by_norm[norm(target)],base,suffix
    return None,None,None

def conflict_candidates(product):
    pn=norm(product["identity"]["name"])
    candidates=[]
    # conservative token overlap, only for GI-prototype claims or close-spelling candidates
    pt=set(pn.split())
    for r in ne_rows:
        ot=set(norm(r["registeredName"]).split())
        if not pt or not ot: continue
        inter=len(pt&ot)
        union=len(pt|ot)
        j=inter/union if union else 0
        if j>=0.5:
            candidates.append((j,r))
    candidates.sort(key=lambda x:(-x[0],x[1]["slNo"]))
    return candidates[:5]

records=[]
stats=Counter()
prototype_claim_outcomes=Counter()

for p in products:
    direct,match_type=direct_match(p)
    derivative,base,suffix=derivative_match(p)
    proto=bool(p.get("gi",{}).get("prototypeClaim"))
    outcome="NO_OFFICIAL_MATCH_IN_SNAPSHOT"
    official=None
    state_match=None
    notes=[]
    candidates=[]

    if direct:
        official=direct
        state_match=state_compatible(p["identity"]["originLabel"],official["state"])
        if state_match:
            outcome="REGISTERED_DIRECT_MATCH"
            stats["registeredDirect"]+=1
            if not proto: stats["prototypeFalseNegativeDirect"]+=1
        else:
            outcome="NAME_MATCH_STATE_CONFLICT"
            stats["stateConflicts"]+=1
    elif derivative:
        official=derivative
        state_match=state_compatible(p["identity"]["originLabel"],official["state"])
        outcome="DERIVATIVE_OF_REGISTERED_GI_NOT_DIRECT_REGISTRATION"
        stats["derivativeMatches"]+=1
        notes.append("The listed product is a processed/derived product. Registration of the source GI does not by itself prove that this derivative is registered under the same GI entry.")
    else:
        candidates=[{"score":round(score,3),"registeredName":r["registeredName"],"applicationNumberRaw":r["applicationNumberRaw"],"state":r["state"]} for score,r in conflict_candidates(p)]
        if proto:
            # Explicitly surface the known typo/state conflict family without promoting it.
            if "memang narang" in norm(p["identity"]["name"]):
                memong=official_by_norm.get(norm("Memong Narang"))
                if memong:
                    official=memong
                    state_match=state_compatible(p["identity"]["originLabel"],memong["state"])
                    outcome="POSSIBLE_NAME_MATCH_WITH_STATE_CONFLICT"
                    notes.append("Prototype says 'Memang Narang' / Arunachal Pradesh; official register contains 'Memong Narang' / Meghalaya. This is not accepted as the same registered product without identity correction evidence.")
                    stats["stateConflicts"]+=1
            elif norm(p["identity"]["name"])=="sweet cucumber":
                naga=official_by_norm.get(norm("Naga Cucumber"))
                if naga:
                    official=naga
                    state_match=state_compatible(p["identity"]["originLabel"],naga["state"])
                    outcome="POSSIBLE_ALIAS_REQUIRES_IDENTITY_EVIDENCE"
                    notes.append("Prototype 'Sweet Cucumber' may refer to Naga Cucumber, but the alias is not proven by the GI register itself.")
                    stats["possibleAlias"]+=1
            elif norm(p["identity"]["name"])=="assam ctc tea":
                outcome="PROTOTYPE_CLAIM_NOT_FOUND_IN_REGISTER"
                notes.append("Official register contains Assam (Orthodox); no Assam CTC entry matched in this snapshot.")
                stats["prototypeUnproven"]+=1
            else:
                outcome="PROTOTYPE_CLAIM_NOT_FOUND_IN_REGISTER"
                stats["prototypeUnproven"]+=1

    if proto:
        prototype_claim_outcomes[outcome]+=1

    evidence=None
    if official:
        evidence={
            "authority":"Controller General of Patents, Designs & Trade Marks / Geographical Indications Registry, Government of India",
            "registeredName":official["registeredName"],
            "applicationNumberRaw":official["applicationNumberRaw"],
            "applicationNumbers":official["applicationNumbers"],
            "status":official["status"],
            "dateOfFiling":official["dateOfFiling"],
            "goods":official["goods"],
            "state":official["state"],
            "pdfPage":official["pdfPage"],
            "sourceUrl":SOURCE_URL,
            "detailUrls":[f"https://search.ipindia.gov.in/GIRPublicSearch/Application/Details/{n}" for n in official["applicationNumbers"]],
        }

    record={
        "productId":p["productId"],
        "productName":p["identity"]["name"],
        "productOrigin":p["identity"]["originLabel"],
        "prototypeClaim":proto,
        "verificationOutcome":outcome,
        "registeredAsListedGood":outcome=="REGISTERED_DIRECT_MATCH",
        "stateCompatible":state_match,
        "officialEvidence":evidence,
        "candidateMatches":candidates,
        "notes":notes,
        "sourceSnapshot":{
            "publisherPage":PUBLISHER_PAGE,
            "publisherPagePublishDate":"2026-05-02",
            "registerEffectiveThrough":"2025-12-31",
            "pdfSha256":sha256_file(PDF),
            "pdfBytes":PDF.stat().st_size,
            "localEvidencePath":".audit/external-evidence/ipindia/State_wise_Registered_GI_of_India.pdf",
        },
    }
    records.append(record)

prod_file=PROD/"ne-gi-provenance.jsonl"
with prod_file.open("w",encoding="utf-8") as f:
    for r in records:f.write(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n")

official_file=OUT/"official-ne-gi-register.json"
official_file.write_text(json.dumps(ne_rows,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
review_file=OUT/"prototype-claim-review.json"
review_file.write_text(json.dumps([r for r in records if r["prototypeClaim"]],indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

manifest={
    "schemaVersion":1,
    "productCount":len(records),
    "officialRegisterRowCount":len(rows),
    "officialNorthEastRowCount":len(ne_rows),
    "prototypeClaimCount":sum(1 for r in records if r["prototypeClaim"]),
    "prototypeClaimOutcomes":dict(sorted(prototype_claim_outcomes.items())),
    "stats":dict(stats),
    "source":{
        "publisher":"Intellectual Property India / Geographical Indications Registry",
        "publisherPage":PUBLISHER_PAGE,
        "publisherPagePublishDate":"2026-05-02",
        "registerEffectiveThrough":"2025-12-31",
        "sourceUrl":SOURCE_URL,
        "pdfSha256":sha256_file(PDF),
        "pdfBytes":PDF.stat().st_size,
    },
    "truthRules":[
        "Only a direct or explicitly-normalized match to an official registered GI entry with compatible geography is marked REGISTERED_DIRECT_MATCH.",
        "Processed derivatives are not automatically treated as registered GIs merely because the source agricultural good is registered.",
        "A project name/state conflict is surfaced, not silently corrected.",
        "A missing match in this snapshot is not proof that no later GI exists; the snapshot is effective through 2025-12-31.",
        "Possible aliases require independent product-identity evidence before they can inherit a registered match.",
        "Prototype GI flags remain preserved as source claims even when contradicted or unproven."
    ],
    "productionFile":"backend/src/data/product-master/ne-gi-provenance.jsonl",
    "productionSha256":sha256_file(prod_file),
}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
(PROD/"ne-gi-provenance.manifest.json").write_text(json.dumps({
    "schemaVersion":1,
    "productCount":len(records),
    "dataFileSha256":manifest["productionSha256"],
    "sourcePdfSha256":manifest["source"]["pdfSha256"],
    "registerEffectiveThrough":manifest["source"]["registerEffectiveThrough"],
    "generatedBy":"tools/build_ne_gi_provenance.py",
    "truthRules":manifest["truthRules"],
},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

print(json.dumps({
    "ok":True,
    "products":len(records),
    "officialRows":len(rows),
    "officialNERows":len(ne_rows),
    "prototypeClaims":manifest["prototypeClaimCount"],
    "prototypeClaimOutcomes":manifest["prototypeClaimOutcomes"],
    "stats":manifest["stats"],
    "bytes":prod_file.stat().st_size
},ensure_ascii=False))
