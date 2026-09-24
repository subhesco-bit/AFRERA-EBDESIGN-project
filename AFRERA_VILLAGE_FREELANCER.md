# Village Freelancer Platform

**Layer:** Farmer / rural economy (not urban marketplace clone)  
**Standard:** Production decision-support + full job FSM + escrow pay + trust

## Concept

Rural skilled & seasonal labour marketplace: farm work, machinery operators, cold-store helpers, solar installers, digital mitras, etc. Matched by **skill + village geography + trust + KYC**, paid via **escrow**.

## Job FSM

```
draft → published → matched → accepted → in_progress → submitted
                                              ↓
                                    approved → paid → closed
                                         ↘ disputed
```

## Matching algorithm

`score = skill(40) + geo(25) + trust(20) + rating(10) + kyc(5)`

Radius default 40 km (Haversine).

## Skills taxonomy (16+)

Farm labour · tractor/harvester · spraying · irrigation · dairy · vet aide · cold store · packing · transport · construction · electrician · solar · village accounting · digital mitra · training facilitator

## Integrated

| System | Role |
|--------|------|
| Escrow policy | Hold budget on assign; release on approve |
| Wallet | Fallback pay path |
| Trust | Identity + completion + quality |
| Issues | Dispute tickets |
| Events | worker_registered, job_published, assigned, completed |

## API

```text
/api/v1/village-freelancer
/api/v1/afrera/village-freelancer

GET  /skills
POST /workers
GET  /workers?skill=tractor_operator&district=...
POST /jobs
POST /jobs/:id/publish
GET  /jobs/:id/match
POST /jobs/:id/apply | assign | start | submit | approve | dispute
POST /operate
```

## Example flow

```http
POST /workers
{ "name": "Ramesh", "village": "Kheda", "district": "Anand", "skills": ["tractor_operator"], "wage_rate_inr": 800, "lat": 22.5, "lng": 72.9, "kyc_level": "phone" }

POST /jobs
{ "skill": "tractor_operator", "employer_id": "F1", "budget_inr": 800, "days": 2, "lat": 22.51, "lng": 72.91, "village": "Kheda" }

POST /jobs/{id}/publish
GET  /jobs/{id}/match
POST /jobs/{id}/assign  { "worker_id": "VF-...", "auto_credit": true }
POST /jobs/{id}/start
POST /jobs/{id}/submit
POST /jobs/{id}/approve { "rating": 5 }
```
