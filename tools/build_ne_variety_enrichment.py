import json, re, unicodedata, hashlib
from pathlib import Path
from collections import defaultdict, Counter

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
NE=Path(r"C:\Users\DIYA GOEL\Desktop\ne")
MASTER=ROOT/"backend/src/data/product-master/ne-products.jsonl"
OUT=ROOT/".audit/phase-program/ne-variety-enrichment"
PROD=ROOT/"backend/src/data/product-master"
OUT.mkdir(parents=True,exist_ok=True)

def norm(s):
    s=unicodedata.normalize("NFKC",str(s or "")).lower()
    s=re.sub(r"[^a-z0-9%+.-]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()

def sha(s):
    return hashlib.sha256(str(s).encode("utf-8")).hexdigest()

products=[]
with MASTER.open(encoding="utf-8") as f:
    for line in f:
        if line.strip(): products.append(json.loads(line))

aliases={}
raw_aliases={}
for p in products:
    vals=[p["identity"]["name"],*(p["identity"].get("historicalNames") or [])]
    raw_aliases[p["productId"]]=sorted({str(x).strip() for x in vals if str(x).strip()},key=len,reverse=True)
    aliases[p["productId"]]=sorted({norm(x) for x in vals if norm(x)},key=len,reverse=True)

STOP={"wild","rice","leaves","fruit","fruits","traditional","north","east","assam","nagaland","manipur","meghalaya","mizoram","tripura","sikkim","arunachal","product","herb","herbs","mixed","young","dried","fresh","processed"}
token_to_products=defaultdict(set)
for pid,names in aliases.items():
    for name in names:
        for tok in set(name.split()):
            if len(tok)>=4 and tok not in STOP:
                token_to_products[tok].add(pid)

# choose rare anchor tokens for efficient candidate lookup
anchors=defaultdict(set)
for pid,names in aliases.items():
    tokens=set()
    for name in names:
        tokens.update(t for t in name.split() if len(t)>=4 and t not in STOP)
    ranked=sorted(tokens,key=lambda t:(len(token_to_products[t]),-len(t),t))
    for t in ranked[:3]: anchors[t].add(pid)

evidence=defaultdict(list)
def decode_escaped_unicode(text):
    text=str(text or "")
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1),16)), text)

def context_for_product(text,pid,radius=110):
    raw=decode_escaped_unicode(text)
    for alias in raw_aliases.get(pid,[]):
        words=re.findall(r"[A-Za-z0-9]+",alias)
        if not words:
            continue
        pattern=r"\b"+r"[\s\W_]+".join(re.escape(w) for w in words)+r"\b"
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

# Source 1: authoritative prototype row for every product.
for p in products:
    add_evidence(
        p["productId"],
        "backend/src/data/product-master/ne-products.jsonl",
        "productId="+p["productId"],
        json.dumps({
            "name":p["identity"]["name"],
            "origin":p["identity"]["originLabel"],
            "category":p["identity"]["category"],
            "usp":p["positioning"]["uspPrototype"],
        },ensure_ascii=False),
        "canonical-prototype"
    )

# Source 2: latest NE HTML, line-addressable, but skip giant CATALOG_RAW row.
latest=NE/"afrera_platform_v44 (3).html"
if latest.exists():
    with latest.open(encoding="utf-8",errors="replace") as f:
        for line_no,line in enumerate(f,1):
            if "CATALOG_RAW=" in line: continue
            if len(line)>12000: continue
            add_matched_evidence("LOCAL.NE:"+latest.name,f"line:{line_no}",line.strip(),"ne-html")

# Source 3: concept sections.
concept_dir=ROOT/".audit/phase-program/concept-sections"
cm=json.loads((concept_dir/"manifest.json").read_text(encoding="utf-8"))
for sh in cm.get("shards",[]):
    with (concept_dir/sh["file"]).open(encoding="utf-8",errors="replace") as f:
        for line in f:
            if not line.strip(): continue
            rec=json.loads(line)
            text=" ".join([str(rec.get("heading","")),str(rec.get("text",""))])
            add_matched_evidence(
                rec.get("sourceId","UNKNOWN")+":"+rec.get("relativePath",""),
                "section:"+str(rec.get("sectionIndex","")),
                text,
                "concept-section"
            )

# Source 4: rich concept docs.
rich_dir=ROOT/".audit/phase-program/rich-concept-documents-complete"
rm=json.loads((rich_dir/"manifest.json").read_text(encoding="utf-8"))
for sh in rm.get("shards",[]):
    path=rich_dir/sh["file"]
    with path.open(encoding="utf-8",errors="replace") as f:
        for line in f:
            if not line.strip(): continue
            rec=json.loads(line)
            text=str(rec.get("text",""))
            if not text: continue
            locator="page:"+str(rec.get("page","")) if rec.get("page") else "record"
            add_matched_evidence(rec.get("sourceId","UNKNOWN")+":"+rec.get("relativePath",""),locator,text,"rich-document")

BINOMIAL_EXACT_RE=re.compile(r"^([A-Z][a-z]{2,})\s+([a-z][a-z-]{2,})(?:\s+(?:subsp\.|var\.)\s+[a-z-]+)?$")
BINOMIAL_START_RE=re.compile(r"^([A-Z][a-z]{2,})\s+([a-z][a-z-]{2,})(?=\s+[A-Z(]|$)")
BIO_TERMS={
 "curcumin":["curcumin"],"capsaicin":["capsaicin"],"anthocyanins":["anthocyanin","anthocyanins"],
 "oleoresin":["oleoresin"],"omega3":["omega-3","omega 3","ala omega"],"vitamin_c":["vitamin c"],
 "protein":["protein"],"fibre":["fibre","fiber"],"iron":["iron rich","iron-rich"],"calcium":["calcium"],
 "antioxidants":["antioxidant","antioxidants"],"essential_oil":["essential oil"],"citral":["citral"],
 "menthol":["menthol"],"polyphenols":["polyphenol","polyphenols"],"probiotic":["probiotic","probiotics"]
}
AGRONOMY_TERMS={
 "jhum":["jhum"],"deep_water":["deep-water","deep water"],"irrigated":["irrigated"],
 "high_altitude":["high-altitude","high altitude","mountain"],"hill":["hill cultivation","hill crop","hill rice"],
 "wetland":["wetland","aquatic"],"organic":["organic cultivation","organic-certified","organic certified"],
 "autumn":["autumn rice","autumn crop"],"winter":["winter rice","winter crop"],"climate_resilient":["climate resilient","climate-resilient"]
}
PROCESS_TERMS={
 "fermented":["fermented","fermentation","ferment"],"dried":["dried"],"powder":["powder"],
 "oil":["cold-pressed oil","essential oil","oil crop"],"beverage":["beverage","drink","squash"],
 "kombucha":["kombucha"],"pickle":["pickle"],"paste":["paste"],"chutney":["chutney"],
 "extract":["extract"],"milling":["milling"],"drying":["drying"],"grinding":["grinding"],
 "sterilising":["sterilising","sterilizing"],"packaging":["packaging"]
}
VALUE_TERMS={
 "export":["export","export potential"],"juice":["juice industry"],"perfume":["perfume industry"],
 "cosmetic":["cosmetic"],"nutraceutical":["nutraceutical"],"gourmet":["gourmet"],
 "processing":["processing fruit","processing-grade","processing"],"functional_food":["functional food"],
 "medicinal":["medicinal"],"table_food":["table honey","table food"]
}

def snippets(pid):
    return evidence.get(pid,[])

def evidence_is_unambiguous(pid, ev):
    if ev.get("kind") == "canonical-prototype":
        return True
    matches=set(match_products(ev.get("text","")))
    return matches == {pid}

def find_terms(pid, mapping):
    found=[]
    for field,terms in mapping.items():
        ev=[]
        for e in snippets(pid):
            if not evidence_is_unambiguous(pid,e):
                continue
            low=norm(e["text"])
            if any(norm(term) in low for term in terms):
                ev.append({"source":e["source"],"locator":e["locator"],"textSha256":e["textSha256"],"quote":e["text"][:240]})
        if ev:
            found.append({"trait":field,"evidenceStatus":"EXPLICIT_LOCAL_EVIDENCE","evidence":ev[:5]})
    return found

COMMON_LANGUAGE_GENUS_STOP={
    "Edible","Mountain","Seasonal","Traditional","Mixed","North","Eastern","Young","Fresh",
    "Dried","Processed","Indigenous","Forest","Hill","Indian","Local","Wild","Organic",
    "Greater","Lesser","Purple","Black","White","Red","Sweet","Large","Small","Bodo"
}
COMMON_LANGUAGE_EPITHET_STOP={
    "pod","pods","leaf","leaves","shoot","shoots","fruit","fruits","flower","flowers",
    "bud","buds","root","roots","rhizome","rhizomes","seed","seeds","cane","pith",
    "bean","beans","pepper","apple","berry","berries","turmeric","ginger","spinach",
    "tea","rice","millet","honey","bamboo","mushroom","mushrooms","local","wild",
    "traditional","edible","fresh","dried","processed","young","tender"
}
def scientific_from_name(name):
    for candidate in re.findall(r"\(([^)]+)\)",name):
        m=BINOMIAL_EXACT_RE.match(candidate.strip())
        if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP and m.group(2).lower() not in COMMON_LANGUAGE_EPITHET_STOP:
            return m.group(1)+" "+m.group(2), "EXPLICIT_BINOMIAL_IN_PARENTHESES"
    m=BINOMIAL_START_RE.match(name.strip())
    if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP and m.group(2).lower() not in COMMON_LANGUAGE_EPITHET_STOP:
        return m.group(1)+" "+m.group(2), "CANDIDATE_BINOMIAL_FROM_NAME_PREFIX"
    return None,None

def quantitative_bio(pid):
    out=[]
    patterns=[
        ("curcumin",re.compile(r"curcumin(?:\s+(?:content|level|potency))?\s*(?:[:=,;-]|is)?\s*([<>≥≤~]?\s*\d+(?:\.\d+)?\s*%)",re.I)),
        ("protein",re.compile(r"protein\s*[:=,;-]\s*([<>≥≤~]?\s*\d+(?:\.\d+)?\s*(?:g(?:/100g)?|%))",re.I)),
        ("fibre",re.compile(r"(?:fibre|fiber)\s*[:=,;-]\s*([<>≥≤~]?\s*\d+(?:\.\d+)?\s*(?:g(?:/100g)?|%))",re.I)),
        ("vitamin_c",re.compile(r"vitamin\s*c(?:\s+content)?\s*[:=,;-]?\s*([<>≥≤~]?\s*\d+(?:\.\d+)?\s*(?:mg(?:/100g)?|%))",re.I)),
    ]
    seen=set()
    for ev in snippets(pid):
        if not evidence_is_unambiguous(pid,ev):
            continue
        text=decode_escaped_unicode(ev["text"])
        for metric,pat in patterns:
            m=pat.search(text)
            if not m:
                continue
            value=re.sub(r"\s+","",m.group(1))
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

records=[]
stats=Counter()
for p in products:
    pid=p["productId"]
    name=p["identity"]["name"]
    sci_raw,sci_status=scientific_from_name(name)
    ev=snippets(pid)
    sci=sci_raw if sci_status=="EXPLICIT_BINOMIAL_IN_PARENTHESES" else None
    sci_candidate=sci_raw if sci_status=="CANDIDATE_BINOMIAL_FROM_NAME_PREFIX" else None

    tax={
        "scientificName":sci,
        "scientificNameStatus":sci_status if sci else "UNKNOWN",
        "scientificNameID":None,
        "genus":sci.split()[0] if sci else None,
        "specificEpithet":sci.split()[1] if sci else None,
        "taxonRank":"species" if sci else None,
        "scientificNameCandidate":sci_candidate,
        "candidateStatus":"PENDING_EXTERNAL_TAXONOMY_RESOLUTION" if sci_candidate else None,
        "candidateGenus":sci_candidate.split()[0] if sci_candidate else None,
        "candidateSpecificEpithet":sci_candidate.split()[1] if sci_candidate else None,
        "cultivarOrLandraceSignals":[],
        "standardsAlignment":"Darwin Core term names; scientificNameID remains unresolved until external taxonomy validation.",
    }
    name_low=norm(name+" "+p["positioning"]["uspPrototype"])
    for label,terms in {
        "cultivar":["cultivar"],"landrace":["landrace"],"traditional_variety":["traditional variety","traditional cultivar"],
        "wild_population":["wild population","wild ecotype"],"ecotype":["ecotype"]
    }.items():
        if any(norm(t) in name_low for t in terms):
            tax["cultivarOrLandraceSignals"].append({"type":label,"status":"EXPLICIT_PROTOTYPE_TEXT"})

    biochemical=find_terms(pid,BIO_TERMS)
    agronomy=find_terms(pid,AGRONOMY_TERMS)
    processing=find_terms(pid,PROCESS_TERMS)
    value=find_terms(pid,VALUE_TERMS)
    quantitative=quantitative_bio(pid)

    category=p["identity"]["category"]
    category_profile={
        "category":category,
        "status":"CATEGORY_DERIVED_CLASSIFICATION",
        "source":{"source":"backend/src/data/product-master/ne-products.jsonl","locator":"productId="+pid}
    }

    rec={
        "productId":pid,
        "taxonomy":tax,
        "geography":{
            "originLabel":p["identity"]["originLabel"],
            "status":"EXPLICIT_PROTOTYPE_FIELD",
        },
        "gi":{
            "prototypeClaim":p["gi"]["prototypeClaim"],
            "verificationStatus":"UNVERIFIED_PENDING_PHASE_047",
        },
        "biochemicalTraits":biochemical,
        "quantitativeBiochemicalClaims":quantitative,
        "agronomyTraits":agronomy,
        "processingTraits":processing,
        "valueChainTraits":value,
        "categoryProfile":category_profile,
        "evidenceSummary":{
            "count":len(ev),
            "sourceKinds":dict(Counter(x["kind"] for x in ev)),
            "sources":sorted({x["source"] for x in ev})[:50],
        },
        "fieldTruth":{
            "taxonomy":"LOCAL_EVIDENCE_ONLY" if sci else ("CANDIDATE_UNRESOLVED" if sci_candidate else "UNKNOWN"),
            "biochemical":"LOCAL_EVIDENCE_ONLY" if biochemical or quantitative else "UNKNOWN",
            "agronomy":"LOCAL_EVIDENCE_ONLY" if agronomy else "UNKNOWN",
            "processing":"LOCAL_EVIDENCE_ONLY" if processing else "UNKNOWN",
            "valueChain":"LOCAL_EVIDENCE_ONLY" if value else "UNKNOWN",
            "gi":"UNVERIFIED_PENDING_PHASE_047",
        },
    }
    records.append(rec)
    if sci: stats["scientificNameExplicit"]+=1
    if sci_candidate: stats["scientificNameCandidates"]+=1
    if biochemical: stats["biochemicalEnriched"]+=1
    if quantitative: stats["quantitativeBiochemicalClaims"]+=1
    if agronomy: stats["agronomyEnriched"]+=1
    if processing: stats["processingEnriched"]+=1
    if value: stats["valueChainEnriched"]+=1
    if len(ev)>1: stats["productsWithAdditionalLocalEvidence"]+=1

enrich_file=OUT/"enrichment.jsonl"
with enrich_file.open("w",encoding="utf-8") as f:
    for r in records:
        f.write(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n")

ev_file=OUT/"evidence.jsonl"
with ev_file.open("w",encoding="utf-8") as f:
    for p in products:
        pid=p["productId"]
        for e in evidence.get(pid,[]):
            f.write(json.dumps({"productId":pid,**e},ensure_ascii=False,separators=(",",":"))+"\n")

prod_file=PROD/"ne-variety-enrichment.jsonl"
prod_file.write_text(enrich_file.read_text(encoding="utf-8"),encoding="utf-8")

manifest={
    "schemaVersion":1,
    "productCount":len(records),
    "stats":dict(stats),
    "evidenceRecords":sum(len(v) for v in evidence.values()),
    "sources":[
        "canonical 1171 product master",
        latest.name if latest.exists() else None,
        ".audit/phase-program/concept-sections/*.jsonl",
        ".audit/phase-program/rich-concept-documents-complete/*.jsonl"
    ],
    "standardsAlignment":{
        "taxonomy":"Darwin Core field vocabulary for scientificName, genus, specificEpithet and taxonRank; no external scientificNameID is invented.",
        "productMaster":"Stable master-data identity remains separate from transactional/current price evidence; no GTIN is invented."
    },
    "truthRules":[
        "Unknown fields remain null/UNKNOWN; absence is not filled by model guesswork.",
        "scientificName is populated only for an explicit parenthetical binomial in local evidence; Latin-looking name prefixes are retained separately as unresolved candidates.",
        "Quantitative biochemical values require an explicit local source snippet containing both the product match and reported value.",
        "GI remains unverified until Phase 047 authoritative validation.",
        "Extraction confidence/status does not equal scientific or legal verification.",
        "Category-derived classification is labelled as such and is not evidence of cold-chain, regulatory or agronomic requirements."
    ],
    "productionFile":"backend/src/data/product-master/ne-variety-enrichment.jsonl",
    "productionSha256":hashlib.sha256(prod_file.read_bytes()).hexdigest(),
    "auditFiles":{"enrichment":"enrichment.jsonl","evidence":"evidence.jsonl"}
}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
(PROD/"ne-variety-enrichment.manifest.json").write_text(json.dumps({
    "schemaVersion":1,"productCount":len(records),"dataFileSha256":manifest["productionSha256"],
    "generatedBy":"tools/build_ne_variety_enrichment.py","truthRules":manifest["truthRules"]
},indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,"productCount":len(records),"stats":dict(stats),"evidenceRecords":manifest["evidenceRecords"],"enrichmentBytes":enrich_file.stat().st_size,"evidenceBytes":ev_file.stat().st_size}))
