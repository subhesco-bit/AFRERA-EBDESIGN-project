# HIGH PRIORITY EXECUTION PLAN
## Subhesco/EBDESIGN - Quality MVP Completion

**Focus:** Items 4-11 (HIGH PRIORITY gaps)  
**Timeline:** 4-5 weeks  
**Status:** Ready for Implementation

---

## PRIORITY #4: AI Models Not Connected (23 Models Stubbed)

### Current State
- Services exist but return `{ implemented: false }`
- Claude API key not configured
- No real predictions happening

### Gap Analysis
```
Missing Models (23):
├─ Prediction Models (10)
│  ├─ Weather prediction
│  ├─ Market price forecasting
│  ├─ Pest outbreak detection
│  ├─ Soil health analysis
│  ├─ Water requirement prediction
│  ├─ Crop yield prediction
│  ├─ Equipment failure prediction
│  ├─ Supply demand prediction
│  ├─ Quality assessment
│  └─ Risk assessment
│
├─ Optimization Engines (7)
│  ├─ Resource allocation
│  ├─ Crop scheduling
│  ├─ Inventory optimization
│  ├─ Logistics optimization
│  ├─ Financial portfolio
│  ├─ Insurance pricing
│  └─ Procurement optimization
│
└─ Analysis Models (3)
   ├─ Soil analysis
   ├─ Water analysis
   └─ Crop analysis
```

### Implementation Plan (Week 3-4)

#### Step 1: Configure Claude API (Day 1)
```bash
# File: backend/.env
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-5
CLAUDE_API_BASE=https://api.anthropic.com
```

#### Step 2: Implement Core AI Coordinator (Days 1-2)
```javascript
// File: backend/src/core/claudeAICoordinator.js
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

class ClaudeAICoordinator {
  async predictWeather(farmData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this farm weather data and predict conditions for next 7 days:
          
Farm Location: ${farmData.location}
Current Conditions: ${JSON.stringify(farmData.current)}
Historical Data: ${JSON.stringify(farmData.historical)}

Provide:
1. Temperature forecast
2. Rainfall probability
3. Wind conditions
4. Recommendations for farmers`,
        },
      ],
    });

    return {
      implemented: true,
      prediction: response.content[0].text,
      timestamp: new Date(),
      confidence: 0.85,
    };
  }

  async forecastMarketPrice(cropData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Forecast market prices for the next 30 days:
          
Crop: ${cropData.cropName}
Region: ${cropData.region}
Historical Prices: ${JSON.stringify(cropData.historicalPrices)}
Supply Data: ${JSON.stringify(cropData.supplyData)}
Demand Trends: ${JSON.stringify(cropData.demandTrends)}

Provide:
1. Weekly price forecast
2. Price trend analysis
3. Optimal selling time
4. Risk factors`,
        },
      ],
    });

    return {
      implemented: true,
      forecast: response.content[0].text,
      timestamp: new Date(),
      confidence: 0.82,
    };
  }

  async detectPestOutbreak(fieldData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze pest outbreak risk:
          
Field Conditions: ${JSON.stringify(fieldData.conditions)}
Recent Weather: ${JSON.stringify(fieldData.recentWeather)}
Pest History: ${JSON.stringify(fieldData.pestHistory)}
Current Crop Stage: ${fieldData.cropStage}

Provide:
1. Pest outbreak probability
2. Likely pest species
3. Risk factors
4. Prevention recommendations`,
        },
      ],
    });

    return {
      implemented: true,
      analysis: response.content[0].text,
      timestamp: new Date(),
      riskLevel: "medium",
      confidence: 0.80,
    };
  }

  async analyzeSoilHealth(soilData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze soil health:
          
Soil Composition: ${JSON.stringify(soilData.composition)}
pH Level: ${soilData.pH}
Nutrient Levels: ${JSON.stringify(soilData.nutrients)}
Recent Test Results: ${JSON.stringify(soilData.testResults)}

Provide:
1. Soil health score
2. Nutrient deficiencies
3. Improvement recommendations
4. Crop suitability`,
        },
      ],
    });

    return {
      implemented: true,
      analysis: response.content[0].text,
      healthScore: 0.75,
      timestamp: new Date(),
      confidence: 0.85,
    };
  }

  async predictCropYield(cropData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Predict crop yield:
          
Crop Type: ${cropData.cropType}
Field Size: ${cropData.fieldSize} hectares
Soil Quality: ${cropData.soilQuality}
Water Availability: ${cropData.waterAvailability}
Weather Forecast: ${JSON.stringify(cropData.weatherForecast)}
Input Usage: ${JSON.stringify(cropData.inputs)}

Provide:
1. Expected yield per hectare
2. Yield confidence factors
3. Risk factors
4. Optimization suggestions`,
        },
      ],
    });

    return {
      implemented: true,
      yieldPrediction: response.content[0].text,
      timestamp: new Date(),
      confidence: 0.80,
    };
  }

  // Optimization Engines
  async optimizeResourceAllocation(resourceData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Optimize resource allocation:
          
Available Resources: ${JSON.stringify(resourceData.available)}
Fields: ${JSON.stringify(resourceData.fields)}
Crops: ${JSON.stringify(resourceData.crops)}
Constraints: ${JSON.stringify(resourceData.constraints)}

Provide:
1. Optimal resource distribution
2. ROI for each field
3. Risk mitigation
4. Implementation timeline`,
        },
      ],
    });

    return {
      implemented: true,
      optimization: response.content[0].text,
      timestamp: new Date(),
      expectedROI: 0.25,
    };
  }

  async optimizeCropScheduling(scheduleData) {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Create optimal crop planting schedule:
          
Available Fields: ${JSON.stringify(scheduleData.fields)}
Desired Crops: ${JSON.stringify(scheduleData.desiredCrops)}
Climate: ${scheduleData.climate}
Market Demand: ${JSON.stringify(scheduleData.marketDemand)}
Labor Availability: ${JSON.stringify(scheduleData.labor)}

Provide:
1. Planting schedule
2. Harvesting timeline
3. Crop rotation plan
4. Expected revenue`,
        },
      ],
    });

    return {
      implemented: true,
      schedule: response.content[0].text,
      timestamp: new Date(),
    };
  }
}

module.exports = new ClaudeAICoordinator();
```

#### Step 3: Update Services to Use Real API (Days 2-3)
Update each service file to use the coordinator:

```javascript
// File: backend/src/services/aiAgentService.js
const claudeAI = require("../core/claudeAICoordinator");

class AIAgentService {
  async getWeatherPrediction(farmId) {
    try {
      const farm = await getFarmData(farmId);
      const prediction = await claudeAI.predictWeather(farm);
      return prediction;
    } catch (error) {
      console.error("Weather prediction error:", error);
      return { implemented: false, error: error.message };
    }
  }

  async getMarketForecast(cropId) {
    try {
      const crop = await getCropData(cropId);
      const forecast = await claudeAI.forecastMarketPrice(crop);
      return forecast;
    } catch (error) {
      console.error("Market forecast error:", error);
      return { implemented: false, error: error.message };
    }
  }

  // ... similar for other models
}
```

#### Step 4: Add Caching for Expensive Predictions (Day 4)
```javascript
// File: backend/src/middleware/aiCache.js
const redis = require("redis");
const client = redis.createClient();

async function cacheAIPrediction(key, prediction, ttl = 3600) {
  await client.setEx(key, ttl, JSON.stringify(prediction));
}

async function getCachedPrediction(key) {
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

module.exports = { cacheAIPrediction, getCachedPrediction };
```

#### Step 5: Add Error Handling & Monitoring (Day 5)
```javascript
// File: backend/src/middleware/aiMonitoring.js
class AIMonitoring {
  async logPrediction(model, input, output, confidence) {
    await database.query(
      `INSERT INTO ai_prediction_logs 
       (model, input, output, confidence, timestamp) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [model, JSON.stringify(input), JSON.stringify(output), confidence]
    );
  }

  async trackErrors(model, error) {
    await database.query(
      `INSERT INTO ai_error_logs 
       (model, error_message, timestamp) 
       VALUES ($1, $2, NOW())`,
      [model, error.message]
    );
  }

  async getModelStats(model) {
    return await database.query(
      `SELECT 
        COUNT(*) as total_predictions,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN confidence > 0.8 THEN 1 END) as high_confidence
       FROM ai_prediction_logs
       WHERE model = $1
       AND timestamp > NOW() - INTERVAL '7 days'`,
      [model]
    );
  }
}

module.exports = new AIMonitoring();
```

### Verification Checklist
- [ ] Claude API key configured in .env
- [ ] `npm install @anthropic-ai/sdk` executed
- [ ] 10 prediction models returning real data
- [ ] 7 optimization engines callable
- [ ] Predictions cached in Redis
- [ ] Monitoring/logging working
- [ ] Error handling in place
- [ ] Tests written for at least 3 models

### Effort: 3-4 weeks
### Blockers: None (optional for MVP)

---

## PRIORITY #5: Digital Twin Not Implemented

### Current State
- No real-time monitoring
- No IoT integration
- No simulation capabilities

### Implementation Plan (Week 4-5)

#### Step 1: Digital Twin Data Model
```javascript
// File: backend/src/database/migrations/digital_twin_schema.sql
CREATE TABLE digital_twins (
  id SERIAL PRIMARY KEY,
  field_id INT REFERENCES fields(id),
  name VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE iot_sensors (
  id SERIAL PRIMARY KEY,
  twin_id INT REFERENCES digital_twins(id),
  sensor_type VARCHAR(100),
  location VARCHAR(255),
  readings JSONB,
  last_reading TIMESTAMP,
  status VARCHAR(50)
);

CREATE TABLE digital_twin_events (
  id SERIAL PRIMARY KEY,
  twin_id INT REFERENCES digital_twins(id),
  event_type VARCHAR(100),
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE simulations (
  id SERIAL PRIMARY KEY,
  twin_id INT REFERENCES digital_twins(id),
  scenario VARCHAR(255),
  parameters JSONB,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 2: IoT Data Ingestion Service
```javascript
// File: backend/src/services/iotDataIngestionService.js
const mqtt = require("mqtt");

class IoTDataIngestionService {
  constructor() {
    this.client = mqtt.connect(process.env.MQTT_BROKER_URL);
    this.setupListeners();
  }

  setupListeners() {
    this.client.on("connect", () => {
      console.log("MQTT Connected");
      this.client.subscribe("farm/+/sensors/+");
    });

    this.client.on("message", (topic, message) => {
      this.processReading(topic, message);
    });
  }

  async processReading(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const [, fieldId, , sensorId] = topic.split("/");

      // Store in database
      await database.query(
        `INSERT INTO sensor_readings 
         (sensor_id, reading, timestamp) 
         VALUES ($1, $2, NOW())`,
        [sensorId, JSON.stringify(data)]
      );

      // Update digital twin
      await this.updateDigitalTwin(fieldId, sensorId, data);

      // Check for anomalies
      await this.checkAnomalies(fieldId, data);
    } catch (error) {
      console.error("IoT processing error:", error);
    }
  }

  async updateDigitalTwin(fieldId, sensorId, data) {
    const twin = await database.query(
      "SELECT id FROM digital_twins WHERE field_id = $1",
      [fieldId]
    );

    if (twin.rows[0]) {
      await database.query(
        `UPDATE iot_sensors 
         SET readings = $1, last_reading = NOW() 
         WHERE id = $2`,
        [JSON.stringify(data), sensorId]
      );
    }
  }

  async checkAnomalies(fieldId, data) {
    // Use AI to detect anomalies
    const anomaly = await this.detectAnomalies(data);
    if (anomaly) {
      await database.query(
        `INSERT INTO digital_twin_events 
         (twin_id, event_type, data) 
         SELECT id, 'anomaly_detected', $1 
         FROM digital_twins WHERE field_id = $2`,
        [JSON.stringify(anomaly), fieldId]
      );
    }
  }

  async detectAnomalies(data) {
    // Implement anomaly detection logic
    const thresholds = {
      temperature: { min: 5, max: 45 },
      humidity: { min: 20, max: 95 },
      soilMoisture: { min: 15, max: 80 },
    };

    for (const [key, value] of Object.entries(data)) {
      if (thresholds[key]) {
        if (value < thresholds[key].min || value > thresholds[key].max) {
          return { sensor: key, value, expected: thresholds[key] };
        }
      }
    }
    return null;
  }
}

module.exports = new IoTDataIngestionService();
```

#### Step 3: Real-Time WebSocket Service
```javascript
// File: backend/src/services/digitalTwinWebSocketService.js
const WebSocket = require("ws");

class DigitalTwinWebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocketHandlers();
    this.startDataStream();
  }

  setupWebSocketHandlers() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        const data = JSON.parse(message);
        this.handleClientRequest(ws, data);
      });

      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });
  }

  async handleClientRequest(ws, data) {
    const { action, fieldId } = data;

    if (action === "subscribe") {
      // Subscribe to real-time updates for this field
      ws.fieldId = fieldId;
      this.sendCurrentState(ws, fieldId);
    }
  }

  async sendCurrentState(ws, fieldId) {
    const twin = await database.query(
      `SELECT dt.*, array_agg(
        json_build_object('id', s.id, 'type', s.sensor_type, 'readings', s.readings)
      ) as sensors
       FROM digital_twins dt
       LEFT JOIN iot_sensors s ON dt.id = s.twin_id
       WHERE dt.field_id = $1
       GROUP BY dt.id`,
      [fieldId]
    );

    if (twin.rows[0]) {
      ws.send(
        JSON.stringify({
          type: "state_update",
          data: twin.rows[0],
        })
      );
    }
  }

  async startDataStream() {
    // Stream updates to all connected clients
    setInterval(async () => {
      const updates = await database.query(
        `SELECT dt.id, dt.field_id, array_agg(
          json_build_object('reading', s.readings, 'time', s.last_reading)
        ) as latest_readings
         FROM digital_twins dt
         JOIN iot_sensors s ON dt.id = s.twin_id
         WHERE s.last_reading > NOW() - INTERVAL '1 minute'
         GROUP BY dt.id, dt.field_id`
      );

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.fieldId) {
          const relevant = updates.rows.filter(
            (u) => u.field_id == client.fieldId
          );
          if (relevant.length > 0) {
            client.send(
              JSON.stringify({
                type: "sensor_update",
                data: relevant,
              })
            );
          }
        }
      });
    }, 5000); // Update every 5 seconds
  }
}

module.exports = DigitalTwinWebSocketService;
```

#### Step 4: Simulation Engine
```javascript
// File: backend/src/services/simulationEngine.js
class SimulationEngine {
  async runSimulation(twinId, scenario, parameters) {
    const twin = await database.query(
      "SELECT * FROM digital_twins WHERE id = $1",
      [twinId]
    );

    // Run scenario-based simulation
    const results = await this.simulateScenario(
      twin.rows[0],
      scenario,
      parameters
    );

    // Store results
    await database.query(
      `INSERT INTO simulations 
       (twin_id, scenario, parameters, results) 
       VALUES ($1, $2, $3, $4)`,
      [twinId, scenario, JSON.stringify(parameters), JSON.stringify(results)]
    );

    return results;
  }

  async simulateScenario(twin, scenario, parameters) {
    switch (scenario) {
      case "weather_impact":
        return this.simulateWeatherImpact(twin, parameters);
      case "pest_outbreak":
        return this.simulatePestOutbreak(twin, parameters);
      case "irrigation_change":
        return this.simulateIrrigationChange(twin, parameters);
      case "fertilizer_schedule":
        return this.simulateFertilizerSchedule(twin, parameters);
      default:
        return { error: "Unknown scenario" };
    }
  }

  async simulateWeatherImpact(twin, { temperature, rainfall, humidity }) {
    return {
      scenario: "weather_impact",
      predictedCropHealth: this.calculateCropHealth(temperature, rainfall),
      harvestDate: this.estimateHarvestDate(temperature),
      expectedYield: this.estimateYield(temperature, rainfall, humidity),
      recommendations: [
        "Increase irrigation due to high temperature",
        "Monitor for pest outbreaks",
      ],
    };
  }

  async simulatePestOutbreak(twin, { pestType, intensity, duration }) {
    return {
      scenario: "pest_outbreak",
      cropDamage: this.calculatePestDamage(pestType, intensity, duration),
      treatmentRecommendations: this.getTraitmentOptions(pestType),
      expectedLoss: this.estimateLoss(pestType, intensity),
    };
  }

  // Helper methods
  calculateCropHealth(temp, rainfall) {
    // Simplified calculation
    let health = 100;
    if (temp > 40) health -= (temp - 40) * 5;
    if (temp < 5) health -= (5 - temp) * 3;
    if (rainfall < 20) health -= (20 - rainfall) * 2;
    return Math.max(0, health);
  }

  estimateHarvestDate(temperature) {
    // Simplified - actual implementation would be more complex
    const daysToHarvest = Math.max(30, 90 - temperature * 2);
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + daysToHarvest);
    return harvestDate;
  }

  estimateYield(temp, rainfall, humidity) {
    return 45 + temp * 0.5 + rainfall * 0.3 + humidity * 0.1;
  }

  calculatePestDamage(type, intensity, duration) {
    return Math.min(100, (intensity / 10) * duration * 2);
  }

  getTraitmentOptions(pestType) {
    const treatments = {
      aphids: ["Neem oil spray", "Beneficial insects", "Insecticidal soap"],
      thrips: ["Spinosad", "Blue sticky traps", "Predatory mites"],
      spider_mites: ["Miticide spray", "Increase humidity", "Predatory mites"],
    };
    return treatments[pestType] || ["Consult agricultural expert"];
  }

  estimateLoss(type, intensity) {
    return intensity * 5;
  }
}

module.exports = new SimulationEngine();
```

#### Step 5: Frontend Digital Twin Component
```jsx
// File: frontend/src/pages/DigitalTwinPage.jsx
import React, { useEffect, useState } from "react";

export default function DigitalTwinPage() {
  const [twin, setTwin] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const fieldId = new URLSearchParams(window.location.search).get("fieldId");

    // Connect WebSocket
    const websocket = new WebSocket(
      `ws://localhost:3000/api/v1/digital-twin/${fieldId}`
    );

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ action: "subscribe", fieldId }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "state_update") {
        setTwin(data.data);
        setSensors(data.data.sensors || []);
      } else if (data.type === "sensor_update") {
        updateSensorReadings(data.data);
      }
    };

    setWs(websocket);

    return () => websocket.close();
  }, []);

  const updateSensorReadings = (updates) => {
    setSensors((prev) =>
      prev.map((sensor) => {
        const update = updates.find((u) => u.id === sensor.id);
        return update ? { ...sensor, ...update.latest_readings } : sensor;
      })
    );
  };

  return (
    <div className="digital-twin-page">
      <h1>Digital Twin - {twin?.name}</h1>

      <div className="sensors-grid">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="sensor-card">
            <h3>{sensor.type}</h3>
            <p>Location: {sensor.location}</p>
            <div className="readings">
              {sensor.readings &&
                Object.entries(sensor.readings).map(([key, value]) => (
                  <div key={key}>
                    {key}: {value}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="simulation-panel">
        <h2>Run Simulations</h2>
        <button onClick={() => runSimulation("weather_impact")}>
          Weather Impact
        </button>
        <button onClick={() => runSimulation("pest_outbreak")}>
          Pest Outbreak
        </button>
        <button onClick={() => runSimulation("irrigation_change")}>
          Irrigation Change
        </button>
      </div>
    </div>
  );
}
```

### Verification Checklist
- [ ] Digital twin schema created
- [ ] MQTT broker configured
- [ ] IoT data ingestion working
- [ ] WebSocket real-time updates flowing
- [ ] Simulation engine operational
- [ ] Frontend digital twin page accessible
- [ ] Anomaly detection working
- [ ] Performance acceptable (<500ms updates)

### Effort: 2-3 weeks
### Blockers: None (post-MVP feature)

---

## PRIORITY #6: 27 Pages Missing (18% of Frontend)

### Current State
- 123/150 pages complete
- Missing 27 pages, mostly reporting

### Missing Pages Breakdown
```
Reports Module (20 pages):
├─ Sales Dashboard
├─ Revenue Report
├─ Expense Report  
├─ Profit & Loss
├─ Crop Performance
├─ Soil Health Trends
├─ Weather Impact
├─ Pest Management Report
├─ Inventory Report
├─ Supplier Performance
├─ Customer Analytics
├─ Market Trends
├─ Climate Adaptation
├─ Subsidy Tracking
├─ Insurance Claims
├─ Loan Status
├─ Payment History
├─ Compliance Report
├─ Quality Metrics
└─ KPI Dashboard

Other Missing (7 pages):
├─ Advanced Settings
├─ Custom Workflows
├─ API Integration
├─ Webhook Management
├─ Audit Trail
├─ Data Export
└─ Help & Documentation
```

### Quick Implementation Plan (5 days)

#### Day 1: Create Report Pages (5 pages)
```jsx
// File: frontend/src/pages/reports/SalesDashboard.jsx
import React, { useEffect, useState } from "react";
import { getReportData } from "../../services/api";

export default function SalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getReportData("sales", {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        });
        setData(result);
      } catch (error) {
        console.error("Failed to load sales data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="sales-dashboard">
      <h1>Sales Dashboard</h1>
      <div className="metrics-grid">
        <div className="metric">
          <h3>Total Sales</h3>
          <p className="value">₹{data?.totalSales?.toLocaleString()}</p>
          <p className="change">
            {data?.salesChange > 0 ? "+" : ""}
            {data?.salesChange}% vs last month
          </p>
        </div>
        <div className="metric">
          <h3>Average Order Value</h3>
          <p className="value">₹{data?.avgOrderValue?.toLocaleString()}</p>
        </div>
        <div className="metric">
          <h3>Total Orders</h3>
          <p className="value">{data?.totalOrders}</p>
        </div>
        <div className="metric">
          <h3>Conversion Rate</h3>
          <p className="value">{data?.conversionRate}%</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart">
          <h3>Sales Trend (Last 30 Days)</h3>
          {/* Add chart component here */}
        </div>
        <div className="chart">
          <h3>Top Products</h3>
          {/* Add chart component here */}
        </div>
      </div>

      <div className="table">
        <h3>Recent Sales</h3>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.recentSales?.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.orderId}</td>
                <td>{sale.product}</td>
                <td>₹{sale.amount}</td>
                <td>{new Date(sale.date).toLocaleDateString()}</td>
                <td>{sale.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

#### Days 2-3: Create Remaining Key Reports (10 pages)
Similar pattern for:
- RevenueReport.jsx
- ExpenseReport.jsx
- ProfitAndLoss.jsx
- CropPerformance.jsx
- InventoryReport.jsx
- CustomerAnalytics.jsx
- MarketTrends.jsx
- ComplianceReport.jsx
- KPIDashboard.jsx

#### Day 4: Create Settings & Admin Pages (7 pages)
```jsx
// File: frontend/src/pages/AdvancedSettings.jsx
export default function AdvancedSettings() {
  return (
    <div className="advanced-settings">
      <h1>Advanced Settings</h1>
      <div className="settings-panel">
        <section>
          <h2>API Keys</h2>
          {/* API key management */}
        </section>
        <section>
          <h2>Integrations</h2>
          {/* Integration management */}
        </section>
        <section>
          <h2>Webhooks</h2>
          {/* Webhook configuration */}
        </section>
        <section>
          <h2>Data Export</h2>
          {/* Export options */}
        </section>
        <section>
          <h2>Audit Trail</h2>
          {/* Audit log viewer */}
        </section>
      </div>
    </div>
  );
}
```

#### Day 5: Add Routes & Fix Styling
```javascript
// File: frontend/src/config/routes.js
export const routes = [
  // Existing routes...

  // New Report Pages
  {
    path: "/reports/sales",
    element: <SalesDashboard />,
    label: "Sales Dashboard",
    requiresAuth: true,
  },
  {
    path: "/reports/revenue",
    element: <RevenueReport />,
    label: "Revenue Report",
    requiresAuth: true,
  },
  {
    path: "/reports/expenses",
    element: <ExpenseReport />,
    label: "Expense Report",
    requiresAuth: true,
  },
  // ... continue for all pages

  // Settings Pages
  {
    path: "/settings/advanced",
    element: <AdvancedSettings />,
    label: "Advanced Settings",
    requiresAuth: true,
    admin: true,
  },
  {
    path: "/settings/api",
    element: <APIManagement />,
    label: "API Management",
    requiresAuth: true,
    admin: true,
  },
  // ... continue
];
```

### Verification Checklist
- [ ] All 20 report pages created
- [ ] All 7 settings pages created
- [ ] Routes added to routes.js
- [ ] Navigation menu updated
- [ ] API endpoints available for each page
- [ ] Pages load without errors
- [ ] Styling consistent with existing pages
- [ ] Mobile responsive

### Effort: 5-7 days (can be parallelized)
### Blockers: None

---

## PRIORITY #7: New Components Not Routed

### Current State
- 6 components created (AI, MFA, GDPR, Library, Platform)
- Routes not added to navigation

### Components to Route
1. AI Chat Component
2. MFA Setup
3. GDPR Consent
4. Library Browser
5. Platform Core Dashboard

### Implementation (2-4 hours)

#### Step 1: Add Routes
```javascript
// File: frontend/src/config/routes.js - Add these routes

{
  path: "/ai/chat",
  element: <AIChat />,
  label: "AI Assistant",
  icon: "bot",
  requiresAuth: true,
},
{
  path: "/security/mfa",
  element: <MFASetup />,
  label: "Two-Factor Authentication",
  requiresAuth: true,
},
{
  path: "/privacy/gdpr",
  element: <GDPRConsent />,
  label: "Privacy Settings",
  requiresAuth: true,
},
{
  path: "/library/browse",
  element: <LibraryBrowser />,
  label: "Knowledge Library",
  requiresAuth: true,
},
{
  path: "/platform/core",
  element: <PlatformCoreDashboard />,
  label: "Platform Dashboard",
  requiresAuth: true,
},
```

#### Step 2: Update Navigation
```jsx
// File: frontend/src/components/Navigation.jsx
const menuItems = [
  {
    label: "AI",
    icon: "bot",
    items: [
      { label: "AI Assistant", path: "/ai/chat" },
      { label: "AI Predictions", path: "/ai/predictions" },
    ],
  },
  {
    label: "Security",
    icon: "shield",
    items: [
      { label: "Two-Factor Auth", path: "/security/mfa" },
      { label: "API Keys", path: "/security/api-keys" },
    ],
  },
  {
    label: "Privacy",
    icon: "lock",
    items: [
      { label: "Privacy Settings", path: "/privacy/gdpr" },
      { label: "Data Export", path: "/privacy/export" },
    ],
  },
  {
    label: "Resources",
    icon: "book",
    items: [
      { label: "Knowledge Library", path: "/library/browse" },
      { label: "Documentation", path: "/docs" },
    ],
  },
];

export function Navigation() {
  return (
    <nav className="sidebar">
      {menuItems.map((item) => (
        <div key={item.label} className="menu-section">
          <h3>{item.label}</h3>
          <ul>
            {item.items.map((subitem) => (
              <li key={subitem.path}>
                <Link to={subitem.path}>{subitem.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

#### Step 3: Add Access Control
```javascript
// File: frontend/src/middleware/accessControl.js
export const componentAccess = {
  "ai/chat": ["farmer", "admin", "advisor"],
  "security/mfa": ["all"],
  "privacy/gdpr": ["all"],
  "library/browse": ["all"],
  "platform/core": ["admin", "manager"],
};

export function checkAccess(userRole, path) {
  const allowedRoles = componentAccess[path];
  return allowedRoles.includes("all") || allowedRoles.includes(userRole);
}
```

#### Step 4: Test Navigation
```bash
npm run dev
# Verify each component loads without errors
# Verify access control works
# Verify UI/UX flow is smooth
```

### Verification Checklist
- [ ] All 5 components routed
- [ ] Navigation menu updated
- [ ] Access control implemented
- [ ] Each page loads without errors
- [ ] Mobile navigation works
- [ ] User can navigate to components
- [ ] Styling is consistent

### Effort: 2-4 hours
### Blocker: MEDIUM (affects user access to features)

---

## PRIORITY #8: Infrastructure Monitoring Missing

### Current State
- No monitoring
- No alerts
- Cannot detect production issues

### Implementation Plan (1-2 weeks)

#### Option A: Datadog (Recommended)
```javascript
// File: backend/.env
DATADOG_API_KEY=xxxxx
DATADOG_APP_KEY=xxxxx

// File: backend/src/middleware/datadogMonitoring.js
const StatsD = require("node-statsd").StatsD;
const dogapi = require("dogapi");

dogapi.initialize({
  api_key: process.env.DATADOG_API_KEY,
  app_key: process.env.DATADOG_APP_KEY,
});

const client = new StatsD({
  host: "localhost",
  port: 8125,
});

// Track application metrics
export function trackMetric(metric, value, tags = []) {
  client.gauge(metric, value, tags);
}

export function trackEvent(eventName, data) {
  dogapi.event.create(eventName, {
    text: JSON.stringify(data),
    priority: "normal",
    tags: ["app:ebdesign"],
  });
}

// Middleware for request monitoring
export function monitoringMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    client.timing("http.request.duration", duration, [
      `method:${req.method}`,
      `path:${req.path}`,
      `status:${res.statusCode}`,
    ]);
  });

  next();
}
```

#### Option B: Prometheus + Grafana (Open Source)
```javascript
// File: backend/src/middleware/prometheusMonitoring.js
const prometheus = require("prom-client");

// Create metrics
const httpDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "path", "status"],
});

const httpRequests = new prometheus.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
});

const databaseQueries = new prometheus.Histogram({
  name: "db_query_duration_seconds",
  help: "Database query duration",
  labelNames: ["query_type", "table"],
});

// Middleware
export function prometheusMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);
    httpRequests.labels(req.method, req.path, res.statusCode).inc();
  });

  next();
}

// Expose metrics endpoint
app.get("/metrics", (req, res) => {
  res.set("Content-Type", prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

#### Monitoring Alerts Configuration
```javascript
// File: backend/src/config/alerts.json
{
  "alerts": [
    {
      "name": "High Error Rate",
      "metric": "error_rate",
      "threshold": 5,
      "unit": "%",
      "duration": "5m",
      "severity": "critical",
      "notification": ["slack", "email"],
      "slackChannel": "#alerts"
    },
    {
      "name": "Database Connection Pool Exhausted",
      "metric": "db_pool_usage",
      "threshold": 90,
      "unit": "%",
      "duration": "2m",
      "severity": "critical"
    },
    {
      "name": "API Response Time High",
      "metric": "api_response_time",
      "threshold": 1000,
      "unit": "ms",
      "duration": "10m",
      "severity": "warning"
    },
    {
      "name": "Service Memory Usage High",
      "metric": "process_memory_usage",
      "threshold": 500,
      "unit": "MB",
      "duration": "5m",
      "severity": "warning"
    },
    {
      "name": "Redis Connection Lost",
      "metric": "redis_connected",
      "threshold": 0,
      "duration": "1m",
      "severity": "critical"
    }
  ]
}
```

#### Monitoring Dashboard Component
```jsx
// File: frontend/src/pages/MonitoringDashboard.jsx
import React, { useEffect, useState } from "react";

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch("/api/v1/monitoring/metrics");
      const data = await response.json();
      setMetrics(data);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="monitoring-dashboard">
      <h1>System Monitoring</h1>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>API Response Time</h3>
          <p className="value">{metrics.apiResponseTime}ms</p>
          <div className="progress" style={{
            width: `${Math.min(metrics.apiResponseTime / 10, 100)}%`
          }}></div>
        </div>

        <div className="metric-card">
          <h3>Error Rate</h3>
          <p className="value">{metrics.errorRate}%</p>
          <div className={`status ${metrics.errorRate > 5 ? 'critical' : 'normal'}`}>
            {metrics.errorRate > 5 ? 'CRITICAL' : 'NORMAL'}
          </div>
        </div>

        <div className="metric-card">
          <h3>Database Connections</h3>
          <p className="value">{metrics.dbConnections}/100</p>
          <div className="progress" style={{
            width: `${metrics.dbConnections}%`
          }}></div>
        </div>

        <div className="metric-card">
          <h3>Memory Usage</h3>
          <p className="value">{metrics.memoryUsage}MB</p>
          <div className="progress" style={{
            width: `${Math.min(metrics.memoryUsage / 5, 100)}%`
          }}></div>
        </div>
      </div>

      <div className="alerts-section">
        <h2>Active Alerts</h2>
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert alert-${alert.severity}`}>
              <h4>{alert.name}</h4>
              <p>{alert.message}</p>
              <time>{new Date(alert.timestamp).toLocaleString()}</time>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Verification Checklist
- [ ] Monitoring tool installed (Datadog/Prometheus)
- [ ] Metrics collected and displayed
- [ ] Alerts configured and working
- [ ] Dashboard accessible
- [ ] Notifications working (Slack/Email)
- [ ] Historical data retained
- [ ] Performance acceptable

### Effort: 1-2 weeks
### Blocker: YES (required for production)

---

## PRIORITY #9: CI/CD Pipeline Incomplete

### Current State
- GitHub Actions workflow exists but incomplete
- No test automation
- No automatic deployment

### Complete Pipeline (1-2 weeks)

#### Step 1: Test Stage
```yaml
# File: .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install

      - name: Run backend tests
        run: |
          cd backend
          npm test -- --coverage --watchAll=false

      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info
```

#### Step 2: Security Scanning
```yaml
# File: .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"

      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "EBDESIGN"
          path: "."
          format: "JSON"
```

#### Step 3: Build Stage
```yaml
# File: .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main, audit/ui-api-fix]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Build backend
        run: |
          cd backend
          npm install
          npm run build

      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build

      - name: Create artifact
        run: |
          mkdir -p dist
          cp -r backend/dist dist/backend
          cp -r frontend/dist dist/frontend

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: build-artifact
          path: dist/
```

#### Step 4: Deploy Stage
```yaml
# File: .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [test, security, build]

    steps:
      - uses: actions/checkout@v3

      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: build-artifact

      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan $DEPLOY_HOST >> ~/.ssh/known_hosts
          
          scp -r -i ~/.ssh/deploy_key dist/* \
            deploy@$DEPLOY_HOST:/app/

      - name: Run migrations
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          ssh -i ~/.ssh/deploy_key deploy@$DEPLOY_HOST \
            'cd /app && npm run migrate'

      - name: Restart service
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          ssh -i ~/.ssh/deploy_key deploy@$DEPLOY_HOST \
            'sudo systemctl restart ebdesign'

      - name: Health check
        run: |
          curl -f http://${{ secrets.DEPLOY_HOST }}/api/v1/health || exit 1
```

### Verification Checklist
- [ ] All workflow files created
- [ ] Tests running on every push
- [ ] Security scans passing
- [ ] Build artifacts created
- [ ] Deployment working
- [ ] Health checks passing
- [ ] Rollback capability tested

### Effort: 1-2 weeks
### Blocker: YES (required for production)

---

## PRIORITY #10: Security Testing Not Done

### Current State
- No security tests
- Unknown vulnerabilities

### Security Testing Plan (2-3 weeks)

#### Step 1: OWASP Testing
```bash
# Install OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# Manual testing checklist
- SQL Injection
- XSS attacks
- CSRF protection
- Authentication bypass
- Authorization bypass
- Session fixation
- Sensitive data exposure
```

#### Step 2: Automated Security Tests
```javascript
// File: backend/src/__tests__/security.test.js
const request = require("supertest");
const app = require("../index");

describe("Security Tests", () => {
  describe("SQL Injection", () => {
    test("should not allow SQL injection in login", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "'; DROP TABLE users; --",
          password: "test",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("XSS Protection", () => {
    test("should escape HTML in user input", async () => {
      const response = await request(app)
        .post("/api/v1/products")
        .send({
          name: "<script>alert('XSS')</script>",
          description: "Test",
        })
        .set("Authorization", `Bearer ${token}`);

      const product = response.body;
      expect(product.name).not.toContain("<script>");
    });
  });

  describe("CSRF Protection", () => {
    test("should require CSRF token for POST requests", async () => {
      const response = await request(app).post("/api/v1/orders").send({
        productId: 1,
        quantity: 5,
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Authentication", () => {
    test("should not allow access without auth", async () => {
      const response = await request(app).get("/api/v1/user/profile");

      expect(response.status).toBe(401);
    });

    test("should not allow invalid tokens", async () => {
      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Authorization", "Bearer invalid_token");

      expect(response.status).toBe(401);
    });
  });

  describe("Authorization", () => {
    test("should not allow user to access other users' data", async () => {
      const response = await request(app)
        .get("/api/v1/users/999/profile")
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(response.status).toBe(403);
    });

    test("should not allow non-admin to access admin endpoints", async () => {
      const response = await request(app)
        .post("/api/v1/admin/users")
        .send({ email: "new@user.com" })
        .set("Authorization", `Bearer ${farmerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Data Validation", () => {
    test("should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "not_an_email",
          password: "Password123!",
        });

      expect(response.status).toBe(400);
    });

    test("should reject weak passwords", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "123", // Too weak
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Rate Limiting", () => {
    test("should limit login attempts", async () => {
      for (let i = 0; i < 10; i++) {
        await request(app).post("/api/v1/auth/login").send({
          email: "test@example.com",
          password: "wrong",
        });
      }

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "correct",
        });

      expect(response.status).toBe(429); // Too Many Requests
    });
  });

  describe("Sensitive Data", () => {
    test("should not expose passwords in responses", async () => {
      const response = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.body[0]).not.toHaveProperty("password");
    });

    test("should not expose API keys in responses", async () => {
      const response = await request(app)
        .get("/api/v1/integrations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.body).not.toContain("api_key");
    });
  });
});
```

#### Step 3: Security Headers
```javascript
// File: backend/src/middleware/securityHeaders.js
module.exports = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent content type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  next();
};
```

#### Step 4: Dependency Security
```bash
# Run npm audit to check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Verification Checklist
- [ ] OWASP ZAP scan completed
- [ ] No critical vulnerabilities found
- [ ] Security tests written and passing
- [ ] Security headers added
- [ ] Dependencies up to date
- [ ] Rate limiting implemented
- [ ] Input validation comprehensive
- [ ] Sensitive data properly handled

### Effort: 2-3 weeks
### Blocker: YES (required for production)

---

## PRIORITY #11: GDPR Compliance Not Verified

### Current State
- GDPR service created
- Compliance not tested

### GDPR Compliance Checklist (2-3 weeks)

#### Step 1: Data Inventory
```javascript
// File: backend/src/services/dataInventoryService.js
const dataInventory = {
  users: {
    table: "users",
    dataElements: [
      "id",
      "email",
      "name",
      "phone",
      "address",
      "profilePhoto",
      "loginHistory",
    ],
    purpose: "User account management",
    legalBasis: "Consent",
    retention: "Account active + 1 year",
    thirdParties: ["Payment processor", "Email service"],
  },
  farmers: {
    table: "farmers",
    dataElements: [
      "farmSize",
      "crops",
      "soilData",
      "weatherData",
      "location",
      "landRecords",
    ],
    purpose: "Agricultural advisory",
    legalBasis: "Legitimate interest",
    retention: "Active + 5 years for compliance",
    thirdParties: ["Insurance provider", "Logistics partner"],
  },
  transactions: {
    table: "transactions",
    dataElements: ["amount", "date", "method", "bankAccount"],
    purpose: "Financial record",
    legalBasis: "Legal obligation",
    retention: "7 years (legal requirement)",
    thirdParties: ["Payment processor", "Tax authority"],
  },
  // ... continue for all data types
};

export async function generateDataInventory() {
  return dataInventory;
}

export async function generateDataProcessingAgreement() {
  return {
    scope: "Personal data collected from farmers",
    processor: "Subhesco EBDESIGN",
    purposes: [
      "Provision of agricultural services",
      "Improvement of services",
      "Compliance with regulations",
    ],
    dataRetention: "Varies by data type",
    dataProtection: "Encryption at rest and in transit",
    subprocessors: [
      "AWS (Cloud hosting)",
      "Stripe (Payment processing)",
      "SendGrid (Email)",
    ],
  };
}
```

#### Step 2: Consent Management
```javascript
// File: backend/src/services/consentService.js
class ConsentService {
  async recordConsent(userId, consentType, version) {
    return await database.query(
      `INSERT INTO user_consents 
       (user_id, consent_type, version, given_at, ip_address, user_agent) 
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [userId, consentType, version, userIp, userAgent]
    );
  }

  async getConsent(userId, consentType) {
    return await database.query(
      `SELECT * FROM user_consents 
       WHERE user_id = $1 AND consent_type = $2 
       ORDER BY given_at DESC LIMIT 1`,
      [userId, consentType]
    );
  }

  async withdrawConsent(userId, consentType) {
    return await database.query(
      `INSERT INTO consent_withdrawals 
       (user_id, consent_type, withdrawn_at) 
       VALUES ($1, $2, NOW())`,
      [userId, consentType]
    );
  }

  async hasValidConsent(userId, consentType) {
    const withdrawal = await database.query(
      `SELECT withdrawn_at FROM consent_withdrawals 
       WHERE user_id = $1 AND consent_type = $2 
       ORDER BY withdrawn_at DESC LIMIT 1`,
      [userId, consentType]
    );

    if (withdrawal.rows[0]) {
      return false; // Consent has been withdrawn
    }

    const consent = await this.getConsent(userId, consentType);
    return !!consent.rows[0]; // True if consent exists
  }
}

module.exports = new ConsentService();
```

#### Step 3: Right to Be Forgotten
```javascript
// File: backend/src/services/rightToBeForgettenService.js
class RightToBeForgettenService {
  async deleteUserData(userId, reason) {
    const transaction = await database.transaction();

    try {
      // Log the deletion request (for audit trail)
      await transaction.query(
        `INSERT INTO deletion_requests 
         (user_id, reason, requested_at, status) 
         VALUES ($1, $2, NOW(), 'pending')`,
        [userId, reason]
      );

      // Delete from orders
      await transaction.query("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)", [userId]);
      await transaction.query("DELETE FROM orders WHERE user_id = $1", [userId]);

      // Delete from user profile
      await transaction.query("UPDATE users SET email = 'deleted-' || id, name = 'Deleted User', phone = NULL WHERE id = $1", [userId]);

      // Delete from farmers table
      await transaction.query("DELETE FROM farmers WHERE user_id = $1", [userId]);

      // Delete from consents
      await transaction.query("DELETE FROM user_consents WHERE user_id = $1", [userId]);

      // Delete from activity log
      await transaction.query("DELETE FROM activity_log WHERE user_id = $1", [userId]);

      // Mark account as deleted
      await transaction.query("UPDATE users SET deleted_at = NOW() WHERE id = $1", [userId]);

      await transaction.commit();

      return { success: true, message: "User data deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getDataForDeletion(userId) {
    return await database.query(
      `SELECT COUNT(*) as total_records
       FROM (
         SELECT 1 FROM orders WHERE user_id = $1
         UNION ALL SELECT 1 FROM farmers WHERE user_id = $1
         UNION ALL SELECT 1 FROM user_consents WHERE user_id = $1
         UNION ALL SELECT 1 FROM activity_log WHERE user_id = $1
       ) AS all_data`,
      [userId]
    );
  }
}
```

#### Step 4: Data Export
```javascript
// File: backend/src/services/dataExportService.js
class DataExportService {
  async exportUserData(userId, format = "json") {
    const userData = await database.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );
    const farmerData = await database.query(
      "SELECT * FROM farmers WHERE user_id = $1",
      [userId]
    );
    const orderData = await database.query(
      "SELECT * FROM orders WHERE user_id = $1",
      [userId]
    );

    const completeData = {
      user: userData.rows[0],
      farmer: farmerData.rows[0],
      orders: orderData.rows,
    };

    if (format === "json") {
      return JSON.stringify(completeData, null, 2);
    } else if (format === "csv") {
      return this.convertToCSV(completeData);
    }
  }

  async generateDataReport(userId) {
    return {
      exportDate: new Date(),
      userId: userId,
      dataCategories: {
        profile: "Complete",
        transactions: "Complete",
        agricultural: "Complete",
      },
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }
}
```

#### Step 5: GDPR Tests
```javascript
// File: backend/src/__tests__/gdpr.test.js
describe("GDPR Compliance", () => {
  describe("Consent Management", () => {
    test("should record user consent", async () => {
      const consent = await consentService.recordConsent(
        userId,
        "marketing_emails",
        "1.0"
      );
      expect(consent.rows[0].user_id).toBe(userId);
    });

    test("should allow consent withdrawal", async () => {
      await consentService.recordConsent(userId, "marketing_emails", "1.0");
      const withdrawal = await consentService.withdrawConsent(
        userId,
        "marketing_emails"
      );
      expect(withdrawal.rowCount).toBe(1);
    });

    test("should verify valid consent before sending emails", async () => {
      const hasConsent = await consentService.hasValidConsent(
        userId,
        "marketing_emails"
      );
      expect(hasConsent).toBe(false); // After withdrawal
    });
  });

  describe("Right to Be Forgotten", () => {
    test("should delete all user data on request", async () => {
      const result = await rightToBeForgettenService.deleteUserData(
        userId,
        "user_request"
      );
      expect(result.success).toBe(true);

      // Verify user is deleted
      const user = await database.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
      );
      expect(user.rows[0].deleted_at).not.toBeNull();
    });

    test("should preserve deletion audit trail", async () => {
      await rightToBeForgettenService.deleteUserData(userId, "user_request");

      const deletion = await database.query(
        "SELECT * FROM deletion_requests WHERE user_id = $1",
        [userId]
      );
      expect(deletion.rows[0].status).toBe("pending");
    });
  });

  describe("Data Export", () => {
    test("should export all user data in JSON format", async () => {
      const data = await dataExportService.exportUserData(userId, "json");
      const parsed = JSON.parse(data);
      expect(parsed).toHaveProperty("user");
      expect(parsed).toHaveProperty("farmer");
      expect(parsed).toHaveProperty("orders");
    });

    test("should export data in CSV format", async () => {
      const csv = await dataExportService.exportUserData(userId, "csv");
      expect(csv).toContain(","); // CSV should have commas
    });
  });

  describe("Privacy Policy", () => {
    test("should display privacy policy to users", async () => {
      const response = await request(app).get("/api/v1/privacy-policy");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("content");
    });
  });
});
```

### Verification Checklist
- [ ] Data inventory documented
- [ ] Consent mechanism tested
- [ ] Right to be forgotten working
- [ ] Data export working
- [ ] Privacy policy displayed
- [ ] Data retention policy implemented
- [ ] Third-party data sharing documented
- [ ] Legal review completed

### Effort: 2-3 weeks
### Blocker: YES (required for production)

---

## COMBINED EXECUTION TIMELINE

### Week 1: Foundations
- PostgreSQL/MongoDB/Redis setup
- Database migrations executed
- Basic tests written (20 tests)

### Week 2: High Priority Features
- AI models connected (4 core models)
- 5 critical pages added
- New components routed
- CI/CD pipeline set up

### Week 3: Quality & Security
- Test coverage to 40%
- Security testing phase 1
- GDPR compliance phase 1
- Monitoring setup

### Week 4: Completion
- All pages added
- Digital twin phase 1
- Security hardening
- Final testing

### Week 5-6: Production
- Load testing
- Final verification
- Documentation
- Deployment readiness

---

## SUMMARY TABLE

| Priority | Item | Effort | Blocker | Start | Complete |
|----------|------|--------|---------|-------|----------|
| 4 | AI Models | 3-4w | CONDITIONAL | W1 | W3 |
| 5 | Digital Twin | 2-3w | NO | W2 | W4 |
| 6 | Missing Pages | 1-2w | NO | W1 | W2 |
| 7 | Component Routes | 4h | MEDIUM | W1 | W1 |
| 8 | Monitoring | 1-2w | YES | W1 | W3 |
| 9 | CI/CD Pipeline | 1-2w | YES | W1 | W2 |
| 10 | Security Testing | 2-3w | YES | W1 | W4 |
| 11 | GDPR Compliance | 2-3w | YES | W1 | W4 |

---

**Total Timeline: 4-5 weeks to complete all HIGH PRIORITY items**  
**Status: Ready for Implementation**

