import json,re,unicodedata,hashlib
from pathlib import Path
ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
NE=Path(r"C:\Users\DIYA GOEL\Desktop\ne")
ASSETS=ROOT/".audit/phase-program/product-image-intelligence/assets.jsonl"
MASTER=ROOT/"backend/src/data/product-master/ne-products.jsonl"
OUT=ROOT/".audit/phase-program/product-image-intelligence/ne-reference-map.json"

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).lower()
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()

products=[]
with MASTER.open(encoding="utf-8") as f:
    for line in f:
        if line.strip(): products.append(json.loads(line))
aliases=[]
for p in products:
    vals=[p["identity"]["name"],*(p["identity"].get("historicalNames") or [])]
    for v in vals:
        n=norm(v)
        if len(n)>=5: aliases.append((n,p["productId"],p["identity"]["name"],p["identity"]["category"]))
aliases.sort(key=lambda x:len(x[0]), reverse=True)

rows=[json.loads(x) for x in ASSETS.open(encoding="utf-8") if x.strip()]
ne=[r for r in rows if r["sourceId"]=="LOCAL.NE" and r["scope"]=="active-like" and r.get("dhash64")]
by_hash={}
for r in ne: by_hash.setdefault(r["sha256"],[]).append(r)

html_files=sorted(NE.rglob("*.html"))+sorted(NE.rglob("*.htm"))
html_text=[]
for f in html_files:
    try:
        txt=f.read_text(encoding="utf-8",errors="replace")
    except Exception:
        continue
    html_text.append((f,txt))

def find_refs(basenames):
    refs=[]
    for f,txt in html_text:
        for base in basenames:
            start=0
            while True:
                pos=txt.find(base,start)
                if pos<0: break
                lo=max(0,pos-700);hi=min(len(txt),pos+len(base)+700)
                context=txt[lo:hi]
                line=txt.count("\n",0,pos)+1
                refs.append({"file":f.relative_to(NE).as_posix(),"line":line,"basename":base,"context":context})
                start=pos+len(base)
    return refs

def match_products(context):
    n=norm(context)
    found={}
    for alias,pid,name,cat in aliases:
        if alias in n:
            found[pid]={"productId":pid,"name":name,"category":cat,"matchedAlias":alias}
    return list(found.values())

def story_tags(text):
    n=norm(text)
    mapping={
      "gi":["geographical indication","gi tag","gi-tag","gi "],
      "tea":["tea","plantation"],
      "rice":["rice","black rice"],
      "chilli":["chilli","chili","pepper"],
      "ginger":["ginger"],
      "citrus":["orange","mandarin","citrus"],
      "pineapple":["pineapple"],
      "cardamom":["cardamom"],
      "turmeric":["turmeric"],
      "fruit":["fruit","fruits"],
      "marketplace":["marketplace","product","catalog"],
    }
    return [k for k,terms in mapping.items() if any(term in n for term in terms)]

records=[]
for h,group in sorted(by_hash.items()):
    basenames=sorted({Path(r["relativePath"]).name for r in group})
    refs=find_refs(basenames)
    contexts=" ".join(x["context"] for x in refs)
    matches=match_products(contexts) if refs else []
    tags=story_tags(contexts) if refs else []
    if len(matches)==1:
        mappingStatus="CONTEXTUAL_SINGLE_PRODUCT_CANDIDATE"
        confidence="medium"
    elif len(matches)>1:
        mappingStatus="CONTEXTUAL_MULTI_PRODUCT_OR_STORY"
        confidence="low"
    elif tags:
        mappingStatus="CATEGORY_OR_STORY_CONTEXT_ONLY"
        confidence="low"
    else:
        mappingStatus="UNRESOLVED"
        confidence="none"
    source_classes=sorted({r.get("sourceClass") for r in group})
    license_statuses=sorted({r.get("licenseStatus") for r in group})
    records.append({
      "sha256":h,
      "instances":[{"relativePath":r["relativePath"],"width":r.get("width"),"height":r.get("height")} for r in group],
      "sourceClasses":source_classes,
      "licenseStatuses":license_statuses,
      "prototypeReferences":[{"file":x["file"],"line":x["line"],"basename":x["basename"]} for x in refs[:30]],
      "prototypeReferenceCount":len(refs),
      "productCandidates":matches[:20],
      "storyTags":tags,
      "mappingStatus":mappingStatus,
      "mappingConfidence":confidence,
      "productionAssignment":"NOT_APPROVED",
      "reason":"Contextual prototype evidence only; visual/product identity and license provenance require confirmation before public assignment."
    })

OUT.write_text(json.dumps({
 "schemaVersion":1,
 "uniqueNeHashes":len(records),
 "htmlFilesSearched":len(html_text),
 "records":records,
 "rules":[
   "A single product mention near an image reference is a candidate mapping, not authoritative identity.",
   "Multiple nearby product mentions downgrade the image to story/category context.",
   "No asset is production-approved without license/provenance confirmation and product identity review.",
   "Exact duplicate instances share one image-intelligence record by SHA-256."
 ]
},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(json.dumps({
 "ok":True,
 "uniqueNeHashes":len(records),
 "withReferences":sum(1 for r in records if r["prototypeReferenceCount"]>0),
 "singleProductCandidates":sum(1 for r in records if r["mappingStatus"]=="CONTEXTUAL_SINGLE_PRODUCT_CANDIDATE"),
 "multiOrStory":sum(1 for r in records if r["mappingStatus"] in {"CONTEXTUAL_MULTI_PRODUCT_OR_STORY","CATEGORY_OR_STORY_CONTEXT_ONLY"}),
 "unresolved":sum(1 for r in records if r["mappingStatus"]=="UNRESOLVED")
}))
