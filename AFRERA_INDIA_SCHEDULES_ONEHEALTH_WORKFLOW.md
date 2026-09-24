# India Drug Schedules + Veterinary One Health Operational Workflow

**Branch**: `consolidated/final`

## 1. India schedules (G / H / H1 / X)

| Schedule | Meaning | Rx | Separate register |
|----------|---------|----|--------------------|
| **G** | Medical supervision caution | Yes (supervised) | No |
| **H** | Prescription-only (main list) | Yes + Rx label | No |
| **H1** | Stricter (AMR, habit-forming, many 3rd/4th gen ceph, anti-TB, some FQ, pregabalin, etc.) | Yes | **Yes (~3 years)** |
| **X** | Highest control psychotropic/narcotic class | Yes + XRx | Yes (duplicate Rx practices) |

### How it operates (retail workflow)
1. Patient presents RMP prescription  
2. Pharmacist verifies  
3. Confirm schedule warning on pack  
4. If H1/X → register entry  
5. Dispense + counsel  
6. FDA inspection / D&C Act enforcement  

API: `GET/POST /api/v1/india-regulatory/drug-schedules*`

*Illustrative substance hints only — Gazette/CDSCO is authority.*

## 2. Veterinary One Health — process pipeline

```
S0 Signal → S1 Triage/Isolate → S2 PCICDA-oriented report
    → S3 Investigate → S4 Lab → S5 Notify/Control
    → S6 Human cross-notify → S7 Recovery
```

### Decision rules (engine)
- Notifiable + multi-animal → **Report + isolate**  
- Zoonotic + human exposure → **Cross-notify human health**  
- Lab confirmed notifiable → **Official control only**  
- Emergency urgency → **Field emergency vet**  
- Single metabolic → **Clinical vet path** (no outbreak apparatus)  

### Analysis → Interpretation → Interaction → Decision
`POST /api/v1/india-regulatory/onehealth/operate` runs the full pipeline (optional panel first).

Legal anchors: **PCICDA 2009** reporting duties; state AH / NADRS-style flow; IDSP/IHIP human side; WOAH via authority only.
