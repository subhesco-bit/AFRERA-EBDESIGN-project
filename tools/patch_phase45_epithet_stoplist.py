from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build_ne_variety_enrichment.py")
t=p.read_text(encoding="utf-8")
anchor='''COMMON_LANGUAGE_GENUS_STOP={
    "Edible","Mountain","Seasonal","Traditional","Mixed","North","Eastern","Young","Fresh",
    "Dried","Processed","Indigenous","Forest","Hill","Indian","Local","Wild","Organic",
    "Greater","Lesser","Purple","Black","White","Red","Sweet","Large","Small","Bodo"
}
'''
replacement='''COMMON_LANGUAGE_GENUS_STOP={
    "Edible","Mountain","Seasonal","Traditional","Mixed","North","Eastern","Young","Fresh",
    "Dried","Processed","Indigenous","Forest","Hill","Indian","Local","Wild","Organic",
    "Greater","Lesser","Purple","Black","White","Red","Sweet","Large","Small","Bodo"
}
COMMON_LANGUAGE_EPITHET_STOP={
    "pod","pods","leaf","leaves","shoot","shoots","fruit","fruits","flower","flowers",
    "bud","buds","root","roots","rhizome","rhizomes","seed","seeds","cane","pith",
    "bean","beans","pepper","apple","berry","berries","turmeric","ginger","spinach",
    "tea","rice","millet","honey","bamboo","mushroom","mushrooms","local","wild",
    "traditional","edible","fresh","dried","processed","young","tender"
}
'''
if anchor not in t: raise RuntimeError("genus stoplist anchor missing")
t=t.replace(anchor,replacement,1)
t=t.replace(
'''        if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
            return m.group(1)+" "+m.group(2), "EXPLICIT_BINOMIAL_IN_PARENTHESES"
''',
'''        if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP and m.group(2).lower() not in COMMON_LANGUAGE_EPITHET_STOP:
            return m.group(1)+" "+m.group(2), "EXPLICIT_BINOMIAL_IN_PARENTHESES"
''',
1)
t=t.replace(
'''    if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP:
        return m.group(1)+" "+m.group(2), "CANDIDATE_BINOMIAL_FROM_NAME_PREFIX"
''',
'''    if m and m.group(1) not in COMMON_LANGUAGE_GENUS_STOP and m.group(2).lower() not in COMMON_LANGUAGE_EPITHET_STOP:
        return m.group(1)+" "+m.group(2), "CANDIDATE_BINOMIAL_FROM_NAME_PREFIX"
''',
1)
p.write_text(t,encoding="utf-8")
print("phase45 common-language epithet stoplist added")
