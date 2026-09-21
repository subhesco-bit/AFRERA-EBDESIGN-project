# M400 AI Backbone - Complete Integration Guide

## Overview

The M400 AI Backbone is the central orchestration layer for all AI capabilities in the EBDESIGN ERP system. It provides:

- **Decision Making**: AI-powered business decisions with reasoning and confidence scores
- **Strategy Generation**: Formulate strategic plans with execution timelines
- **Predictive Analytics**: Forecast outcomes based on historical patterns
- **Multi-Agent Coordination**: Route complex requests to specialized AI agents
- **Learning System**: Learn from past decisions to improve recommendations
- **Intelligent Caching**: Cache AI results for performance and cost optimization

## Architecture

### Five AI Engines

#### 1. Decision Engine
Makes tactical business decisions with:
- Context-aware reasoning
- Confidence scoring (0-1)
- Feedback-driven improvement
- Multi-provider fallback

```javascript
const decision = await aiBackbone.makeDecision(
  { confidence: 0.85, businessContext: 'crop_selection' },
  {
    moduleId: 'M100_CROP_MANAGEMENT',
    capability: 'crop_recommendation',
    data: { soil: 'loamy', climate: 'tropical' },
    provider: 'claude'
  }
);
```

#### 2. Strategy Engine
Generates strategic plans with:
- Multi-phase execution timelines
- Resource allocation strategies
- Success metrics and checkpoints
- Risk mitigation approaches

```javascript
const strategy = await aiBackbone.generateStrategy(
  ['Maximize yield', 'Reduce water usage'],
  { currentWeather: 'dry', soilMoisture: 0.4 },
  { moduleId: 'M100_CROP_MANAGEMENT' }
);
```

#### 3. Prediction Engine
Forecasts future outcomes with:
- Historical data analysis
- Pattern recognition
- Confidence intervals
- Accuracy tracking

```javascript
const prediction = await aiBackbone.makePrediction(
  { historicalYield: 500, avgTemperature: 28, rainfall: 800 },
  'crop_yield_model',
  { moduleId: 'M100_CROP_MANAGEMENT' }
);
```

#### 4. Learning Engine
Accumulates knowledge from:
- Decision feedback
- Outcome verification
- Accuracy metrics
- Pattern learning

```javascript
await aiBackbone.learnFromData({
  decisionId: 'DEC_abc123',
  outcome: { selected_crop: 'rice', yield: 520 },
  feedback: 'Excellent recommendation',
  accuracy: 0.92
});
```

#### 5. Coordination Engine
Manages multi-agent execution with:
- Agent capability registry
- Request queuing and prioritization
- Load balancing
- Result aggregation

```javascript
const execution = await aiBackbone.coordinateRequest({
  moduleId: 'M100_CROP_MANAGEMENT',
  capability: 'pest_management',
  input: { pestType: 'aphids', severity: 'high' },
  timeout: 30000
});
```

## Integration Points

### From Other Modules

Any module can call the AI Backbone:

```javascript
// In M100_CROP_MANAGEMENT or any other module
const aiBackbone = require('./M400_AI_BACKBONE/backend/service');

// Make a decision
const decision = await aiBackbone.makeDecision(
  { confidence: 0.8 },
  {
    moduleId: 'M100_CROP_MANAGEMENT',
    capability: 'disease_detection',
    data: { leaf_color: 'yellow', spots: true },
    provider: 'claude'
  }
);

// Generate strategy
const strategy = await aiBackbone.generateStrategy(
  objectives,
  currentState,
  { moduleId: 'M100_CROP_MANAGEMENT' }
);

// Make prediction
const prediction = await aiBackbone.makePrediction(
  context,
  'disease_risk_model',
  { moduleId: 'M100_CROP_MANAGEMENT' }
);
```

### Via REST API

All modules can call via HTTP:

```bash
# Make a decision
curl -X POST http://localhost:4000/api/v1/m400-ai-backbone/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "M100_CROP_MANAGEMENT",
    "capability": "crop_recommendation",
    "data": { "soil": "loamy", "climate": "tropical" },
    "provider": "claude"
  }'

# Get decision details
curl http://localhost:4000/api/v1/m400-ai-backbone/decisions/DEC_abc123

# Provide feedback
curl -X POST http://localhost:4000/api/v1/m400-ai-backbone/decisions/DEC_abc123/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": { "selected_crop": "rice", "yield": 520 },
    "feedback": "Excellent recommendation",
    "accuracy": 0.92
  }'
```

### Via Module Cables

Modules are wired to the backbone via the cable system:

```json
{
  "source_module": "M100_CROP_MANAGEMENT",
  "target_module": "M400_AI_BACKBONE",
  "connection_type": "ai_decision_request",
  "metadata": {
    "priority": "high",
    "failover": true,
    "timeout": 30000
  }
}
```

## AI Providers

The backbone supports multiple AI providers with automatic fallback:

### Supported Providers

1. **Claude (Anthropic)**
   - Model: `claude-3-5-sonnet-20241022`
   - Env: `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY`

2. **OpenAI**
   - Model: `gpt-5.4-mini`
   - Env: `OPENAI_API_KEY`

3. **Google Gemini**
   - Model: `gemini-pro`
   - Env: `GEMINI_API_KEY` or `GOOGLE_API_KEY`

4. **Azure OpenAI**
   - Env: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`

5. **Hugging Face**
   - Env: `HUGGINGFACE_API_KEY`

6. **Ollama (Local)**
   - Model: `llama3.1`
   - Env: `OLLAMA_BASE_URL` (default: `http://localhost:11434`)

### Provider Selection

```javascript
// Use specific provider
await aiBackbone.makeDecision(context, {
  ...options,
  provider: 'claude' // or 'openai', 'gemini', 'azure', 'huggingface', 'ollama'
});

// Check available providers
const status = await fetch('/api/v1/m400-ai-backbone/health');
const health = await status.json();
console.log(health.checks.aiProviders);
```

## Caching Strategy

The backbone intelligently caches AI results to:
- Reduce API costs
- Improve response times
- Avoid redundant computations

```javascript
// Cache is transparent - same request returns cached result
const decision1 = await aiBackbone.makeDecision({}, {
  moduleId: 'M100',
  capability: 'crop_recommendation',
  data: { soil: 'loamy', climate: 'tropical' }
});

// This returns from cache (same result ID)
const decision2 = await aiBackbone.makeDecision({}, {
  moduleId: 'M100',
  capability: 'crop_recommendation',
  data: { soil: 'loamy', climate: 'tropical' }
});

// Cache stats available via metrics
const metrics = await fetch('/api/v1/m400-ai-backbone/metrics');
```

## Monitoring & Observability

### Health Checks

```bash
curl http://localhost:4000/api/v1/m400-ai-backbone/health
```

Response:
```json
{
  "moduleId": "M400_AI_BACKBONE",
  "status": "healthy",
  "checks": {
    "database": true,
    "cache": true,
    "aiProviders": true,
    "engines": {
      "decision": true,
      "strategy": true,
      "learning": true,
      "prediction": true,
      "coordination": true
    }
  }
}
```

### Metrics

```bash
curl http://localhost:4000/api/v1/m400-ai-backbone/metrics
```

Response:
```json
{
  "decisionsCount": 1243,
  "strategiesCount": 87,
  "predictionsCount": 456,
  "coordinationEvents": 234,
  "cacheHits": 3456,
  "cacheMisses": 1203,
  "modulesRegistered": 45,
  "agentsActive": 12,
  "cableConnections": 89
}
```

### Dashboard

Access the real-time AI Backbone dashboard at:
```
http://localhost:3000/dashboard/ai-backbone
```

Features:
- Live metrics and statistics
- Engine status monitoring
- Recent decisions, strategies, predictions
- Health checks and system status
- Cache performance
- Module registrations

## Testing

Run the comprehensive test suite:

```bash
npm test -- modules/M400_AI_BACKBONE/backend/service.test.js

# With coverage
npm test -- --coverage modules/M400_AI_BACKBONE/backend/service.test.js

# Watch mode
npm test -- --watch modules/M400_AI_BACKBONE/backend/service.test.js
```

Test coverage includes:
- ✅ Initialization and shutdown
- ✅ All five AI engines
- ✅ Decision making and caching
- ✅ Strategy generation
- ✅ Predictions and accuracy verification
- ✅ Multi-agent coordination
- ✅ Learning from feedback
- ✅ Error handling and fallbacks
- ✅ Module integration and cable connections
- ✅ Health checks and metrics

## Configuration

### Environment Variables

```bash
# AI Providers
CLAUDE_ENABLED=true
ANTHROPIC_API_KEY=sk-ant-...

OPENAI_ENABLED=true
OPENAI_API_KEY=sk-...

GEMINI_ENABLED=true
GEMINI_API_KEY=...

AZURE_OPENAI_ENABLED=true
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://...

HUGGINGFACE_ENABLED=true
HUGGINGFACE_API_KEY=...

OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434

# Model Selection
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096

OPENAI_MODEL=gpt-5.4-mini
OPENAI_MAX_TOKENS=4096

# Database & Cache
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MONGODB_URL=mongodb://...
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package.json .
RUN npm install --production

# Required: AI provider API keys
ENV CLAUDE_API_KEY=${CLAUDE_API_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

COPY . .
EXPOSE 4000

CMD ["node", "backend/src/index.js"]
```

### Docker Compose

```yaml
services:
  ai-backbone:
    build: .
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/ebdesign
      REDIS_URL: redis://redis:6379
      CLAUDE_API_KEY: ${CLAUDE_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
```

## Production Checklist

- [ ] All AI provider API keys configured
- [ ] Database tables created and indexed
- [ ] Redis cache running and accessible
- [ ] Health checks passing (`/health` endpoint)
- [ ] Metrics endpoint accessible (`/metrics`)
- [ ] Dashboard accessible (`/dashboard/ai-backbone`)
- [ ] Error handling and logging configured
- [ ] Rate limiting configured per provider
- [ ] Backup and disaster recovery tested
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Monitoring and alerting configured

## Troubleshooting

### AI Provider Failures

If an AI provider fails, the backbone automatically falls back to:
1. Alternative providers (Claude → OpenAI → Gemini...)
2. Cached results if available
3. Fallback to local Ollama if configured

### High Cache Miss Rate

- Increase Redis memory limit
- Implement cache warming strategies
- Tune cache expiration times

### Slow Response Times

- Check AI provider API latency
- Verify database indexes
- Monitor cache hit ratio
- Consider horizontal scaling

## Next Steps

1. **Complete M401_AI_GATEWAY** - Governance and request routing layer
2. **Complete M402_AI_ORCHESTRATION** - Advanced multi-agent coordination
3. **Integrate M403-M410** - Domain-specific AI modules
4. **Wire all ERP modules** - Connect M100-M300 range to backbone
5. **Build advanced features** - Prompt engineering, RAG, fine-tuning

## Support

For issues, questions, or contributions:
- Check `/health` endpoint for system status
- Review `/metrics` for performance data
- Access dashboard at `/dashboard/ai-backbone`
- Check logs in `backend/logs/`
