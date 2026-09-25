import json, hashlib, re, unicodedata
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
NE = Path(r"C:\Users\DIYA GOEL\Desktop\ne")
OUT = ROOT / ".audit" / "phase-program" / "ne-product-master"
OUT.mkdir(parents=True, exist_ok=True)

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def extract_json_array(text: str, marker="window.CATALOG_RAW="):
    pos = text.find(marker)
    if pos < 0:
        return None
    start = text.find("[", pos + len(marker))
    if start < 0:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                raw = text[start:i+1]
                return raw
    return None

def version_info(name: str):
    m = re.search(r"afrera_platform_v(\d+)", name, re.I)
    if m:
        return ("afrera_platform", int(m.group(1)))
    m = re.search(r"ne[_ ]harvest.*?v(\d+)", name, re.I)
    if m:
        return ("ne_harvest", int(m.group(1)))
    return ("other", -1)

candidates = []
for file in NE.rglob("*"):
    if not file.is_file() or file.suffix.lower() not in {".html", ".htm"}:
        continue
    try:
        data = file.read_bytes()
        text = data.decode("utf-8", errors="replace")
    except Exception as e:
        candidates.append({"file": str(file), "status": "READ_ERROR", "error": str(e)})
        continue
    raw = extract_json_array(text)
    if raw is None:
        continue
    try:
        rows = json.loads(raw)
        status = "OK"
    except Exception as e:
        candidates.append({
            "file": str(file), "status": "PARSE_ERROR",
            "fileSha256": sha256_bytes(data), "error": str(e)
        })
        continue
    family, version = version_info(file.name)
    row_lengths = Counter(len(r) if isinstance(r, list) else -1 for r in rows)
    catalog_bytes = raw.encode("utf-8")
    exact7 = row_lengths.get(7, 0)
    gi_count = sum(1 for r in rows if isinstance(r, list) and len(r) >= 4 and bool(r[3]))
    categories = sorted({str(r[2]) for r in rows if isinstance(r, list) and len(r) >= 3})
    origins = sorted({str(r[1]) for r in rows if isinstance(r, list) and len(r) >= 2})
    candidates.append({
        "file": str(file),
        "relativeToNe": file.relative_to(NE).as_posix(),
        "status": status,
        "family": family,
        "version": version,
        "mtime": file.stat().st_mtime,
        "fileBytes": len(data),
        "fileSha256": sha256_bytes(data),
        "catalogCount": len(rows),
        "catalogSha256": sha256_bytes(catalog_bytes),
        "exactSevenFieldRows": exact7,
        "rowLengthDistribution": dict(sorted(row_lengths.items())),
        "giClaimCount": gi_count,
        "categoryCount": len(categories),
        "originCount": len(origins),
        "categories": categories,
        "origins": origins,
    })

valid1171 = [
    c for c in candidates
    if c.get("status") == "OK"
    and c.get("catalogCount") == 1171
    and c.get("exactSevenFieldRows") == 1171
]
if not valid1171:
    raise SystemExit("No complete 1171-row seven-field CATALOG_RAW source found")

hash_groups = defaultdict(list)
for c in valid1171:
    hash_groups[c["catalogSha256"]].append(c)

# Authority rule:
# 1) complete 1171 rows, all seven-field;
# 2) prefer afrera_platform lineage because it contains the explicit marketplace semantics;
# 3) highest internal version;
# 4) among same version/content family, newest mtime then lexical path.
def rank(c):
    family_rank = 2 if c["family"] == "afrera_platform" else 1 if c["family"] == "ne_harvest" else 0
    return (family_rank, c["version"], c["mtime"], c["relativeToNe"])

chosen = sorted(valid1171, key=rank, reverse=True)[0]
source_path = Path(chosen["file"])
source_text = source_path.read_text(encoding="utf-8", errors="replace")
source_raw = extract_json_array(source_text)
rows = json.loads(source_raw)

def norm(s):
    s = unicodedata.normalize("NFKC", str(s)).strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s

def natural_key(row):
    return "\0".join([norm(row[0]), norm(row[1]), norm(row[2])])

keys = Counter(natural_key(r) for r in rows)
duplicate_natural_keys = {k:v for k,v in keys.items() if v > 1}

# Preserve materially different rows from every distinct complete catalog hash.
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
    name, origin, category, gi_claim, retail, farmer_map, usp = row
    key = natural_key(row)
    stable_hash = hashlib.sha256(key.encode("utf-8")).hexdigest()
    product_id = "NEP-" + stable_hash[:16].upper()
    if keys[key] > 1:
        product_id += "-" + f"{idx+1:04d}"
        quality["duplicateNaturalKeyRecords"] += 1

    flags = []
    if not str(name).strip(): flags.append("MISSING_NAME")
    if not str(origin).strip(): flags.append("MISSING_ORIGIN")
    if not str(category).strip(): flags.append("MISSING_CATEGORY")
    if not isinstance(retail, (int, float)) or retail < 0: flags.append("INVALID_RETAIL_PRICE")
    if not isinstance(farmer_map, (int, float)) or farmer_map < 0: flags.append("INVALID_FARMER_MAP")
    if isinstance(retail, (int, float)) and isinstance(farmer_map, (int, float)) and farmer_map > retail:
        flags.append("FARMER_MAP_GT_RETAIL")
    if not str(usp).strip(): flags.append("MISSING_USP")
    if flags:
        quality["recordsWithQualityFlags"] += 1
        for flag in flags: quality[flag] += 1

    historical_versions = []
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
        "pricing": {
            "currency": "INR",
            "unit": "kg",
            "retailPricePrototype": {
                "amount": retail,
                "visibility": "public",
                "verificationStatus": "PROTOTYPE_VALUE_PENDING_PHASE_048",
            },
            "farmerMapFloorPrototype": {
                "amount": farmer_map,
                "visibility": "farmer_private",
                "verificationStatus": "PROTOTYPE_VALUE_PENDING_PHASE_048",
            },
        },
        "positioning": {
            "uspPrototype": str(usp).strip(),
            "verificationStatus": "PROTOTYPE_TEXT",
        },
        "provenance": {
            "sourceSystem": "NE_HTML_PROTOTYPE",
            "sourceFile": chosen["relativeToNe"],
            "sourceFileSha256": chosen["fileSha256"],
            "catalogSha256": chosen["catalogSha256"],
            "sourceFieldOrder": ["name","origin","category","giClaim","retailPrice","farmerMap","usp"],
            "rawRow": row,
            "historicalPrototypeVersions": historical_versions,
        },
        "lifecycle": {
            "status": "catalogued",
            "canonicalizedInPhase": "044",
            "enrichmentStatus": "PENDING_PHASE_045",
        },
        "qualityFlags": flags,
    })

categories = Counter(p["identity"]["category"] for p in products)
origins = Counter(p["identity"]["originLabel"] for p in products)
gi_claims = sum(1 for p in products if p["gi"]["prototypeClaim"])

# Write compact JSONL canonical master and review-friendly summary.
with (OUT/"products.jsonl").open("w", encoding="utf-8") as f:
    for p in products:
        f.write(json.dumps(p, ensure_ascii=False, separators=(",",":")) + "\n")

(OUT/"source-candidates.json").write_text(json.dumps(candidates, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
(OUT/"hash-families.json").write_text(json.dumps({
    h: [x["relativeToNe"] for x in sorted(v, key=rank, reverse=True)]
    for h,v in hash_groups.items()
}, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")

manifest = {
    "schemaVersion": 1,
    "productCount": len(products),
    "sourceCandidateCount": len(candidates),
    "complete1171CandidateCount": len(valid1171),
    "distinct1171CatalogHashes": len(hash_groups),
    "authoritativeSelection": chosen,
    "selectionRule": [
        "CATALOG_RAW must parse successfully.",
        "Exactly 1171 rows must be present.",
        "Every row must have the seven verified prototype fields.",
        "Prefer the afrera_platform lineage because it contains the explicit marketplace MAP/retail semantics.",
        "Then prefer the highest internal version; filename is only a tie-break after content/schema verification.",
        "No earlier/different hash family is deleted; all remain provenance evidence."
    ],
    "fieldSemantics": {
        "0": "name",
        "1": "origin/state label",
        "2": "category",
        "3": "prototype GI claim flag; NOT authoritative GI verification",
        "4": "prototype public retail INR/kg",
        "5": "prototype farmer-private MAP/floor INR/kg",
        "6": "prototype USP/description"
    },
    "categoryCounts": dict(sorted(categories.items())),
    "originCounts": dict(sorted(origins.items())),
    "giPrototypeClaimCount": gi_claims,
    "historicalVariantRecordCount": historical_variant_records,
    "distinctCatalogHashCount": len(hash_groups),
    "duplicateNaturalKeyCount": len(duplicate_natural_keys),
    "quality": dict(quality),
    "privacyRule": "Farmer MAP/floor price is private and must never be exposed to buyer-facing interfaces.",
    "truthRules": [
        "Prototype GI flags remain unverified until Phase 047 authoritative validation.",
        "Prototype prices remain non-current/non-authoritative until Phase 048 price intelligence.",
        "Product identity and raw source rows are preserved losslessly.",
        "No source HTML is modified or deleted by this phase."
    ],
    "artifacts": {
        "products": "products.jsonl",
        "sourceCandidates": "source-candidates.json",
        "hashFamilies": "hash-families.json"
    }
}
(OUT/"manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")

# Promote the canonical identity master into the production source tree.
PROD = ROOT / "backend" / "src" / "data" / "product-master"
PROD.mkdir(parents=True, exist_ok=True)
prod_products = PROD / "ne-products.jsonl"
prod_manifest = PROD / "ne-products.manifest.json"
prod_products.write_text((OUT/"products.jsonl").read_text(encoding="utf-8"), encoding="utf-8")
prod_manifest_payload = {
    "schemaVersion": manifest["schemaVersion"],
    "productCount": manifest["productCount"],
    "catalogSha256": manifest["authoritativeSelection"]["catalogSha256"],
    "sourceFileSha256": manifest["authoritativeSelection"]["fileSha256"],
    "sourceFile": manifest["authoritativeSelection"]["relativeToNe"],
    "distinctCatalogHashCount": manifest["distinctCatalogHashCount"],
    "historicalVariantRecordCount": manifest["historicalVariantRecordCount"],
    "privacyRule": manifest["privacyRule"],
    "truthRules": manifest["truthRules"],
    "generatedBy": "tools/extract_ne_product_master.py",
    "dataFileSha256": sha256_bytes(prod_products.read_bytes()),
}
prod_manifest.write_text(json.dumps(prod_manifest_payload, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")

print(json.dumps({
    "ok": True,
    "productCount": len(products),
    "candidateFiles": len(candidates),
    "complete1171Candidates": len(valid1171),
    "distinct1171Hashes": len(hash_groups),
    "authoritativeSource": chosen["relativeToNe"],
    "authoritativeVersion": chosen["version"],
    "giPrototypeClaims": gi_claims,
    "categories": len(categories),
    "origins": len(origins),
    "duplicateNaturalKeys": len(duplicate_natural_keys),
    "qualityFlags": dict(quality),
    "outputBytes": (OUT/"products.jsonl").stat().st_size
}))
