# Organic Certification + Deep Microbiome AI + International Gap Fill

## Organic schemes
| Scheme | Role |
|--------|------|
| **NPOP** | India Organic logo; third-party CB; export backbone; 2y annual / 3y perennial conversion |
| **PGS-India** | Peer group; domestic; PGS Green / Organic |
| **FSSAI** | Organic claims need NPOP or PGS + licence |
| **EU Organic** | Export target — verify APEDA equivalence circulars |
| **USDA NOP** | US — separate pathway |
| **JAS** | Japan |

`POST /api/v1/agro-farming/organic/certification`

## Deep microbiome AI
Functional guilds: N-fixers, PSB, AMF, biocontrol, decomposers, pathogen load, N-cycle  
Indices: fertility · disease suppression · carbon biology  
Modes: **lab DNA summary** (high confidence) or **field proxies** (OC/pH/mode)  
Multi-lens: scientific · analytics · generative · agronomic decision  

`POST /api/v1/agro-farming/microbiome/interpret`

## Multi-AI (same standard as health module)
`POST /api/v1/agro-farming/multi-ai/analyze`

## International peers studied
BeCrop, Trace/Miraterra, EarthOptics, Elaniti, Soilytix, FA Bio, spectral phone soils, India NPOP/PGS apps  
`GET /api/v1/agro-farming/gaps/international`

Certificates are issued only by accredited CBs / PGS authorities — never by this API.
