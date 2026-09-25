from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_ne_gi_provenance.py')
t=p.read_text(encoding='utf-8')
anchor='    "keradapini bodo traditional plant":"Bodo Keradapini",'
if anchor not in t: raise RuntimeError('alias anchor missing')
if '"karbi anglong ginger":"Assam Karbi Anglong Ginger"' not in t:
    t=t.replace(anchor, anchor+'\n    "karbi anglong ginger":"Assam Karbi Anglong Ginger",',1)
p.write_text(t,encoding='utf-8')
print('GI alias normalization patched')