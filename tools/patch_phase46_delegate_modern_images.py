from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\legacy\productMediaAIService.js')
t=p.read_text(encoding='utf-8')
old="""module.exports = {
  listImageProviders,
  callImageProvider,
  requestProductImageGeneration,
  requestProductCartoonGeneration,
  listVideoProviders,
  callVideoProvider,
  buildNutrientComparisonScript,
  requestProductVideoGeneration,
};
"""
new="""const modernImageGeneration = require('../media/productImageGenerationService');

module.exports = {
  listImageProviders: () => modernImageGeneration.listProviders(),
  callImageProvider: (...args) => modernImageGeneration.callProvider(...args),
  requestProductImageGeneration: (...args) => modernImageGeneration.requestProductImageGeneration(...args),
  requestProductCartoonGeneration: (...args) => modernImageGeneration.requestProductCartoonGeneration(...args),
  listVideoProviders,
  callVideoProvider,
  buildNutrientComparisonScript,
  requestProductVideoGeneration,
};
"""
if old not in t: raise RuntimeError('legacy export block missing')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
print('legacy media exports delegated to modern image service')