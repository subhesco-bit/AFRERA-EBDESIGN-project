from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\extract_ne_product_master.py")
t=p.read_text(encoding="utf-8")
anchor='''(OUT/"manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+"\\n", encoding="utf-8")

print(json.dumps({
'''
insert='''(OUT/"manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+"\\n", encoding="utf-8")

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
prod_manifest.write_text(json.dumps(prod_manifest_payload, indent=2, ensure_ascii=False)+"\\n", encoding="utf-8")

print(json.dumps({
'''
if anchor not in t:
    raise RuntimeError("promotion anchor missing")
t=t.replace(anchor,insert,1)
p.write_text(t,encoding="utf-8")
print("phase44 production promotion patched")
