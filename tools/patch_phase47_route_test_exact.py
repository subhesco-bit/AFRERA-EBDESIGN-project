from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\tests\neProductMasterRoutes.test.js')
t=p.read_text(encoding='utf-8')
old="    expect(res.body.data.results[0].gi.registryId).toBe('109');"
new="    const naga = res.body.data.results.find((p) => p.identity.name === 'Naga Mircha');\n    expect(naga).toBeDefined();\n    expect(naga.gi.registryId).toBe('109');"
if old not in t: raise RuntimeError('test anchor missing')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
print('phase47 route assertion made exact-name safe')