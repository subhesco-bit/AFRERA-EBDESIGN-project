import re, json, hashlib
from pathlib import Path
from collections import defaultdict

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
OUT=ROOT/".audit"/"phase-program"/"data-model-catalog"
OUT.mkdir(parents=True,exist_ok=True)

roots=[ROOT/"backend"/"src"/"database", ROOT/"modules"]
sql_files=[]
for base in roots:
    if not base.exists(): continue
    for p in base.rglob("*.sql"):
        if any(part in {"node_modules","dist","build",".git"} for part in p.parts): continue
        sql_files.append(p)

create_re=re.compile(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?([\w.]+)"?)\s*\((.*?)\)\s*;',re.I|re.S)
ref_re=re.compile(r'REFERENCES\s+(?:"?([\w.]+)"?)\s*\(([^)]+)\)',re.I)
pk_re=re.compile(r'PRIMARY\s+KEY',re.I)
unique_re=re.compile(r'\bUNIQUE\b',re.I)

def split_top(s):
    out=[];buf=[];depth=0;quote=None
    for ch in s:
        if quote:
            buf.append(ch)
            if ch==quote: quote=None
            continue
        if ch in ("'",'"'):
            quote=ch;buf.append(ch);continue
        if ch=="(": depth+=1
        elif ch==")": depth=max(0,depth-1)
        if ch=="," and depth==0:
            out.append("".join(buf).strip());buf=[]
        else: buf.append(ch)
    if buf: out.append("".join(buf).strip())
    return [x for x in out if x]

def infer_owner(rel,table):
    low=(rel+" "+table).lower()
    mapping=[
      ("identity",["auth","user","role","permission","tenant","organization"]),
      ("finance",["ledger","invoice","payment","account","finance","gst","tax","escrow"]),
      ("commerce",["product","order","cart","marketplace","catalog"]),
      ("logistics",["shipment","fleet","vehicle","driver","route","warehouse","inventory"]),
      ("insurance",["policy","claim","premium","underwriting"]),
      ("agriculture",["farmer","farm","crop","soil","seed","fpo","village"]),
      ("livestock",["animal","livestock","veterinary","dairy","poultry"]),
      ("ai",["ai_","embedding","knowledge_graph","model","agent"]),
      ("quality",["quality","capa","inspection","lab","coa"]),
      ("hr",["employee","payroll","attendance","leave"]),
    ]
    for owner,terms in mapping:
        if any(t in low for t in terms): return owner
    return "unclassified"

records=[]
for p in sql_files:
    try: text=p.read_text(encoding="utf-8",errors="replace")
    except Exception: continue
    rel=p.relative_to(ROOT).as_posix()
    file_hash=hashlib.sha256(text.encode("utf-8",errors="replace")).hexdigest()
    for m in create_re.finditer(text):
        table=m.group(1)
        body=m.group(2)
        entries=split_top(body)
        cols=[];refs=[]
        for entry in entries:
            e=entry.strip()
            rm=ref_re.search(e)
            if rm: refs.append({"table":rm.group(1),"columns":[c.strip(' "') for c in rm.group(2).split(",")]})
            first=e.split()
            if not first: continue
            if first[0].upper() in {"PRIMARY","FOREIGN","UNIQUE","CONSTRAINT","CHECK","EXCLUDE"}: continue
            name=first[0].strip('"')
            dtype=" ".join(first[1:3]) if len(first)>1 else ""
            cols.append({
                "name":name,
                "type":dtype,
                "primaryKey":bool(pk_re.search(e)),
                "unique":bool(unique_re.search(e)),
                "nullable":not bool(re.search(r'\bNOT\s+NULL\b',e,re.I)),
                "references":rm.group(1) if rm else None
            })
        sig=hashlib.sha256(json.dumps({"columns":cols,"refs":refs},sort_keys=True).encode()).hexdigest()
        records.append({
            "entityType":"table",
            "table":table,
            "sourceFile":rel,
            "sourceFileSha256":file_hash,
            "definitionSha256":sig,
            "owner":infer_owner(rel,table),
            "columns":cols,
            "foreignKeys":refs,
            "retentionPolicy":"UNCLASSIFIED_REQUIRES_DOMAIN_POLICY",
            "sourceOfTruthStatus":"CANDIDATE_NOT_AUTO_SELECTED"
        })

by_table=defaultdict(list)
for r in records: by_table[r["table"].lower()].append(r)
conflicts=[]
for table,defs in by_table.items():
    sigs=sorted(set(d["definitionSha256"] for d in defs))
    if len(sigs)>1:
        conflicts.append({
            "table":table,
            "definitions":len(defs),
            "distinctDefinitions":len(sigs),
            "sources":[d["sourceFile"] for d in defs[:50]],
            "status":"REQUIRES_RECONCILIATION"
        })

graph_edges=[]
for r in records:
    for fk in r["foreignKeys"]:
        graph_edges.append({"from":r["table"],"to":fk["table"],"type":"foreign_key","sourceFile":r["sourceFile"]})

details=OUT/"tables.jsonl"
with details.open("w",encoding="utf-8") as f:
    for r in records: f.write(json.dumps(r,ensure_ascii=False)+"\n")

manifest={
 "schemaVersion":1,
 "sqlFiles":len(sql_files),
 "tableDefinitions":len(records),
 "uniqueTables":len(by_table),
 "conflictingTables":len(conflicts),
 "owners":dict(sorted((k,sum(1 for r in records if r["owner"]==k)) for k in set(r["owner"] for r in records))),
 "foreignKeyEdges":len(graph_edges),
 "conflictSamples":conflicts[:250],
 "rules":[
  "No table definition is selected as canonical solely from filename, timestamp, migration number, or folder.",
  "Canonical ownership is domain-level and must be reconciled with live service callers and migrations.",
  "Retention remains unresolved unless an explicit domain/regulatory policy exists.",
  "Destructive schema consolidation requires migration and rollback evidence."
 ],
 "detailsFile":"tables.jsonl"
}
(OUT/"foreign-key-edges.jsonl").write_text("".join(json.dumps(e)+"\n" for e in graph_edges),encoding="utf-8")
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,"sqlFiles":len(sql_files),"tableDefinitions":len(records),"uniqueTables":len(by_table),"conflictingTables":len(conflicts),"foreignKeyEdges":len(graph_edges),"detailsMB":details.stat().st_size/1024/1024}))
