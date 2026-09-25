import json, hashlib, zipfile, io
from pathlib import Path
from datetime import datetime, timezone
import fitz
from PIL import Image
import xml.etree.ElementTree as ET

ROOT=Path(r"C:\Users\DIYA GOEL\Desktop\ne")
OUT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\.audit\phase-program\rich-binary-recovery")
OUT.mkdir(parents=True,exist_ok=True)
WNS={"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
EXT={".pdf",".docx"}

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()

def pdf_info(p,h):
    doc=fitz.open(p); images={}; tables=[]; pages=[]
    for i,page in enumerate(doc):
        text=page.get_text("text")
        pimgs=[]
        for im in page.get_images(full=True):
            xref=im[0]
            try:
                data=doc.extract_image(xref); raw=data.get("image",b"")
                ih=sha_bytes(raw)
                meta={"xref":xref,"sha256":ih,"bytes":len(raw),"ext":data.get("ext"),"width":data.get("width"),"height":data.get("height"),"colorspace":data.get("colorspace")}
                images.setdefault(ih,meta); pimgs.append(ih)
            except Exception as e:
                pimgs.append("ERROR:"+str(e))
        page_tables=[]
        try:
            finder=page.find_tables()
            for ti,t in enumerate(finder.tables):
                data=t.extract()
                page_tables.append({"tableIndex":ti,"rows":len(data),"cols":max([len(r) for r in data] or [0]),"data":data})
        except Exception:
            pass
        if page_tables:
            tables.append({"page":i+1,"tables":page_tables})
        pages.append({"page":i+1,"textChars":len(text),"imageHashes":pimgs,"tableCount":len(page_tables)})
    return {"kind":"pdf","sha256":h,"bytes":p.stat().st_size,"metadata":doc.metadata,"pageCount":len(doc),"pages":pages,"uniqueEmbeddedImages":list(images.values()),"embeddedImageCount":len(images),"tables":tables,"tablePageCount":len(tables)}

def docx_info(p,h):
    media=[]; paragraph_count=0; tables=[]; rels=[]
    with zipfile.ZipFile(p) as z:
        names=z.namelist()
        for name in names:
            if name.startswith("word/media/") and not name.endswith("/"):
                b=z.read(name); rec={"packagePath":name,"sha256":sha_bytes(b),"bytes":len(b)}
                try:
                    with Image.open(io.BytesIO(b)) as im:
                        rec.update({"width":im.width,"height":im.height,"format":im.format,"mode":im.mode})
                except Exception as e:
                    rec["imageReadError"]=str(e)
                media.append(rec)
        tree=ET.fromstring(z.read("word/document.xml"))
        body=tree.find("w:body",WNS)
        if body is not None:
            for child in body:
                tag=child.tag.split("}")[-1]
                if tag=="p":
                    txt="".join((t.text or "") for t in child.findall(".//w:t",WNS)).strip()
                    if txt: paragraph_count+=1
                elif tag=="tbl":
                    rows=[]
                    for tr in child.findall("w:tr",WNS):
                        row=[]
                        for tc in tr.findall("w:tc",WNS):
                            row.append(" ".join((t.text or "") for t in tc.findall(".//w:t",WNS)).strip())
                        rows.append(row)
                    tables.append({"rows":len(rows),"cols":max([len(r) for r in rows] or [0]),"data":rows})
        if "word/_rels/document.xml.rels" in names:
            rtree=ET.fromstring(z.read("word/_rels/document.xml.rels"))
            for x in rtree:
                rels.append({"Id":x.attrib.get("Id"),"Type":x.attrib.get("Type"),"Target":x.attrib.get("Target"),"TargetMode":x.attrib.get("TargetMode")})
    return {"kind":"docx","sha256":h,"bytes":p.stat().st_size,"paragraphCount":paragraph_count,"tableCount":len(tables),"tables":tables,"mediaCount":len(media),"media":media,"relationships":rels}

paths=sorted([p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in EXT])
seen={}; records=[]; errors=[]
for p in paths:
    try:
        h=sha_file(p)
        rel=p.relative_to(ROOT).as_posix()
        if h in seen:
            records.append({"relativePath":rel,"sha256":h,"duplicateOf":seen[h]})
            continue
        seen[h]=rel
        info=pdf_info(p,h) if p.suffix.lower()==".pdf" else docx_info(p,h)
        info["relativePath"]=rel
        records.append(info)
    except Exception as e:
        errors.append({"relativePath":p.relative_to(ROOT).as_posix(),"error":str(e)})
summary={
 "schemaVersion":1,"generatedAt":datetime.now(timezone.utc).isoformat(),
 "files":len(paths),"uniqueHashes":len(seen),"exactDuplicateCopies":len(paths)-len(seen),
 "pdfs":sum(1 for r in records if r.get("kind")=="pdf"),"docx":sum(1 for r in records if r.get("kind")=="docx"),
 "embeddedImages":sum(r.get("embeddedImageCount",r.get("mediaCount",0)) for r in records),
 "tables":sum(len(r.get("tables",[])) for r in records),
 "errors":errors,
 "rule":"Embedded structures are inventoried by hash/metadata; no embedded binary is promoted, extracted into production assets, or discarded without later provenance/visual reconciliation."
}
(OUT/"documents.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUT/"manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":len(errors)==0,**{k:v for k,v in summary.items() if k not in {"errors","rule"}},"recordsBytes":(OUT/"documents.json").stat().st_size}))
