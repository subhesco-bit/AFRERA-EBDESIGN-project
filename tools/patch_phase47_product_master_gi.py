from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\catalog\neProductMasterService.js")
t=p.read_text(encoding="utf-8")
if "neGiProvenanceService" not in t:
    t=t.replace("const crypto = require('crypto');","const crypto = require('crypto');\nconst giProvenance = require('./neGiProvenanceService');",1)

t=t.replace(
"    this.manifest = null;\n  }",
"    this.manifest = null;\n    this.giProvenance = options.giProvenance || giProvenance;\n  }",
1)

old="""    return {
      productId: product.productId,
      identity: { ...product.identity },
      gi: {
        prototypeClaim: product.gi.prototypeClaim,
        verificationStatus: product.gi.verificationStatus,
        registryId: product.gi.registryId,
      },"""
new="""    const giLegal = this.giProvenance.getByProductId(product.productId);
    return {
      productId: product.productId,
      identity: { ...product.identity },
      gi: {
        prototypeClaim: product.gi.prototypeClaim,
        sourceVerificationStatus: product.gi.verificationStatus,
        verificationStatus: giLegal ? giLegal.verificationStatus : product.gi.verificationStatus,
        verificationOutcome: giLegal ? giLegal.verificationOutcome : null,
        registeredAsListedGood: giLegal ? giLegal.registeredAsListedGood : false,
        registryId: giLegal?.officialEvidence?.applicationNumberRaw || product.gi.registryId || null,
        officialEvidence: giLegal?.officialEvidence || null,
        notes: giLegal?.notes || [],
        sourceSnapshot: giLegal?.sourceSnapshot || null,
      },"""
if old not in t: raise RuntimeError("public gi block missing")
t=t.replace(old,new,1)

old2="""  _privilegedView(product) {
    return product ? JSON.parse(JSON.stringify(product)) : null;
  }"""
new2="""  _privilegedView(product) {
    if (!product) return null;
    const out = JSON.parse(JSON.stringify(product));
    const giLegal = this.giProvenance.getByProductId(product.productId);
    out.gi = {
      ...out.gi,
      sourceVerificationStatus: out.gi.verificationStatus,
      verificationStatus: giLegal ? giLegal.verificationStatus : out.gi.verificationStatus,
      verificationOutcome: giLegal ? giLegal.verificationOutcome : null,
      registeredAsListedGood: giLegal ? giLegal.registeredAsListedGood : false,
      registryId: giLegal?.officialEvidence?.applicationNumberRaw || out.gi.registryId || null,
      officialEvidence: giLegal?.officialEvidence || null,
      notes: giLegal?.notes || [],
      sourceSnapshot: giLegal?.sourceSnapshot || null,
    };
    return out;
  }"""
if old2 not in t: raise RuntimeError("privileged block missing")
t=t.replace(old2,new2,1)

old3="""    const giClaim = options.giClaim == null ? null : Boolean(options.giClaim);
    const limit = clampLimit(options.limit);"""
new3="""    const giClaim = options.giClaim == null ? null : Boolean(options.giClaim);
    const giRegistered = options.giRegistered == null ? null : Boolean(options.giRegistered);
    const limit = clampLimit(options.limit);"""
if old3 not in t: raise RuntimeError("search gi claim block missing")
t=t.replace(old3,new3,1)

old4="""      if (origin && normalize(product.identity.originLabel) !== origin) return false;
      if (giClaim != null && Boolean(product.gi.prototypeClaim) !== giClaim) return false;
      if (!q) return true;"""
new4="""      if (origin && normalize(product.identity.originLabel) !== origin) return false;
      if (giClaim != null && Boolean(product.gi.prototypeClaim) !== giClaim) return false;
      if (giRegistered != null) {
        const giLegal = this.giProvenance.getByProductId(product.productId);
        if (Boolean(giLegal?.registeredAsListedGood) !== giRegistered) return false;
      }
      if (!q) return true;"""
if old4 not in t: raise RuntimeError("search filter block missing")
t=t.replace(old4,new4,1)

old5="""      giPrototypeClaimCount: giPrototypeClaims,
      qualityFlaggedCount: qualityFlagged,"""
new5="""      giPrototypeClaimCount: giPrototypeClaims,
      giRegisteredDirectCount: this.giProvenance.stats().registeredDirectCount,
      giPrototypeFalseNegativeDirectCount: this.giProvenance.stats().prototypeFalseNegativeDirectCount,
      qualityFlaggedCount: qualityFlagged,"""
if old5 not in t: raise RuntimeError("stats block missing")
t=t.replace(old5,new5,1)

p.write_text(t,encoding="utf-8")
print("product master GI provenance integrated")
