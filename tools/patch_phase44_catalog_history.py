from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\extract_ne_product_master.py")
t=p.read_text(encoding="utf-8")
anchor="""products = []
quality = Counter()
for idx, row in enumerate(rows):
"""
insert="""# Preserve materially different rows from every distinct complete catalog hash.
historical_catalogs = []
for catalog_hash, members in hash_groups.items():
    representative = sorted(members, key=rank, reverse=True)[0]
    rep_path = Path(representative["file"])
    rep_rows = json.loads(extract_json_array(rep_path.read_text(encoding="utf-8", errors="replace")))
    historical_catalogs.append({
        "catalogSha256": catalog_hash,
        "sourceFile": representative["relativeToNe"],
        "rows": rep_rows,
    })

products = []
quality = Counter()
historical_variant_records = 0
for idx, row in enumerate(rows):
"""
if anchor not in t:
    raise RuntimeError("products anchor missing")
t=t.replace(anchor,insert,1)

anchor2="""    products.append({
        "productId": product_id,
        "sourceIndex": idx,
        "identity": {
            "name": str(name).strip(),
            "originLabel": str(origin).strip(),
            "category": str(category).strip(),
            "naturalKeySha256": stable_hash,
        },
        "gi": {
            "prototypeClaim": bool(gi_claim),
            "verificationStatus": "UNVERIFIED_PENDING_PHASE_047",
            "registryId": None,
            "authoritativeEvidence": [],
        },
"""
replacement2="""    historical_versions = []
    historical_names = []
    gi_claim_history = []
    for catalog in historical_catalogs:
        prior = catalog["rows"][idx]
        if prior != row:
            historical_variant_records += 1
            historical_versions.append({
                "catalogSha256": catalog["catalogSha256"],
                "sourceFile": catalog["sourceFile"],
                "rawRow": prior,
                "comparisonBasis": "same source index across equal-length 1171-row catalogs",
            })
            if str(prior[0]).strip() != str(name).strip():
                historical_names.append(str(prior[0]).strip())
            if bool(prior[3]) != bool(gi_claim):
                gi_claim_history.append({
                    "prototypeClaim": bool(prior[3]),
                    "nameAtTime": str(prior[0]).strip(),
                    "sourceFile": catalog["sourceFile"],
                    "catalogSha256": catalog["catalogSha256"],
                })

    products.append({
        "productId": product_id,
        "sourceIndex": idx,
        "identity": {
            "name": str(name).strip(),
            "historicalNames": sorted(set(historical_names)),
            "originLabel": str(origin).strip(),
            "category": str(category).strip(),
            "naturalKeySha256": stable_hash,
        },
        "gi": {
            "prototypeClaim": bool(gi_claim),
            "prototypeClaimHistory": gi_claim_history,
            "verificationStatus": "UNVERIFIED_PENDING_PHASE_047",
            "registryId": None,
            "authoritativeEvidence": [],
        },
"""
if anchor2 not in t:
    raise RuntimeError("product append anchor missing")
t=t.replace(anchor2,replacement2,1)

anchor3="""            "rawRow": row,
        },
"""
replacement3="""            "rawRow": row,
            "historicalPrototypeVersions": historical_versions,
        },
"""
if anchor3 not in t:
    raise RuntimeError("provenance raw anchor missing")
t=t.replace(anchor3,replacement3,1)

anchor4='''    "giPrototypeClaimCount": gi_claims,
    "duplicateNaturalKeyCount": len(duplicate_natural_keys),
'''
replacement4='''    "giPrototypeClaimCount": gi_claims,
    "historicalVariantRecordCount": historical_variant_records,
    "distinctCatalogHashCount": len(hash_groups),
    "duplicateNaturalKeyCount": len(duplicate_natural_keys),
'''
if anchor4 not in t:
    raise RuntimeError("manifest history anchor missing")
t=t.replace(anchor4,replacement4,1)
p.write_text(t,encoding="utf-8")
print("phase44 historical catalog provenance patched")
