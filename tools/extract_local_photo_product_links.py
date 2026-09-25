import json,re,unicodedata,difflib
from pathlib import Path

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
NE=Path(r"C:\Users\DIYA GOEL\Desktop\ne")
HTML=NE/"NE Harvest OS v9 (3).html"
MASTER=ROOT/"backend/src/data/product-master/ne-products.jsonl"
IMG_MAN=ROOT/".audit/phase-program/product-image-intelligence/assets.jsonl"

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).lower()
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()

text=HTML.read_text(encoding="utf-8",errors="replace")
# Only string-valued local-photo entries; object-valued product definitions are ignored here.
photo_pairs=re.findall(r"(?m)^\s*([A-Za-z0-9_-]+)\s*:\s*'uploads/([^']+)'",text)
assets=[json.loads(x) for x in IMG_MAN.open(encoding="utf-8") if x.strip()]
by_base={Path(r["relativePath"]).name:r for r in assets if r["sourceId"]=="LOCAL.NE"}

products=[json.loads(x) for x in MASTER.open(encoding="utf-8") if x.strip()]
name_index=[]
for p in products:
    for name in [p["identity"]["name"],*(p["identity"].get("historicalNames") or [])]:
        name_index.append((norm(name),p))

def proto_name_for(key):
    patterns=[
      rf"<div class=\"pcard\"[^>]*openProd\('{re.escape(key)}'\)[\s\S]{{0,1800}}?<div class=\"pc-name\">([^<]+)</div>",
      rf"\b{re.escape(key)}:\{{id:'{re.escape(key)}'[\s\S]{{0,900}}?name:'([^']+)'",
    ]
    for pat in patterns:
        m=re.search(pat,text,re.I)
        if m:return re.sub(r"\s+"," ",m.group(1)).strip()
    # Known story variant keys point back to base product.
    if key.startswith("memangnarang"):
        return "Memang Narang"
    if key=="nefeast":
        return None
    return None

def canonical_candidates(name):
    if not name:return []
    n=norm(name)
    scored={}
    for alias,p in name_index:
        score=0.0
        if alias==n: score=1.0
        elif alias in n or n in alias:
            score=min(len(alias),len(n))/max(len(alias),len(n))
        else:
            at=set(alias.split()); nt=set(n.split())
            if at and nt:
                j=len(at&nt)/len(at|nt)
                seq=difflib.SequenceMatcher(None,alias,n).ratio()
                score=max(j,seq*0.85)
        if score>=0.45:
            prev=scored.get(p["productId"])
            if not prev or score>prev[0]:
                scored[p["productId"]]=(score,p)
    out=[]
    for score,p in sorted(scored.values(),key=lambda x:x[0],reverse=True)[:5]:
        out.append({"productId":p["productId"],"name":p["identity"]["name"],"category":p["identity"]["category"],"origin":p["identity"]["originLabel"],"score":round(score,3)})
    return out

out=[]
for key,filename in photo_pairs:
    # filenames in HTML have hash suffix, while recovered originals may not. Match by prefix before last -hash.
    exact=by_base.get(filename)
    if not exact:
        stem=Path(filename).stem
        prefix=re.sub(r"-[a-f0-9]{8}$","",stem,re.I)
        cands=[r for b,r in by_base.items() if Path(b).stem==prefix or Path(b).stem.startswith(prefix)]
        exact=cands[0] if cands else None
    pname=proto_name_for(key)
    out.append({"key":key,"htmlFilename":filename,"prototypeName":pname,"asset":None if not exact else {"relativePath":exact["relativePath"],"sha256":exact["sha256"],"sourceClass":exact.get("sourceClass"),"licenseStatus":exact.get("licenseStatus")},"canonicalCandidates":canonical_candidates(pname)})

print(json.dumps(out,ensure_ascii=True))
