# Full Species + Multi-AI Orchestra

**Branch**: `consolidated/final`

## Species (no livestock/pet blockers in panel)

cow · pig · goat · sheep · poultry · **duck** · **rabbit** · **dog** · **cat** · **fish**  
Aliases: buffalo→cow, chicken→poultry, puppy→dog, etc.

## Human

Asian BMI dual cutoffs · allergy · drug–food · full Rituraj stack

## Multi-AI modes (`POST /api/v1/multi-ai-health/analyze`)

| Mode | Role |
|------|------|
| clinical_decision | Urgency, escalation, safety gates |
| scientific_research | Differentials, evidence, labs |
| generative_nextgen | Scenarios, care-plan drafts, plain summary |
| ancient_wisdom | Ritu / ethnovet / ancestral — complementary only |
| systems_analytics | Herd risk, BMI, vax gaps |
| one_health | Zoonoses, farm-family, WOAH-style stages |

Also: `POST /api/v1/multi-ai-health/decide` for fast consensus.

Orchestration is **knowledge-grounded decision AI** (deterministic engines + multi-lens analysis). External generative LLMs can be attached at gateway; clinical safety floor remains licensed professionals.

## Readiness

`GET /api/v1/health-os/readiness` or `/api/v1/multi-ai-health/readiness`
