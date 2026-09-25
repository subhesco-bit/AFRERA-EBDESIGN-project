import os, re, json, hashlib
from pathlib import Path
from PIL import Image

ROOT = Path(r"C:\Users\DIYA GOEL\Desktop\ne")
OUT = Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\.audit\phase-program\visual-assets")
OUT.mkdir(parents=True, exist_ok=True)
IMG_EXT={'.jpg','.jpeg','.png','.webp','.gif','.bmp','.tif','.tiff'}

def sha256(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

html_files=list(ROOT.rglob('*.html'))
html_text={}
for p in html_files:
    try: html_text[p]=p.read_text(encoding='utf-8',errors='ignore')
    except Exception: pass

catalog=[]
for p,t in html_text.items():
    if 'CATALOG_RAW' in t:
        m=re.search(r'window\.CATALOG_RAW\s*=\s*(\[[^\r\n]*\])\s*;',t)
        if m:
            try:
                x=json.loads(m.group(1))
                if len(x)>len(catalog): catalog=x
            except Exception:
                pass

def norm_tokens(s):
    s=re.sub(r'\.[A-Za-z0-9]+$','',s.lower())
    s=re.sub(r'\b(copy|image|img|photo|download|unsplash|jpg|jpeg|png|webp)\b',' ',s)
    s=re.sub(r'[_\-()0-9]+',' ',s)
    return [x for x in re.findall(r'[a-z]{3,}',s) if x not in {'the','and','for','with','from'}]

product_names=[]
for row in catalog:
    if isinstance(row,list) and row:
        product_names.append(str(row[0]))
    elif isinstance(row,dict):
        product_names.append(str(row.get('name') or row.get('product') or ''))

assets=[]
for p in sorted([x for x in ROOT.rglob('*') if x.is_file() and x.suffix.lower() in IMG_EXT]):
    rec={'path':str(p.relative_to(ROOT)).replace('\\','/'),'name':p.name,'bytes':p.stat().st_size,'sha256':sha256(p)}
    try:
        with Image.open(p) as im:
            rec.update(width=im.width,height=im.height,format=im.format,mode=im.mode)
    except Exception as e:
        rec['imageReadError']=str(e)
    refs=[]
    contexts=[]
    for hp,t in html_text.items():
        if p.name in t:
            refs.append(str(hp.relative_to(ROOT)).replace('\\','/'))
            i=t.find(p.name)
            contexts.append(re.sub(r'\s+',' ',t[max(0,i-180):i+len(p.name)+180])[:500])
    rec['htmlReferences']=refs
    rec['referenceContexts']=contexts[:5]
    toks=norm_tokens(p.name)
    candidates=[]
    if toks:
        for name in product_names:
            low=name.lower()
            hits=sum(1 for tok in toks if tok in low)
            score=hits/len(toks)
            if hits and score>=0.5:
                candidates.append({'product':name,'score':round(score,3)})
        candidates=sorted(candidates,key=lambda x:(-x['score'],x['product']))[:10]
    rec['filenameProductCandidates']=candidates
    assets.append(rec)

groups={}
for a in assets: groups.setdefault(a['sha256'],[]).append(a['path'])
dup=[{'sha256':h,'count':len(v),'files':v} for h,v in groups.items() if len(v)>1]
summary={
 'schemaVersion':1,
 'generatedAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
 'assetCount':len(assets),
 'uniqueHashes':len(groups),
 'exactDuplicateCopies':len(assets)-len(groups),
 'htmlReferencedAssets':sum(1 for a in assets if a['htmlReferences']),
 'orphanVisualAssets':sum(1 for a in assets if not a['htmlReferences']),
 'catalogCount':len(catalog),
 'assetsWithFilenameProductCandidates':sum(1 for a in assets if a['filenameProductCandidates']),
 'duplicateGroups':dup,
 'preservationRule':'No image is deleted or assigned to a product solely from filename matching. Candidates require provenance/visual verification.'
}
(OUT/'assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ok':True,**{k:v for k,v in summary.items() if k not in {'duplicateGroups','preservationRule'}}}))
