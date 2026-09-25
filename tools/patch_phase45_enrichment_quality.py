from pathlib import Path
import re

p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_ne_variety_enrichment.py')
t=p.read_text(encoding='utf-8')

old='''aliases={}
for p in products:
    vals=[p["identity"]["name"],*(p["identity"].get("historicalNames") or [])]
    aliases[p["productId"]]=sorted({norm(x) for x in vals if norm(x)},key=len,reverse=True)
'''
new='''aliases={}
raw_aliases={}
for p in products:
    vals=[p["identity"]["name"],*(p["identity"].get("historicalNames") or [])]
    raw_aliases[p["productId"]]=sorted({str(x).strip() for x in vals if str(x).strip()},key=len,reverse=True)
    aliases[p["productId"]]=sorted({norm(x) for x in vals if norm(x)},key=len,reverse=True)
'''
if old not in t: raise RuntimeError('aliases block missing')
t=t.replace(old,new,1)

start=t.index('def add_evidence(pid,source,locator,text,kind):')
end=t.index('# Source 1: authoritative prototype row for every product.')
block='''def decode_escaped_unicode(text):
    text=str(text or "")
    return re.sub(r"\\\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1),16)), text)

def context_for_product(text,pid,radius=240):
    raw=decode_escaped_unicode(text)
    for alias in raw_aliases.get(pid,[]):
        words=re.findall(r"[A-Za-z0-9]+",alias)
        if not words:
            continue
        pattern=r"\\b"+r"[\\s\\W_]+".join(re.escape(w) for w in words)+r"\\b"
        m=re.search(pattern,raw,re.I)
        if m:
            lo=max(0,m.start()-radius)
            hi=min(len(raw),m.end()+radius)
            return raw[lo:hi].strip()
    normalized=norm(raw)
    if any(alias in normalized for alias in aliases.get(pid,[])) and len(raw)<=800:
        return raw.strip()
    return None

def add_evidence(pid,source,locator,text,kind):
    text=str(text or "").strip()
    if not text: return
    existing={(e["source"],e["locator"],e["text"]) for e in evidence[pid]}
    item={"source":source,"locator":locator,"kind":kind,"text":text[:700],"textSha256":sha(text)}
    sig=(item["source"],item["locator"],item["text"])
    if sig not in existing and len(evidence[pid])<30:
        evidence[pid].append(item)

def match_products(text):
    n=norm(decode_escaped_unicode(text))
    toks=set(n.split())
    candidates=set()
    for tok in toks:
        candidates.update(anchors.get(tok,()))
    found=[]
    for pid in candidates:
        if any(alias and alias in n for alias in aliases[pid]):
            found.append(pid)
    return found

def add_matched_evidence(source,locator,text,kind):
    for pid in match_products(text):
        ctx=context_for_product(text,pid)
        if ctx:
            add_evidence(pid,source,locator,ctx,kind)

'''
t=t[:start]+block+t[end:]

t=t.replace('''            for pid in match_products(line):
                add_evidence(pid,"LOCAL.NE:"+latest.name,f"line:{line_no}",line.strip(),"ne-html")''','''            add_matched_evidence("LOCAL.NE:"+latest.name,f"line:{line_no}",line.strip(),"ne-html")''')
t=t.replace('''            for pid in match_products(text):
                add_evidence(
                    pid,
                    rec.get("sourceId","UNKNOWN")+":"+rec.get("relativePath",""),
                    "section:"+str(rec.get("sectionIndex","")),
                    text,
                    "concept-section"
                )''','''            add_matched_evidence(
                rec.get("sourceId","UNKNOWN")+":"+rec.get("relativePath",""),
                "section:"+str(rec.get("sectionIndex","")),
                text,
                "concept-section"
            )''')
t=t.replace('''            for pid in match_products(text):
                locator="page:"+str(rec.get("page","")) if rec.get("page") else "record"
                add_evidence(pid,rec.get("sourceId","UNKNOWN")+":"+rec.get("relativePath",""),locator,text,"rich-document")''','''            locator="page:"+str(rec.get("page","")) if rec.get("page") else "record"
            add_matched_evidence(rec.get("sourceId","UNKNOWN")+":"+rec.get("relativePath",""),locator,text,"rich-document")''')

oldbin='''BINOMIAL_RE=re.compile(r"\\b([A-Z][a-z]{2,})\\s+([a-z][a-z-]{2,})\\b")'''
newbin='''BINOMIAL_EXACT_RE=re.compile(r"^([A-Z][a-z]{2,})\\s+([a-z][a-z-]{2,})(?:\\s+(?:subsp\\.|var\\.)\\s+[a-z-]+)?$")
BINOMIAL_START_RE=re.compile(r"^([A-Z][a-z]{2,})\\s+([a-z][a-z-]{2,})(?=\\s+[A-Z(]|$)")'''
if oldbin not in t: raise RuntimeError('binomial regex missing')
t=t.replace(oldbin,newbin,1)

s=t.index('def scientific_from_name(name):')
e=t.index('def quantitative_bio(pid):')
newfunc='''def scientific_from_name(name):
    for candidate in re.findall(r"\\(([^)]+)\\)",name):
        m=BINOMIAL_EXACT_RE.match(candidate.strip())
        if m:
            return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    m=BINOMIAL_START_RE.match(name.strip())
    if m:
        return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    return None,None

'''
t=t[:s]+newfunc+t[e:]

s=t.index('def quantitative_bio(pid):')
e=t.index('records=[]')
newquant='''def quantitative_bio(pid):
    out=[]
    patterns=[
        ("curcumin",re.compile(r"curcumin(?:\\s+(?:content|level|potency))?\\s*(?:[:=,;-]|is)?\\s*([<>≥≤~]?\\s*\\d+(?:\\.\\d+)?\\s*%)",re.I)),
        ("protein",re.compile(r"protein\\s*[:=,;-]\\s*([<>≥≤~]?\\s*\\d+(?:\\.\\d+)?\\s*(?:g(?:/100g)?|%))",re.I)),
        ("fibre",re.compile(r"(?:fibre|fiber)\\s*[:=,;-]\\s*([<>≥≤~]?\\s*\\d+(?:\\.\\d+)?\\s*(?:g(?:/100g)?|%))",re.I)),
        ("vitamin_c",re.compile(r"vitamin\\s*c(?:\\s+content)?\\s*[:=,;-]?\\s*([<>≥≤~]?\\s*\\d+(?:\\.\\d+)?\\s*(?:mg(?:/100g)?|%))",re.I)),
    ]
    seen=set()
    for ev in snippets(pid):
        text=decode_escaped_unicode(ev["text"])
        for metric,pat in patterns:
            m=pat.search(text)
            if not m:
                continue
            value=re.sub(r"\\s+","",m.group(1))
            key=(metric,value,ev["textSha256"])
            if key in seen:
                continue
            seen.add(key)
            out.append({
                "metric":metric,"reportedValueText":value,
                "verificationStatus":"LOCAL_CLAIM_NOT_EXTERNALLY_VERIFIED",
                "source":{"source":ev["source"],"locator":ev["locator"],"textSha256":ev["textSha256"],"quote":text[:320]}
            })
    return out[:12]

'''
t=t[:s]+newquant+t[e:]

p.write_text(t,encoding='utf-8')
print('phase45 evidence locality and taxonomy parser tightened')
