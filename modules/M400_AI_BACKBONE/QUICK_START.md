# M400 AI Backbone - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env.ai`:

```bash
# AI Providers (pick at least one)
CLAUDE_ENABLED=true
ANTHROPIC_API_KEY=your_claude_key

OPENAI_ENABLED=true
OPENAI_API_KEY=your_openai_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ebdesign

# Cache
REDIS_URL=redis://localhost:6379
```

### 3. Initialize Database

```bash
npm run migrate
```

### 4. Start Backbone Service

```bash
npm run dev
```

Expected output:
```
Initializing M400_AI_BACKBONE...
Decision Engine initialized
Strategy Engine initialized
Learning Engine initialized
Prediction Engine initialized
Coordination Engine initialized
M400_AI_BACKBONE database tables initialized
Loaded 45 modules into registry
Established 89 cable connections
M400_AI_BACKBONE initialized successfully
✓ Server running on http://localhost:4000
```

### 5. Verify Health

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

## First Request

### Make a Decision

```bash
curl -X POST http://localhost:4000/api/v1/m400-ai-backbone/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "M100_CROP_MANAGEMENT",
    "capability": "crop_recommendation",
    "data": {
      "soil": "loamy",
      "climate": "tropical",
      "season": "monsoon",
      "budget": 50000
    },
    "provider": "claude"
  }'
```

Response:
```json
{
  "success": true,
  "decisionId": "DEC_ABC123DEF456",
  "moduleId": "M100_CROP_MANAGEMENT",
  "capability": "crop_recommendation",
  "reasoning": "Based on loamy soil in tropical climate during monsoon season with budget of 50,000, I recommend rice cultivation because... [detailed reasoning]",
  "provider": "claude",
  "model": "claude-3-5-sonnet-20241022",
  "confidence": 0.85,
  "timestamp": "2026-09-08T10:30:00Z"
}
```

## Common Tasks

### Get Decision Details

```bash
curl http://localhost:4000/api/v1/m400-ai-backbone/decisions/DEC_ABC123DEF456
```

### Provide Feedback

```bash
curl -X POST http://localhost:4000/api/v1/m400-ai-backbone/decisions/DEC_ABC123DEF456/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": {
      "crop": "rice",
      "yield": 520,
      "profit": 75000
    },
    "feedback": "Excellent recommendation - exceeded expectations",
    "accuracy": 0.95
  }'
```

### Generate Strategy

```bash
curl -X POST http://localhost:4000/api/v1/m400-ai-backbone/strategies \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "M100_CROP_MANAGEMENT",
    "objectives": [
      "Maximize crop yield by 20%",
      "Reduce water usage by 15%",
      "Minimize pest damage to below 5%"
    ],
    "currentState": {
      "currentYield": 450,
      "waterUsage": 800,
      "pestLoss": 12,
      "budget": 100000
    },
    "provider": "claude"
  }'
```

### Make Prediction

```bash
curl -X POST http://localhost:4000/api/v1/m400-ai-backbone/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "M100_CROP_MANAGEMENT",
    "modelId": "crop_yield_model_v1",
    "context": {
      "historicalYield": 500,
      "avgTemperature": 28,
      "rainfall": 800,
      "soilQuality": "good",
      "pestLevel": "moderate"
    },
    "provider": "claude"
  }'
```

### Check Metrics

```bash
curl http://localhost:4000/api/v1/m400-ai-backbone/metrics
```

Response:
```json
{
  "decisionsCount": 45,
  "strategiesCount": 12,
  "predictionsCount": 23,
  "coordinationEvents": 8,
  "cacheHits": 156,
  "cacheMisses": 89,
  "modulesRegistered": 45,
  "agentsActive": 12,
  "cableConnections": 89,
  "timestamp": "2026-09-08T10:35:00Z"
}
```

### Access Dashboard

Open browser:
```
http://localhost:3000/dashboard/ai-backbone
```

## Testing

Run tests to verify everything works:

```bash
# Run all tests
npm test

# Run backbone tests only
npm test -- modules/M400_AI_BACKBONE/backend/service.test.js

# Run with coverage
npm test -- --coverage modules/M400_AI_BACKBONE/backend/service.test.js

# Watch mode
npm test -- --watch modules/M400_AI_BACKBONE/backend/service.test.js
```

## Docker Setup

### Build Image

```bash
docker build -f modules/M400_AI_BACKBONE/Dockerfile -t ebdesign/ai-backbone:1.0.0 .
```

### Run Container

```bash
docker run -d \
  --name ai-backbone \
  -p 4000:4000 \
  -e DATABASE_URL=postgresql://user:pass@postgres:5432/ebdesign \
  -e REDIS_URL=redis://redis:6379 \
  -e CLAUDE_API_KEY=$CLAUDE_API_KEY \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  ebdesign/ai-backbone:1.0.0
```

### Docker Compose

```bash
docker-compose -f modules/M400_AI_BACKBONE/docker-compose.yml up -d
```

## Troubleshooting

### Port Already In Use

```bash
# Change port
BACKBONE_PORT=4001 npm run dev

# Or kill process on port 4000
lsof -ti :4000 | xargs kill -9
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U postgres -h localhost -d ebdesign -c "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### AI Provider Not Configured

```bash
# Verify API key is set
echo $CLAUDE_API_KEY

# Test API connectivity
curl -H "x-api-key: $CLAUDE_API_KEY" \
  https://api.anthropic.com/v1/messages \
  -X POST \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "{\"model\": \"claude-3-5-sonnet-20241022\", \"max_tokens\": 100, \"messages\": [{\"role\": \"user\", \"content\": \"test\"}]}"
```

## Next Steps

1. **Integrate with your modules**
   ```javascript
   const aiBackbone = require('./modules/M400_AI_BACKBONE/backend/service');
   const decision = await aiBackbone.makeDecision(...);
   ```

2. **Set up monitoring**
   - Configure Prometheus for metrics
   - Set up log aggregation (ELK/Splunk)
   - Create alerts for health checks

3. **Performance tuning**
   - Monitor cache hit ratio
   - Adjust timeout values
   - Implement circuit breaker pattern

4. **Security hardening**
   - Enable HTTPS/TLS
   - Implement API authentication
   - Add rate limiting per client
   - Audit AI outputs for prompt injection

5. **Advanced features**
   - Implement fine-tuning on feedback
   - Add Retrieval-Augmented Generation (RAG)
   - Set up A/B testing for strategies
   - Create feedback loops for continuous improvement

## Quick Links

- 📊 [Dashboard](http://localhost:3000/dashboard/ai-backbone)
- ❤️ [Health Check](http://localhost:4000/api/v1/m400-ai-backbone/health)
- 📈 [Metrics](http://localhost:4000/api/v1/m400-ai-backbone/metrics)
- 📚 [Full Integration Guide](./INTEGRATION_GUIDE.md)
- 🧪 [Test Suite](./backend/service.test.js)
- 📖 [API Docs](./backend/routes.js)

## Support

- Check health: `curl http://localhost:4000/api/v1/m400-ai-backbone/health`
- View metrics: `curl http://localhost:4000/api/v1/m400-ai-backbone/metrics`
- Check logs: `tail -f backend/logs/ai-backbone.log`
- Review errors: Look in `/dashboard/ai-backbone` for recent issues
