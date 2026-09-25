from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\catalog\neVarietyEnrichmentService.js")
t=p.read_text(encoding="utf-8")
if "const EVIDENCE_PERMISSION" not in t:
    t=t.replace(
        "const DEFAULT_MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.manifest.json');",
        "const DEFAULT_MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.manifest.json');\nconst EVIDENCE_PERMISSION = 'catalog.enrichment.evidence.read';"
    )
old="""  getById(productId, options = {}) {
    this.ensureLoaded();
    const record = this.byId.get(String(productId)) || null;
    if (!record) return null;
    return options.includeInternalEvidence === true ? JSON.parse(JSON.stringify(record)) : publicView(record);
  }
"""
new="""  getByProductId(productId, context = {}) {
    this.ensureLoaded();
    const record = this.byId.get(String(productId)) || null;
    if (!record) return null;
    const permissions = new Set((context.permissions || []).map(String));
    const includeInternalEvidence = context.includeInternalEvidence === true || permissions.has(EVIDENCE_PERMISSION);
    return includeInternalEvidence ? JSON.parse(JSON.stringify(record)) : publicView(record);
  }

  getById(productId, context = {}) {
    return this.getByProductId(productId, context);
  }
"""
if old not in t:
    raise RuntimeError("getById block missing")
t=t.replace(old,new,1)
t=t.replace(
"""      explicitScientificNames,
      unresolvedScientificNameCandidates,
""",
"""      scientificNameExplicit: explicitScientificNames,
      scientificNameCandidates: unresolvedScientificNameCandidates,
      explicitScientificNames,
      unresolvedScientificNameCandidates,
""",
1
)
if "module.exports.EVIDENCE_PERMISSION" not in t:
    t += "\nmodule.exports.EVIDENCE_PERMISSION = EVIDENCE_PERMISSION;\n"
p.write_text(t,encoding="utf-8")
print("phase45 enrichment compatibility and evidence permission added")
