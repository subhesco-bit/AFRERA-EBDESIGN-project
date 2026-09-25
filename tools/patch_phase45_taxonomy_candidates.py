from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_ne_variety_enrichment.py")
t=p.read_text(encoding="utf-8")

old='''def scientific_from_name(name):
    for candidate in re.findall(r"\\(([^)]+)\\)",name):
        m=BINOMIAL_EXACT_RE.match(candidate.strip())
        if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
            return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    m=BINOMIAL_START_RE.match(name.strip())
    if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
        return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    return None,None
'''
new='''def scientific_from_name(name):
    for candidate in re.findall(r"\\(([^)]+)\\)",name):
        m=BINOMIAL_EXACT_RE.match(candidate.strip())
        if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
            return m.group(1)+" "+m.group(2), "EXPLICIT_BINOMIAL_IN_PARENTHESES"
    m=BINOMIAL_START_RE.match(name.strip())
    if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
        return m.group(1)+" "+m.group(2), "CANDIDATE_BINOMIAL_FROM_NAME_PREFIX"
    return None,None
'''
if old not in t: raise RuntimeError("scientific_from_name block missing")
t=t.replace(old,new,1)

old2='''    sci,sci_status=scientific_from_name(name)
    ev=snippets(pid)

    tax={
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
new2='''    sci_raw,sci_status=scientific_from_name(name)
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
'''
if old2 not in t: raise RuntimeError("taxonomy construction block missing")
t=t.replace(old2,new2,1)

old3='''            "taxonomy":"LOCAL_EVIDENCE_ONLY" if sci else "UNKNOWN",
'''
new3='''            "taxonomy":"LOCAL_EVIDENCE_ONLY" if sci else ("CANDIDATE_UNRESOLVED" if sci_candidate else "UNKNOWN"),
'''
if old3 not in t: raise RuntimeError("fieldTruth taxonomy anchor missing")
t=t.replace(old3,new3,1)

old4='''    if sci: stats["scientificNameParsed"]+=1
'''
new4='''    if sci: stats["scientificNameExplicit"]+=1
    if sci_candidate: stats["scientificNameCandidates"]+=1
'''
if old4 not in t: raise RuntimeError("taxonomy stats anchor missing")
t=t.replace(old4,new4,1)

t=t.replace(
    '"Scientific names are populated only when an explicit binomial is present in local product naming evidence.",',
    '"scientificName is populated only for an explicit parenthetical binomial in local evidence; Latin-looking name prefixes are retained separately as unresolved candidates.",'
)

p.write_text(t,encoding="utf-8")
print("phase45 taxonomy facts separated from unresolved name-prefix candidates")
