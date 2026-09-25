import json, os, re
from pathlib import Path
from PIL import Image

REVIEW=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\.audit\phase-program\exhaustive-file-review-rerun-20260925-172329")
OUT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\.audit\phase-program\all-visual-assets")
ROOTS={
 "LOCAL.EBDESIGN":Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN"),
 "LOCAL.CONSOLIDATED":Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN-consolidated"),
 "LOCAL.NE":Path(r"C:\Users\DIYA GOEL\Desktop\ne"),
}
EXT={".jpg",".jpeg",".png",".webp",".gif",".bmp",".tif",".tiff",".svg"}
MAX=20*1024*1024
OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((REVIEW/"manifest.json").read_text(encoding="utf-8"))
shards=[]; fh=None; shard_bytes=0; shard_idx=0
def open_shard():
    global fh,shard_bytes,shard_idx
    if fh: fh.close()
    name=f"assets-{shard_idx:04d}.jsonl"; shard_idx+=1
    fh=open(OUT/name,"w",encoding="utf-8",newline="\n"); shard_bytes=0
    shards.append({"file":name,"records":0,"bytes":0})
def emit(o):
    global shard_bytes
    line=json.dumps(o,ensure_ascii=False,separators=(",",":"))+"\n"
    n=len(line.encode("utf-8"))
    if fh is None or shard_bytes+n>MAX: open_shard()
    fh.write(line); shard_bytes+=n; shards[-1]["records"]+=1; shards[-1]["bytes"]+=n

count=0; errors=0; by_source={}; hashes={}; role_counts={}
for sh in manifest["shards"]:
    with open(REVIEW/sh["file"],encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            r=json.loads(line)
            ext=(r.get("extension") or "").lower()
            if ext not in EXT: continue
            count+=1; sid=r["sourceId"]; by_source[sid]=by_source.get(sid,0)+1
            rel=r["relativePath"]; low=rel.lower()
            role="general"
            if any(x in low for x in ["/product","products/","catalog"]): role="product-candidate"
            elif any(x in low for x in ["/icon","icons/","favicon","logo"]): role="brand-ui"
            elif any(x in low for x in ["/public/","/assets/","/images/","image/"]): role="application-asset"
            elif sid=="LOCAL.NE": role="ne-recovery-asset"
            role_counts[role]=role_counts.get(role,0)+1
            h=r.get("sha256"); hashes.setdefault(h,[]).append((sid,rel))
            rec={"sourceId":sid,"relativePath":rel,"bytes":r.get("bytes"),"sha256":h,"extension":ext,"roleCandidate":role}
            p=ROOTS[sid]/Path(rel)
            if ext!=".svg":
                try:
                    with Image.open(p) as im:
                        rec.update({"width":im.width,"height":im.height,"format":im.format,"mode":im.mode,"frames":getattr(im,"n_frames",1)})
                except Exception as e:
                    errors+=1; rec["imageReadError"]=str(e)
            else:
                try:
                    txt=p.read_text(encoding="utf-8",errors="ignore")[:10000]
                    vb=re.search(r'viewBox\s*=\s*["\']([^"\']+)["\']',txt,re.I)
                    wh=re.search(r'<svg[^>]*\bwidth\s*=\s*["\']([^"\']+)["\'][^>]*\bheight\s*=\s*["\']([^"\']+)["\']',txt,re.I)
                    rec["vector"]=True
                    if vb: rec["viewBox"]=vb.group(1)
                    if wh: rec["declaredWidth"]=wh.group(1); rec["declaredHeight"]=wh.group(2)
                except Exception as e:
                    errors+=1; rec["imageReadError"]=str(e)
            emit(rec)
if fh: fh.close()
dup_groups=[{"sha256":h,"count":len(v),"members":[{"sourceId":sid,"path":p} for sid,p in v]} for h,v in hashes.items() if h and len(v)>1]
summary={
 "schemaVersion":1,"sourceManifest":str(REVIEW/"manifest.json"),"assetInstances":count,
 "uniqueHashes":len([h for h in hashes if h]),"exactDuplicateCopies":sum(max(0,len(v)-1) for h,v in hashes.items() if h),
 "readErrors":errors,"bySource":by_source,"roleCandidates":role_counts,
 "duplicateGroups":dup_groups[:500],"duplicateGroupCount":len(dup_groups),
 "maxShardBytes":MAX,"shards":shards,
 "preservationRule":"No visual asset is deleted, moved, or assigned to a product from path/filename alone. NE product mapping requires provenance/visual confirmation."
}
(OUT/"manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":errors==0,"assetInstances":count,"uniqueHashes":summary["uniqueHashes"],"exactDuplicateCopies":summary["exactDuplicateCopies"],"readErrors":errors,"bySource":by_source,"duplicateGroupCount":len(dup_groups),"shards":len(shards),"maxShardMB":max([s["bytes"] for s in shards] or [0])/1024/1024}))
