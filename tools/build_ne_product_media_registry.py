import json,re,hashlib
from pathlib import Path

ROOT=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
NE=Path(r"C:\Users\DIYA GOEL\Desktop\ne")
IMG_DIR=ROOT/".audit/phase-program/product-image-intelligence"
ASSETS=IMG_DIR/"assets.jsonl"
HTML=NE/"NE Harvest OS v9 (3).html"
MASTER=ROOT/"backend/src/data/product-master/ne-products.jsonl"
PROD=ROOT/"backend/src/data/product-master"
OUT=IMG_DIR/"ne-product-media-registry.json"

assets=[json.loads(x) for x in ASSETS.open(encoding="utf-8") if x.strip()]
ne_assets=[r for r in assets if r["sourceId"]=="LOCAL.NE" and r["scope"]=="active-like"]
by_base={Path(r["relativePath"]).name:r for r in ne_assets}
products=[json.loads(x) for x in MASTER.open(encoding="utf-8") if x.strip()]
by_pid={p["productId"]:p for p in products}
text=HTML.read_text(encoding="utf-8",errors="replace")

pairs=re.findall(r"(?m)^\s*([A-Za-z0-9_-]+)\s*:\s*'uploads/([^']+)'",text)

# Explicit reconciliation rules based on prototype key/name and canonical master review.
canonical_rules={
 "kajinemu":("NEP-83E219230051A9BB","high","Prototype Kaji Nemu (Assam Lemon) aligns to canonical Kaji Nemu, Assam."),
 "memangnarang":("NEP-A43C36F6573801B5","high","Exact canonical name match."),
 "memangnarang2":("NEP-A43C36F6573801B5","high","Variant photo for exact canonical Memang Narang."),
 "memangnarang3":("NEP-A43C36F6573801B5","high","Variant photo for exact canonical Memang Narang."),
 "mizochilli":("NEP-0FBC52C8838D63B0","high","Prototype Mizo Chilli (Hmarchah) aligns to canonical Mizo Chilli, Mizoram."),
 "cardamom":("NEP-F93B93B130FBD256","high","Prototype Sikkim Large Cardamom aligns to canonical Large Cardamom, Sikkim."),
 "queenpineapple":("NEP-A8C9B1D3E822B05E","high","Exact canonical Queen Pineapple, Tripura."),
 "hilltomato":("NEP-750EADFA27358843","medium","Prototype Naga Hill Tomato aligns semantically/origin-wise to canonical Naga Tree Tomato."),
 "bhut":("NEP-7557C425FA78C1A4","medium","Prototype Bhut Jolokia photo candidate; canonical record is Assam-grown and GI claim remains separately governed."),
 "litchi":("NEP-D284AB46044A415C","medium","Prototype Assam Premium Lychee is a candidate for canonical Tezpur Litchi; exact cultivar/source not proven."),
 "hillcucumber":("NEP-046821AC27415984","medium","Prototype NE Hill Cucumber is a candidate for canonical Sweet Cucumber, Nagaland; exact variety not proven."),
 "sikkimginger":(None,"prototype-only","No Sikkim ginger identity exists in the canonical 1,171 master; do not substitute Karbi Anglong Ginger."),
 "khawtai":(None,"prototype-only","Khaw Tai/Khamti Rice is not present in the canonical 1,171 master; preserve as prototype-only identity."),
 "nefeast":(None,"story-only","Traditional NE feast story image; not a product image."),
}
proto_names={
 "kajinemu":"Kaji Nemu (Assam Lemon)",
 "memangnarang":"Memang Narang",
 "memangnarang2":"Memang Narang",
 "memangnarang3":"Memang Narang",
 "sikkimginger":"Sikkim Organic Ginger",
 "mizochilli":"Mizo Chilli (Hmarchah)",
 "cardamom":"Sikkim Large Cardamom",
 "bhut":"Bhut Jolokia",
 "queenpineapple":"Queen Pineapple",
 "hilltomato":"Naga Hill Tomato",
 "litchi":"Assam Premium Lychee",
 "hillcucumber":"NE Hill Cucumber",
 "khawtai":"Khaw Tai (Khamti Rice)",
 "nefeast":"Traditional NE India Feast",
}

def resolve_original(filename):
    exact=by_base.get(filename)
    if exact:return exact
    stem=Path(filename).stem
    prefix=re.sub(r"-[a-f0-9]{8}$","",stem,flags=re.I)
    candidates=[r for b,r in by_base.items() if Path(b).stem==prefix]
    return candidates[0] if len(candidates)==1 else None

mappings=[]
seen_sha=set()
for key,html_filename in pairs:
    asset=resolve_original(html_filename)
    if not asset: continue
    pid,confidence,reason=canonical_rules.get(key,(None,"unresolved","No reviewed canonical mapping rule."))
    product=None
    if pid and pid in by_pid:
        p=by_pid[pid]
        product={"productId":pid,"name":p["identity"]["name"],"origin":p["identity"]["originLabel"],"category":p["identity"]["category"]}
    mapping={
      "prototypeKey":key,
      "prototypeName":proto_names.get(key),
      "assetSha256":asset["sha256"],
      "relativePath":asset["relativePath"],
      "dimensions":{"width":asset.get("width"),"height":asset.get("height")},
      "prototypeEvidence":{"sourceFile":"NE Harvest OS v9 (3).html","mappingSource":"LOCAL_PHOTOS","htmlFilename":html_filename},
      "canonicalProduct":product,
      "mappingConfidence":confidence,
      "mappingReason":reason,
      "license":{"status":asset.get("licenseStatus","LICENSE_UNKNOWN"),"sourceClass":asset.get("sourceClass"),"productionCleared":False},
      "productionStatus":"BLOCKED_PENDING_LICENSE_AND_VISUAL_CONFIRMATION",
      "variantRole":"story" if key=="nefeast" else ("alternate" if key in {"memangnarang2","memangnarang3"} else "primary-candidate"),
    }
    mappings.append(mapping)
    seen_sha.add(asset["sha256"])

# Unassigned NE assets remain preserved as source evidence, never silently ignored.
unassigned=[]
for r in ne_assets:
    if r["sha256"] in seen_sha: continue
    unassigned.append({
      "assetSha256":r["sha256"],
      "relativePath":r["relativePath"],
      "dimensions":{"width":r.get("width"),"height":r.get("height")},
      "sourceClass":r.get("sourceClass"),
      "licenseStatus":r.get("licenseStatus"),
      "assignmentStatus":"UNRESOLVED_SOURCE_ASSET",
      "productionCleared":False,
    })

# Coverage backlog: no canonical product receives a production-cleared image in this phase.
mapped_pids=sorted({m["canonicalProduct"]["productId"] for m in mappings if m["canonicalProduct"]})
backlog=[]
for p in products:
    backlog.append({
      "productId":p["productId"],
      "name":p["identity"]["name"],
      "origin":p["identity"]["originLabel"],
      "category":p["identity"]["category"],
      "hasRecoveredCandidate":p["productId"] in mapped_pids,
      "productionMediaStatus":"NEEDS_LICENSED_OR_GENERATED_MEDIA",
      "requirements":["primary_product_image","origin_or_farm_context","processing_or_use_context"],
    })

license_policy={
 "checkedAt":"2026-09-25",
 "unsplash":{
   "generalTermsStatus":"CURRENT_GENERAL_LICENSE_REVIEWED",
   "sourceUrls":[
     "https://unsplash.com/terms",
     "https://help.unsplash.com/en/articles/2612315-can-i-use-unsplash-images-for-personal-or-commercial-projects",
     "https://help.unsplash.com/en/articles/2511315-guideline-attribution"
   ],
   "summary":"General Unsplash terms permit broad commercial/noncommercial use; API display has attribution/hotlink requirements; depicted trademarks/people/property may need separate rights. Filename alone does not prove a recovered file came from Unsplash.",
   "imageSpecificProvenanceVerified":False,
   "aiTrainingUse":"DO_NOT_USE_FOR_AI_TRAINING_OR_DATASET_WITHOUT_SEPARATE_RIGHTS_REVIEW"
 },
 "socialMedia":{
   "status":"LICENSE_UNKNOWN",
   "rule":"Do not publish social-handle sourced assets until rights holder/license evidence is obtained."
 }
}

registry={
 "schemaVersion":1,
 "sourcePrototype":"NE Harvest OS v9 (3).html",
 "mappingCount":len(mappings),
 "canonicalProductsWithRecoveredCandidates":len(mapped_pids),
 "productionClearedMappings":sum(1 for m in mappings if m["license"]["productionCleared"]),
 "unassignedAssetCount":len(unassigned),
 "mappings":mappings,
 "unassignedAssets":unassigned,
 "coverageBacklog":backlog,
 "licensePolicy":license_policy,
 "rules":[
   "Prototype LOCAL_PHOTOS links establish intended semantic use, not copyright/license clearance.",
   "Canonical product mapping confidence is independent from media license status.",
   "No recovered NE image is production-cleared in Phase 046 unless explicit rights evidence exists.",
   "Weak fuzzy product matches are never substituted for missing canonical identities.",
   "Exact duplicates are represented by SHA-256 identity and variants are metadata, not copied binaries.",
   "Unknown/social-source assets remain preserved and blocked from public production use."
 ]
}
OUT.write_text(json.dumps(registry,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

prod=PROD/"ne-product-media.json"
prod.write_text(json.dumps({
 "schemaVersion":1,
 "mappingCount":len(mappings),
 "canonicalProductsWithRecoveredCandidates":len(mapped_pids),
 "productionClearedMappings":0,
 "mappings":mappings,
 "coverageBacklog":backlog,
 "rules":registry["rules"]
},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
manifest={
 "schemaVersion":1,
 "dataFile":"backend/src/data/product-master/ne-product-media.json",
 "mappingCount":len(mappings),
 "canonicalProductsWithRecoveredCandidates":len(mapped_pids),
 "unassignedAssetCount":len(unassigned),
 "productionClearedMappings":0,
 "dataFileSha256":hashlib.sha256(prod.read_bytes()).hexdigest(),
 "generatedBy":"tools/build_ne_product_media_registry.py",
 "truthRules":registry["rules"],
}
(PROD/"ne-product-media.manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
(IMG_DIR/"media-registry-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,"mappingCount":len(mappings),"canonicalProductsWithRecoveredCandidates":len(mapped_pids),"unassignedAssetCount":len(unassigned),"productionClearedMappings":0,"backlogProducts":len(backlog),"bytes":prod.stat().st_size}))
