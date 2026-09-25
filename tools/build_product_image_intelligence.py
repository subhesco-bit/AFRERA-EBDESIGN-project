from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import json, hashlib, math, re

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
ASSET_DIR=ROOT/".audit"/"phase-program"/"all-visual-assets"
OUT=ROOT/".audit"/"phase-program"/"product-image-intelligence"
OUT.mkdir(parents=True,exist_ok=True)
ROOTS={
 "LOCAL.EBDESIGN":ROOT,
 "LOCAL.CONSOLIDATED":Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN-consolidated"),
 "LOCAL.NE":Path(r"C:\Users\DIYA GOEL\Desktop\ne"),
}
rows=[]
for p in sorted(ASSET_DIR.glob("assets-*.jsonl")):
    for line in p.open(encoding="utf-8",errors="replace"):
        if line.strip(): rows.append(json.loads(line))

def scope(rel):
    x=rel.replace("\\","/")
    if re.search(r"(^|/)node_modules/",x): return "vendor"
    if re.search(r"(^|/)(\.archive|\.claude|New folder)(/|$)",x): return "archive-worktree"
    if re.search(r"(^|/)(dist|build|coverage)(/|$)",x): return "generated-build"
    return "active-like"

def dhash(path, size=8):
    with Image.open(path) as im:
        im=ImageOps.exif_transpose(im).convert("L").resize((size+1,size),Image.Resampling.LANCZOS)
        pix=list(im.getdata())
        bits=[]
        for y in range(size):
            off=y*(size+1)
            for x in range(size):
                bits.append(1 if pix[off+x]>pix[off+x+1] else 0)
        value=0
        for bit in bits:value=(value<<1)|bit
        return f"{value:0{size*size//4}x}"

def ham(a,b):
    return (int(a,16)^int(b,16)).bit_count()

def provenance(rel,source):
    low=rel.lower()
    base=Path(rel).name.lower()
    if source=="LOCAL.NE":
        if "unsplash" in base:
            return {"sourceClass":"THIRD_PARTY_SOURCE_DECLARED","sourceHint":"Unsplash filename/photographer slug","licenseStatus":"SOURCE_DECLARED_LICENSE_NOT_VERIFIED"}
        if re.search(r"_[0-9]{6,}_[0-9]+_n\.",base) or any(h in base for h in ["beautifulnortheastindia","janicepariat","pindrop10","radiowellness_magazine"]):
            return {"sourceClass":"SOCIAL_SOURCE_HANDLE_CANDIDATE","sourceHint":"Social-media style filename/handle","licenseStatus":"LICENSE_UNKNOWN"}
        if base.startswith("download") or base.startswith("images"):
            return {"sourceClass":"UNKNOWN_DOWNLOADED_ASSET","sourceHint":None,"licenseStatus":"LICENSE_UNKNOWN"}
        if "g.i-tag-products" in base:
            return {"sourceClass":"THIRD_PARTY_DOCUMENTARY_GRAPHIC","sourceHint":"GI-tag graphic filename","licenseStatus":"LICENSE_UNKNOWN"}
        return {"sourceClass":"RECOVERED_NE_ASSET","sourceHint":None,"licenseStatus":"LICENSE_UNKNOWN"}
    if "/icons/" in low or "/mipmap-" in low or "logo" in low or "splash" in low:
        return {"sourceClass":"PROJECT_BRAND_OR_APP_ASSET","sourceHint":"Project application asset path","licenseStatus":"PROJECT_ORIGIN_NOT_LICENSE_VERIFIED"}
    if "node_modules" in low:
        return {"sourceClass":"VENDOR_DEPENDENCY_ASSET","sourceHint":"Package fixture/resource","licenseStatus":"VENDOR_LICENSE_GOVERNS"}
    return {"sourceClass":"PROJECT_ASSET_UNKNOWN_ORIGIN","sourceHint":None,"licenseStatus":"LICENSE_UNKNOWN"}

records=[]
for r in rows:
    rel=r["relativePath"]; sid=r["sourceId"]; ext=r["extension"].lower()
    rec={**r,"scope":scope(rel),**provenance(rel,sid)}
    p=ROOTS[sid]/Path(rel)
    if ext!=".svg" and p.exists() and not r.get("imageReadError"):
        try:
            rec["dhash64"]=dhash(p)
            with Image.open(p) as im:
                exif=im.getexif()
                meta={}
                for key,val in exif.items():
                    try:
                        sval=str(val)
                        if len(sval)<=500: meta[str(key)]=sval
                    except Exception: pass
                rec["exifPresent"]=bool(meta)
                rec["exifMetadata"]=meta if meta else None
        except Exception as e:
            rec["perceptualHashError"]=str(e)
    records.append(rec)

# Unique exact representatives, prefer active-like then EBDESIGN then NE then consolidated.
scope_rank={"active-like":3,"generated-build":2,"archive-worktree":1,"vendor":0}
source_rank={"LOCAL.EBDESIGN":3,"LOCAL.NE":2,"LOCAL.CONSOLIDATED":1}
by_sha={}
for r in records:
    by_sha.setdefault(r.get("sha256"),[]).append(r)
reps=[]
for h,group in by_sha.items():
    if not h: continue
    chosen=sorted(group,key=lambda r:(scope_rank.get(r["scope"],-1),source_rank.get(r["sourceId"],0),-len(r["relativePath"])),reverse=True)[0]
    reps.append(chosen)

# Perceptual similarity on unique raster representatives.
raster=[r for r in reps if r.get("dhash64")]
parent=list(range(len(raster)))
def find(x):
    while parent[x]!=x:
        parent[x]=parent[parent[x]];x=parent[x]
    return x
def union(a,b):
    ra,rb=find(a),find(b)
    if ra!=rb: parent[rb]=ra

edges=[]
for i in range(len(raster)):
    for j in range(i+1,len(raster)):
        d=ham(raster[i]["dhash64"],raster[j]["dhash64"])
        if d<=5:
            union(i,j)
            edges.append({"a":raster[i]["sha256"],"b":raster[j]["sha256"],"hamming":d})

groups={}
for i,r in enumerate(raster):groups.setdefault(find(i),[]).append(r)
similar=[]
for g in groups.values():
    hashes=sorted({x["sha256"] for x in g})
    if len(hashes)>1:
        similar.append({
            "groupId":"PH-"+hashlib.sha256("|".join(hashes).encode()).hexdigest()[:12].upper(),
            "uniqueExactHashes":len(hashes),
            "members":[{"sha256":x["sha256"],"sourceId":x["sourceId"],"relativePath":x["relativePath"],"dhash64":x["dhash64"],"width":x.get("width"),"height":x.get("height")} for x in g]
        })

# NE contact sheet for human/model visual triage.
ne=[r for r in records if r["sourceId"]=="LOCAL.NE" and r["scope"]=="active-like" and r.get("dhash64")]
thumb_w,thumb_h=220,170
cols=4
rows_n=math.ceil(len(ne)/cols)
sheet=Image.new("RGB",(cols*thumb_w,rows_n*thumb_h),"white")
draw=ImageDraw.Draw(sheet)
for idx,r in enumerate(ne):
    p=ROOTS[r["sourceId"]]/Path(r["relativePath"])
    try:
        with Image.open(p) as im:
            im=ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((thumb_w-10,thumb_h-42),Image.Resampling.LANCZOS)
            x=(idx%cols)*thumb_w+(thumb_w-im.width)//2
            y=(idx//cols)*thumb_h+4
            sheet.paste(im,(x,y))
    except Exception: pass
    label=f"{idx+1:02d} {Path(r['relativePath']).name[:27]}"
    draw.text(((idx%cols)*thumb_w+5,(idx//cols)*thumb_h+thumb_h-34),label,fill="black")
    draw.text(((idx%cols)*thumb_w+5,(idx//cols)*thumb_h+thumb_h-18),f"{r.get('width','?')}x{r.get('height','?')} {r['licenseStatus'][:18]}",fill="black")
sheet_path=OUT/"ne-contact-sheet.jpg"
sheet.save(sheet_path,quality=86,optimize=True)

with (OUT/"assets.jsonl").open("w",encoding="utf-8") as f:
    for r in records:f.write(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n")
(OUT/"perceptual-groups.json").write_text(json.dumps(similar,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
(OUT/"similarity-edges.json").write_text(json.dumps(edges,indent=2)+"\n",encoding="utf-8")

scopes={}
licenses={}
sources={}
for r in records:
    scopes[r["scope"]]=scopes.get(r["scope"],0)+1
    licenses[r["licenseStatus"]]=licenses.get(r["licenseStatus"],0)+1
    sources[r["sourceClass"]]=sources.get(r["sourceClass"],0)+1
manifest={
 "schemaVersion":1,
 "assetInstances":len(records),
 "uniqueExactHashes":len(reps),
 "activeLikeInstances":sum(1 for r in records if r["scope"]=="active-like"),
 "activeLikeUniqueExactHashes":len({r["sha256"] for r in records if r["scope"]=="active-like" and r.get("sha256")}),
 "neActiveAssets":len(ne),
 "perceptualGroups":len(similar),
 "perceptualEdges":len(edges),
 "scopeCounts":scopes,
 "licenseStatusCounts":licenses,
 "sourceClassCounts":sources,
 "readErrors":sum(1 for r in records if r.get("imageReadError")),
 "perceptualHashErrors":sum(1 for r in records if r.get("perceptualHashError")),
 "rules":[
   "No file is deleted, moved, published or assigned to a product by this analysis.",
   "Exact SHA-256 identity and perceptual similarity are different signals.",
   "Perceptual groups are candidates for human/visual review, not proof of duplicate semantic content.",
   "Filename/path source hints do not prove a license; license remains unverified unless explicit evidence is found.",
   "Vendor/build/archive/worktree assets are retained but excluded from production image coverage.",
   "NE recovered photography requires provenance/license confirmation before public production use."
 ],
 "artifacts":{"assets":"assets.jsonl","perceptualGroups":"perceptual-groups.json","similarityEdges":"similarity-edges.json","contactSheet":"ne-contact-sheet.jpg"}
}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,**{k:manifest[k] for k in ["assetInstances","uniqueExactHashes","activeLikeInstances","activeLikeUniqueExactHashes","neActiveAssets","perceptualGroups","perceptualEdges","readErrors","perceptualHashErrors"]},"contactSheetBytes":sheet_path.stat().st_size}))
