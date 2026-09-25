from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\evaluationHarness.js')
t=p.read_text(encoding='utf-8')
old="""  const perLabel={};
  let correct=0;
  for(const label of labels){
    let tp=0,fp=0,fn=0;
    for(const r of valid){
      const a=String(r.actual),p=String(r.predicted);
      if(a===p)correct++;
      if(a===label&&p===label)tp++;
"""
new="""  const perLabel={};
  const correct=valid.filter((r)=>String(r.actual)===String(r.predicted)).length;
  for(const label of labels){
    let tp=0,fp=0,fn=0;
    for(const r of valid){
      const a=String(r.actual),p=String(r.predicted);
      if(a===label&&p===label)tp++;
"""
if old not in t: raise RuntimeError('evaluation accuracy block missing')
p.write_text(t.replace(old,new,1),encoding='utf-8')
print('evaluation accuracy counting fixed')