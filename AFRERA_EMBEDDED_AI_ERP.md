# Embedded AI + ERP (Three Modules)

## Embedded AI
- Model registry: vet symptom/vision, nutrition meal estimator, agro leaf disease, small LLM, shared embedder
- RAG packs per module
- Offline-first routing (`embedded_offline` | `hybrid`)
- Contract for ONNX / TFLite / GGUF edge runtimes

## ERP
| Module | Entities |
|--------|----------|
| Veterinary | animals, medicines, vaccines, feed, treatment orders |
| Nutrition | clients, meal plans, food/supplement SKUs, kitchen indents |
| Agro | plots, seeds, fertilizers, harvest lots, spray logs |

Operations: inventory upsert, GRN, issue/treatment/meal indent, light ledger, dashboard (low stock, expiry)

## APIs
```http
GET  /api/v1/ai-erp/ai/models?module=veterinary
POST /api/v1/ai-erp/ai/route
POST /api/v1/ai-erp/ai/embedded/analyze
GET  /api/v1/ai-erp/erp/dashboard/agro
POST /api/v1/ai-erp/erp/workflow
```

Enhanced module calls now include `embedded_ai` + `erp` blocks automatically:
- `POST /api/v1/veterinary-enhanced/enhanced`
- `POST /api/v1/nutrition-enhanced/enhanced`
- `POST /api/v1/agro-farming/enhanced`
