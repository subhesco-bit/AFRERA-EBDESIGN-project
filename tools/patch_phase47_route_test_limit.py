from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\tests\neProductMasterRoutes.test.js')
t=p.read_text(encoding='utf-8')
old="/api/v1/catalog/ne-products/products?q=Naga%20Mircha&limit=1"
new="/api/v1/catalog/ne-products/products?q=Naga%20Mircha&limit=20"
if old not in t: raise RuntimeError('route test query anchor missing')
p.write_text(t.replace(old,new,1),encoding='utf-8')
print('phase47 route test limit corrected')