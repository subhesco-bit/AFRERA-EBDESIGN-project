from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\routes\productMediaAIRoutes.js")
t=p.read_text(encoding="utf-8")
anchor="router.get('/status', productMediaAIController.getProviderStatus);\n"
extra="""router.get('/status', productMediaAIController.getProviderStatus);
router.get('/registry/status', productMediaAIController.getMediaRegistryStatus);
router.get('/coverage', productMediaAIController.getMediaCoverage);
router.get('/products/:productId/media-candidates', productMediaAIController.getProductMediaCandidates);
"""
if "registry/status" not in t:
    if anchor not in t: raise RuntimeError("route status anchor missing")
    t=t.replace(anchor,extra,1)
p.write_text(t,encoding="utf-8")
print("product media registry routes added")
