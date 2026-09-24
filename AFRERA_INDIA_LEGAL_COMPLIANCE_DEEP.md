# Deep India Legal Compliance — Animal Health & One Health

## PCICDA 2009 reporting duties

**Act**: Prevention and Control of Infectious and Contagious Diseases in Animals Act, 2009 (Act 27 of 2009)

| Actor | Duty (theme) |
|-------|----------------|
| Owner / in-charge / panchayat | Report belief of scheduled disease to Village Officer |
| Village Officer | Visit jurisdiction; report to nearest Veterinarian |
| Veterinarian | Report to Veterinary Officer |
| State Director | Intimate neighbouring State Directors |

Control themes: segregation, infected areas, compulsory vaccination, movement restriction, quarantine posts, penalties.

## NADRS-style flow

VO functions: daily incidence → FIR on outbreak → escalate → follow-up.  
AFRERA prepares **drafts only** — does not file to NADRS.

## IDSP / IHIP cross-notify

When zoonotic or handler ill: parallel human DSO/clinician path with joint exposure fields.

## WOAH / WAHIS

**Platform never files.** Central/competent authority only.

## APIs

```http
GET  /api/v1/india-legal/pcicda/duties
GET  /api/v1/india-legal/nadrs/flow
GET  /api/v1/india-legal/idsp-ihip/cross-notify
GET  /api/v1/india-legal/woah/boundary
POST /api/v1/india-legal/dossier
POST /api/v1/india-legal/operate
POST /api/v1/india-regulatory/onehealth/operate   # includes full_legal_compliance
```

Not legal advice. Official statutes and circulars prevail.
