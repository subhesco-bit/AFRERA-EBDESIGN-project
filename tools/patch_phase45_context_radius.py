from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_ne_variety_enrichment.py")
t=p.read_text(encoding="utf-8")
t=t.replace("def context_for_product(text,pid,radius=240):","def context_for_product(text,pid,radius=110):")
old='''def scientific_from_name(name):
    for candidate in re.findall(r"\\(([^)]+)\\)",name):
        m=BINOMIAL_EXACT_RE.match(candidate.strip())
        if m:
            return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    m=BINOMIAL_START_RE.match(name.strip())
    if m:
        return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    return None,None
'''
new='''COMMON_LANGUAGE_GENUS_STOP={
    "Edible","Mountain","Seasonal","Traditional","Mixed","North","Eastern","Young","Fresh",
    "Dried","Processed","Indigenous","Forest","Hill","Indian","Local","Wild","Organic",
    "Greater","Lesser","Purple","Black","White","Red","Sweet","Large","Small","Bodo"
}
def scientific_from_name(name):
    for candidate in re.findall(r"\\(([^)]+)\\)",name):
        m=BINOMIAL_EXACT_RE.match(candidate.strip())
        if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
            return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    m=BINOMIAL_START_RE.match(name.strip())
    if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
        return m.group(1)+" "+m.group(2), "PARSED_FROM_PRODUCT_NAME"
    return None,None
'''
if old not in t:
    raise RuntimeError("scientific function block missing")
t=t.replace(old,new,1)
p.write_text(t,encoding="utf-8")
print("phase45 evidence radius reduced and common-language taxonomy stoplist added")
