import os, re, json, hashlib, zipfile, xml.etree.ElementTree as ET, sys
from pathlib import Path
import fitz

ROOTS=[
    ("LOCAL.EBDESIGN", Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")),
    ("LOCAL.CONSOLIDATED", Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN-consolidated")),
    ("LOCAL.NE", Path(r"C:\Users\DIYA GOEL\Desktop\ne")),
]
OUT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\.audit\phase-program\rich-concept-documents")
MAX_SHARD=20*1024*1024
SKIP={".git","node_modules","dist","build","coverage",".cache",".vite",".next","out",".audit","_audit",".system-audit","_EBDESIGN_LIBRARY"}
INCLUDE=re.compile(r"(concept|architecture|specification|blueprint|directive|strategy|operating.?system|anatomy|intelligence|framework|roadmap|design|requirement|workflow|integration|vision|constitution|decision|value.?chain|technical|handoff|business.?report|variety|procurement)",re.I)
EXCLUDE=re.compile(r"(index|inventory|audit|status|summary|cache|manifest|file.?map|junk|certificate)",re.I)
WNS={"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

OUT.mkdir(parents=True,exist_ok=True)
shards=[]; out=None; out_bytes=0; shard_index=0
def open_shard():
    global out,out_bytes,shard_index
    if out: out.close()
    name=f"documents-{shard_index:04d}.jsonl"; shard_index+=1
    out=open(OUT/name,"w",encoding="utf-8",newline="\n"); out_bytes=0
    shards.append({"file":name,"records":0,"bytes":0})
def emit(obj):
    global out_bytes
    line=json.dumps(obj,ensure_ascii=False,separators=(",",":"))+"\n"
    n=len(line.encode("utf-8"))
    if out is None or out_bytes+n>MAX_SHARD: open_shard()
    out.write(line); out_bytes+=n
    shards[-1]["records"]+=1; shards[-1]["bytes"]+=n
def sha256(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()
def eligible(p):
    return p.suffix.lower() in {".pdf",".docx"} and INCLUDE.search(p.name) and not EXCLUDE.search(p.name)
def walk(root):
    for dp,dns,fns in os.walk(root):
        dns[:]=[d for d in dns if d not in SKIP]
        for fn in fns:
            p=Path(dp)/fn
            if eligible(p): yield p
def pdf_records(source_id,root,p,h):
    doc=fitz.open(p)
    for i,page in enumerate(doc):
        txt=page.get_text("text").strip()
        emit({"sourceId":source_id,"relativePath":p.relative_to(root).as_posix(),"fileSha256":h,"kind":"pdf-page","page":i+1,"chars":len(txt),"text":txt})
    return len(doc)
def docx_records(source_id,root,p,h):
    count=0
    with zipfile.ZipFile(p) as z:
        xml=z.read("word/document.xml")
    tree=ET.fromstring(xml)
    body=tree.find("w:body",WNS)
    if body is None: return 0
    block=0
    for child in body:
        tag=child.tag.split("}")[-1]
        if tag=="p":
            txt="".join((t.text or "") for t in child.findall(".//w:t",WNS)).strip()
            if txt:
                emit({"sourceId":source_id,"relativePath":p.relative_to(root).as_posix(),"fileSha256":h,"kind":"docx-paragraph","block":block,"chars":len(txt),"text":txt});count+=1
        elif tag=="tbl":
            rows=[]
            for tr in child.findall("w:tr",WNS):
                row=[]
                for tc in tr.findall("w:tc",WNS):
                    row.append(" ".join((t.text or "") for t in tc.findall(".//w:t",WNS)).strip())
                rows.append(row)
            emit({"sourceId":source_id,"relativePath":p.relative_to(root).as_posix(),"fileSha256":h,"kind":"docx-table","block":block,"rows":rows});count+=1
        block+=1
    return count

files=0; unique=0; exact_dupes=0; records=0; errors=[]; seen={}
summaries=[]
for source_id,root in ROOTS:
    for p in walk(root):
        files+=1
        try:
            h=sha256(p)
            if h in seen:
                exact_dupes+=1
                summaries.append({"sourceId":source_id,"relativePath":p.relative_to(root).as_posix(),"sha256":h,"duplicateOf":seen[h]})
                continue
            seen[h]={"sourceId":source_id,"relativePath":p.relative_to(root).as_posix()}
            unique+=1
            before=sum(s["records"] for s in shards)
            if p.suffix.lower()==".pdf": blocks=pdf_records(source_id,root,p,h)
            else: blocks=docx_records(source_id,root,p,h)
            after=sum(s["records"] for s in shards); records+=after-before
            summaries.append({"sourceId":source_id,"relativePath":p.relative_to(root).as_posix(),"sha256":h,"bytes":p.stat().st_size,"blocks":blocks})
        except Exception as e:
            errors.append({"sourceId":source_id,"relativePath":p.relative_to(root).as_posix(),"error":str(e)})
if out: out.close()
manifest={"schemaVersion":1,"generatedAt":__import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),"candidateFiles":files,"uniqueFiles":unique,"exactDuplicateSources":exact_dupes,"records":records,"errors":errors,"fileSummaries":summaries,"maxShardBytes":MAX_SHARD,"shards":shards,"rule":"Direct PDF/DOCX extraction from source files; generated indexes/audits excluded by discovery policy; OCR not used when embedded text is available."}
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":len(errors)==0,"candidateFiles":files,"uniqueFiles":unique,"exactDuplicateSources":exact_dupes,"records":records,"errors":len(errors),"shards":len(shards),"maxShardMB":max([s["bytes"] for s in shards] or [0])/1024/1024}))
