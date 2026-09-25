import json, os
from pathlib import Path

ROOT = Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
OUT = ROOT / ".audit" / "phase-program" / "feature-recovery-matrix"
OUT.mkdir(parents=True, exist_ok=True)

CAPS = [
("finance-accounting",["finance","accounting","ledger","accounts payable","accounts receivable","gst","tax","treasury","cash flow"]),
("hr-hcm",["hrms","human resource","payroll","attendance","recruitment","workforce","employee"]),
("procurement-sourcing",["procurement","rfq","purchase order","vendor","supplier","sourcing"]),
("inventory-wms",["inventory","warehouse","wms","stock","bin","pallet","grn","put away","picking"]),
("scm-planning",["supply chain","demand planning","forecasting","s&op","mrp","distribution planning"]),
("manufacturing",["manufacturing","production","bom","routing","work order","shop floor","machine"]),
("quality-ehs",["quality","capa","ncr","inspection","haccp","fssai","ehs","safety"]),
("eam-maintenance",["asset management","eam","maintenance","equipment","preventive maintenance","predictive maintenance"]),
("retail-pos",["retail","pos","store","franchise","loyalty","coupon","gift card"]),
("ecommerce-marketplace",["e-commerce","ecommerce","marketplace","cart","checkout","order management","product catalog"]),
("logistics-tms",["logistics","tms","fleet","shipment","route optimization","pod","last mile","vehicle"]),
("insurance",["insurance","policy","claim","underwriting","premium","fraud detection","irdai"]),
("crm-service",["crm","lead","opportunity","complaint","service request","warranty","amc","customer"]),
("project-epc",["project management","wbs","boq","dpr","rfi","epc","construction"]),
("governance-grc",["governance","grc","risk management","compliance","audit","legal"]),
("bi-analytics",["business intelligence","dashboard","kpi","mis","predictive analytics","executive report"]),
("iot-tracking",["iot","rfid","ble","gps","sensor","tracking","telemetry"]),
("digital-twin",["digital twin","simulation","scenario","plant simulation","warehouse simulation"]),
("farmer-fpo",["farmer","fpo","cooperative","farm","plot","village"]),
("agronomy-weather",["agronomy","crop","weather","irrigation","pest","disease","yield"]),
("seed-biodiversity",["seed","biodiversity","landrace","rare crop","indigenous knowledge"]),
("cold-chain",["cold chain","cold-chain","cold storage","reefer","temperature","pre-cooling"]),
("food-nutrition",["nutrition","dietitian","nutrient","wellness","potency","biochemical"]),
("veterinary-livestock",["veterinary","livestock","animal health","vaccination","breeding","feed"]),
("processing-value-add",["processing","value addition","value-added","fermentation","packaging"]),
("payments-credit",["payment","upi","escrow","credit","loan","banking","finance ai"]),
("scheme-subsidy",["scheme","subsidy","grant","eligibility"]),
("gi-traceability",["gi registered","gi-registered","geographical indication","traceability","provenance"]),
("ai-registry-router",["intelligence registry","strategy router","reflex engine","orchestrator","model routing"]),
("agents-workflows",["agent","multi-agent","workflow","tool call","human approval","durable workflow"]),
("retrieval-knowledge",["retrieval","knowledge graph","vector","semantic search","bm25","rerank"]),
("mobile-offline",["mobile","apk","android","offline","pwa","field mode","sync"]),
("security-iam",["iam","rbac","abac","mfa","oauth","oidc","security","authorization"]),
("observability-resilience",["observability","metrics","tracing","logs","self-healing","resilience","circuit breaker"]),
("product-master-pim",["product master","pim","product information","catalog","sku","variety"]),
("document-dms",["document management","dms","ocr","digital signature","contract repository"]),
("plm-engineering",["plm","product lifecycle","cad","bim","engineering drawing","digital thread"]),
("sustainability-esg",["sustainability","esg","carbon","circularity","waste","biodiversity"]),
("research-innovation",["research","innovation","experiment","pilot","technology readiness"]),
("accessibility-multilingual",["accessibility","wcag","multilingual","voice navigation","kiosk","simple mode"])
]

matrix = {
    cid: {
        "capability": cid,
        "terms": terms,
        "concept": {"count":0,"samples":[]},
        "activeCode": {"count":0,"samples":[]},
        "historical": {"count":0,"samples":[]},
        "nePrototype": {"count":0,"samples":[]},
        "richDocument": {"count":0,"samples":[]},
        "github": {"count":0,"samples":[]},
    } for cid,terms in CAPS
}

def hits(text):
    s=(text or "").lower()
    return [cid for cid,terms in CAPS if any(t in s for t in terms)]

def add(bucket, sample):
    bucket["count"] += 1
    if len(bucket["samples"]) < 20 and sample not in bucket["samples"]:
        bucket["samples"].append(sample)

def scan_jsonl(path):
    with open(path,"r",encoding="utf-8",errors="replace") as f:
        for line in f:
            line=line.strip()
            if line:
                yield json.loads(line)

# Concept sections
concept_dir = ROOT/".audit"/"phase-program"/"concept-sections"
cm = json.loads((concept_dir/"manifest.json").read_text(encoding="utf-8"))
for sh in cm.get("shards",[]):
    for r in scan_jsonl(concept_dir/sh["file"]):
        text=" ".join([str(r.get("heading","")),str(r.get("text",""))," ".join(r.get("tags",[]))])
        for cid in hits(text):
            add(matrix[cid]["concept"], f'{r.get("sourceId")}:{r.get("relativePath")}#{r.get("sectionIndex")}')

# Active code
struct_dir=ROOT/".audit"/"phase-program"/"structural-code"
sm=json.loads((struct_dir/"manifest.json").read_text(encoding="utf-8"))
for sh in sm.get("shards",[]):
    for r in scan_jsonl(struct_dir/sh["file"]):
        route_paths=[x.get("path","") for x in r.get("routes",[]) if isinstance(x,dict)]
        text=" ".join([r.get("path",""), *r.get("functions",[]), *r.get("classes",[]), *route_paths, *r.get("schemas",[]), *r.get("workers",[])])
        for cid in hits(text):
            add(matrix[cid]["activeCode"],r.get("path",""))

# Exhaustive historical paths
exdir=ROOT/".audit"/"phase-program"/"exhaustive-file-review-rerun-20260925-172329"
em=json.loads((exdir/"manifest.json").read_text(encoding="utf-8"))
for sh in em.get("shards",[]):
    for r in scan_jsonl(exdir/sh["file"]):
        p=r.get("relativePath","")
        if r.get("sourceId")!="LOCAL.EBDESIGN":
            continue
        low=p.lower()
        if not (low.startswith(".archive/") or low.startswith(".claude/worktrees/") or low.startswith("new folder/") or low.startswith("_ebdesign_library/")):
            continue
        text=p+" "+json.dumps(r.get("semanticSignals",{}),sort_keys=True)
        for cid in hits(text):
            add(matrix[cid]["historical"],p)

# NE HTML prototypes
hp=json.loads((ROOT/".audit"/"phase-program"/"html-prototypes"/"prototypes.json").read_text(encoding="utf-8"))
for r in hp:
    text=" ".join([
        str(r.get("title","")),
        *map(str,r.get("headings",[])),
        *map(str,r.get("buttons",[])),
        *map(str,r.get("functions",[])),
        *map(str,r.get("workflowTags",[])),
        *map(str,r.get("arrayNames",[])),
    ])
    for cid in hits(text):
        add(matrix[cid]["nePrototype"],r.get("relativePath",""))

# Rich docs: use complete manifest records if present, otherwise filenames/summary
rich_dir=ROOT/".audit"/"phase-program"/"rich-concept-documents-complete"
rm=json.loads((rich_dir/"manifest.json").read_text(encoding="utf-8"))
for key in ("documents","filesDetail","records"):
    vals=rm.get(key)
    if isinstance(vals,list):
        for rec in vals:
            text=json.dumps(rec,ensure_ascii=False)
            sample=rec.get("relativePath") or rec.get("path") or rec.get("name") or "rich-document"
            for cid in hits(text):
                add(matrix[cid]["richDocument"],sample)

# GitHub provenance source
gh_path=ROOT/".audit"/"phase-program"/"phase-013-github-history.json"
if gh_path.exists():
    gh=json.loads(gh_path.read_text(encoding="utf-8"))
    text=json.dumps(gh,ensure_ascii=False)
    for cid in hits(text):
        add(matrix[cid]["github"],"phase-013-github-history.json")

rows=[]
for cid,_ in CAPS:
    r=matrix[cid]
    requirement=r["concept"]["count"]+r["historical"]["count"]+r["nePrototype"]["count"]+r["richDocument"]["count"]
    implemented=r["activeCode"]["count"]>0
    if requirement and implemented: state="RECOVER_AND_VERIFY"
    elif requirement and not implemented: state="RECOVERY_GAP"
    elif implemented: state="IMPLEMENTATION_WITHOUT_RECOVERED_REQUIREMENT"
    else: state="NO_EVIDENCE"
    r["requirementEvidence"]=requirement
    r["implementedEvidence"]=implemented
    r["state"]=state
    rows.append(r)

states={}
for r in rows:
    states[r["state"]]=states.get(r["state"],0)+1

summary={
    "schemaVersion":1,
    "capabilityCount":len(rows),
    "states":states,
    "sourceInputs":{
        "conceptSections":11347,
        "activeCodeFiles":sm.get("filesParsed"),
        "htmlPrototypes":len(hp),
        "exhaustiveFiles":em.get("files"),
        "githubEvidence":"phase-013-github-history.json"
    },
    "rule":"Evidence matrix only. No capability is certified complete and no historical implementation is discarded by this phase.",
    "rows":rows
}
out=OUT/"matrix.json"
out.write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,"capabilityCount":len(rows),"states":states,"bytes":out.stat().st_size}))
