from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\controllers\productMediaAIController.js")
t=p.read_text(encoding="utf-8")
if "productMediaRegistryService" not in t:
    t=t.replace(
        "const productMediaAIService = require('../services/legacy/productMediaAIService');",
        "const productMediaAIService = require('../services/legacy/productMediaAIService');\nconst productMediaRegistryService = require('../services/catalog/productMediaRegistryService');"
    )
anchor="const productMediaAIController = {\n"
if "getMediaRegistryStatus" not in t:
    block="""const productMediaAIController = {
  getMediaRegistryStatus: async (req, res) => {
    try {
      res.json({ success: true, data: productMediaRegistryService.status() });
    } catch (error) {
      logger.error('Error getting product media registry status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getProductMediaCandidates: async (req, res) => {
    try {
      const productId = req.params.productId;
      const candidates = productMediaRegistryService.getCandidates(productId);
      res.json({
        success: true,
        productId,
        productionEligible: productMediaRegistryService.hasProductionMedia(productId),
        candidates,
        truthStatus: 'RECOVERED_CANDIDATES_REQUIRE_LICENSE_AND_PROVENANCE_CLEARANCE',
      });
    } catch (error) {
      logger.error('Error getting product media candidates', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getMediaCoverage: async (req, res) => {
    try {
      res.json({ success: true, data: productMediaRegistryService.coverage() });
    } catch (error) {
      logger.error('Error getting product media coverage', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

"""
    if anchor not in t: raise RuntimeError("controller object anchor missing")
    t=t.replace(anchor,block,1)
p.write_text(t,encoding="utf-8")
print("product media registry controller methods added")
