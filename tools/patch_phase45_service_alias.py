from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\catalog\neVarietyEnrichmentService.js')
t=p.read_text(encoding='utf-8')
anchor="  get(productId){\n    this.ensureLoaded();\n    const row=this.byProductId.get(String(productId));\n    return row?JSON.parse(JSON.stringify(row)):null;\n  }\n"
if anchor not in t: raise RuntimeError('get block missing')
rep=anchor+"\n  getByProductId(productId){ return this.get(productId); }\n"
t=t.replace(anchor,rep,1)
p.write_text(t,encoding='utf-8')
print('compatibility alias added')