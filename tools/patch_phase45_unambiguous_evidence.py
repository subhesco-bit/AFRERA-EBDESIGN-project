from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_ne_variety_enrichment.py")
t=p.read_text(encoding="utf-8")

anchor='''def snippets(pid):
    return evidence.get(pid,[])

def find_terms(pid, mapping):
'''
replacement='''def snippets(pid):
    return evidence.get(pid,[])

def evidence_is_unambiguous(pid, ev):
    if ev.get("kind") == "canonical-prototype":
        return True
    matches=set(match_products(ev.get("text","")))
    return matches == {pid}

def find_terms(pid, mapping):
'''
if anchor not in t: raise RuntimeError("snippets anchor missing")
t=t.replace(anchor,replacement,1)

old='''        for e in snippets(pid):
            low=norm(e["text"])
            if any(norm(term) in low for term in terms):
'''
new='''        for e in snippets(pid):
            if not evidence_is_unambiguous(pid,e):
                continue
            low=norm(e["text"])
            if any(norm(term) in low for term in terms):
'''
if old not in t: raise RuntimeError("find_terms loop missing")
t=t.replace(old,new,1)

old2='''    for ev in snippets(pid):
        text=decode_escaped_unicode(ev["text"])
        for metric,pat in patterns:
'''
new2='''    for ev in snippets(pid):
        if not evidence_is_unambiguous(pid,ev):
            continue
        text=decode_escaped_unicode(ev["text"])
        for metric,pat in patterns:
'''
if old2 not in t: raise RuntimeError("quant loop missing")
t=t.replace(old2,new2,1)

old3='''    tax={
        "scientificName":sci,
        "scientificNameStatus":sci_status if sci else "UNKNOWN",
        "genus":sci.split()[0] if sci else None,
        "species":sci.split()[1] if sci else None,
        "cultivarOrLandraceSignals":[],
    }
'''
new3='''    tax={
        "scientificName":sci,
        "scientificNameStatus":sci_status if sci else "UNKNOWN",
        "scientificNameID":None,
        "genus":sci.split()[0] if sci else None,
        "specificEpithet":sci.split()[1] if sci else None,
        "taxonRank":"species" if sci else None,
        "cultivarOrLandraceSignals":[],
        "standardsAlignment":"Darwin Core term names; identity not externally resolved in Phase 045",
    }
'''
if old3 not in t: raise RuntimeError("tax block missing")
t=t.replace(old3,new3,1)

anchor4='''    "truthRules":[
        "Unknown fields remain null/UNKNOWN; absence is not filled by model guesswork.",
'''
replacement4='''    "standardsAlignment":{
        "taxonomy":"Darwin Core field vocabulary for scientificName, genus, specificEpithet and taxonRank; no external scientificNameID is invented.",
        "productMaster":"Stable master-data identity remains separate from transactional/current price evidence; no GTIN is invented."
    },
    "truthRules":[
        "Unknown fields remain null/UNKNOWN; absence is not filled by model guesswork.",
'''
if anchor4 not in t: raise RuntimeError("manifest truth anchor missing")
t=t.replace(anchor4,replacement4,1)

p.write_text(t,encoding="utf-8")
print("phase45 ambiguous multi-product evidence filtered; taxonomy vocabulary aligned")
