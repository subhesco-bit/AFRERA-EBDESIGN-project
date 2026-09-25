import json
from pathlib import Path

NE=Path(r"C:\Users\DIYA GOEL\Desktop\ne")
def extract(path):
    text=path.read_text(encoding='utf-8',errors='replace')
    marker='window.CATALOG_RAW='
    pos=text.find(marker); start=text.find('[',pos+len(marker))
    depth=0; ins=False; esc=False
    for i in range(start,len(text)):
        ch=text[i]
        if ins:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch=='"': ins=False
            continue
        if ch=='"': ins=True
        elif ch=='[': depth+=1
        elif ch==']':
            depth-=1
            if depth==0: return json.loads(text[start:i+1])
old=extract(NE/'afrera_platform_v40.html')
new=extract(NE/'afrera_platform_v44 (3).html')
by_old={(r[0],r[1],r[2]):r for r in old}
by_new={(r[0],r[1],r[2]):r for r in new}
added=[r for k,r in by_new.items() if k not in by_old]
removed=[r for k,r in by_old.items() if k not in by_new]
changed=[]
for k in sorted(set(by_old)&set(by_new)):
    if by_old[k]!=by_new[k]:
        changed.append({"key":k,"old":by_old[k],"new":by_new[k]})
print(json.dumps({"added":added,"removed":removed,"changed":changed},ensure_ascii=False))
