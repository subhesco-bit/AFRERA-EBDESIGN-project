from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\tests\productMediaAIRoutes.test.js")
t=p.read_text(encoding="utf-8")
old="""jest.mock('../controllers/productMediaAIController', () => ({
  getProviderStatus: (_req, res) => res.json({ success: true, data: { imageProviders: [] } }),
  generateProductImage: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
  buildNutrientVideoScript: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
  generateProductVideo: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
}));
"""
new="""jest.mock('../controllers/productMediaAIController', () => ({
  getProviderStatus: (_req, res) => res.json({ success: true, data: { imageProviders: [] } }),
  getMediaRegistryStatus: (_req, res) => res.json({ success: true, data: { mappingCount: 14 } }),
  getMediaCoverage: (_req, res) => res.json({ success: true, data: { totalProducts: 1171, productionClearedProducts: 0 } }),
  getProductMediaCandidates: (req, res) => res.json({ success: true, productId: req.params.productId, candidates: [] }),
  generateProductImage: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
  buildNutrientVideoScript: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
  generateProductVideo: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
}));
"""
if old not in t: raise RuntimeError("controller mock block missing")
t=t.replace(old,new,1)
insert="""
  it('exposes governed recovered-media coverage', async () => {
    const response = await request(createApp()).get('/media/coverage');
    expect(response.status).toBe(200);
    expect(response.body.data.totalProducts).toBe(1171);
    expect(response.body.data.productionClearedProducts).toBe(0);
  });

  it('exposes product media candidates separately from generation', async () => {
    const response = await request(createApp()).get('/media/products/NEP-123/media-candidates');
    expect(response.status).toBe(200);
    expect(response.body.productId).toBe('NEP-123');
    expect(response.body.candidates).toEqual([]);
  });
"""
anchor="  it('delegates image generation with the product identifier', async () => {"
if insert.strip() not in t:
    if anchor not in t: raise RuntimeError("test insertion anchor missing")
    t=t.replace(anchor,insert+"\n"+anchor,1)
p.write_text(t,encoding="utf-8")
print("product media route tests extended")
