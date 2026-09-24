# Platform Enhancements — Algorithms · Workflows · Evaluation · Interaction

## Decision quality algorithms
- Weighted confidence fusion + disagreement detection
- Escalation scoring (urgency × notifiable × interactions × vision)
- Decision package evaluation grade A–D

`POST /api/v1/unified-intelligence/decision/evaluate`

## Workflow FSM
States: `intake → analyze → interpret → decide → communicate → act → feedback → closed`

## Inter-module bus
Events: notifiable, zoonotic, pharmacy interaction, PCICDA, unified decision, outcomes

`GET /api/v1/unified-intelligence/bus/events`

## Visualisation
Gauge, bar, radar, timeline, dual BMI markers — `viz_spec` for any frontend

## Audio / TTS
EN + HI narratives with rate/pause hints

## Enhanced operate (all together)
`POST /api/v1/unified-intelligence/operate/enhanced`

Returns: pillars + workflow + decision_quality + inter_module_events + interaction (viz + audio + cards)
