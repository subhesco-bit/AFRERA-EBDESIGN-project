# Universal Interconnection Protocol (UIP)

## Overview

The Universal Interconnection Protocol (UIP) provides standardized "cable-like" connections between modules in the EBDESIGN system. Similar to how you connect peripherals to a computer (printer, WiFi router, etc.), modules can be connected via different types of cables for different purposes.

## Cable Types

### 1. Data Cable
- **Purpose**: Data flow between modules
- **Direction**: Bidirectional
- **Protocol**: TCP-based with JSON payload
- **Bandwidth**: High
- **Latency**: Low
- **Use Cases**: Data synchronization, bulk data transfer

### 2. Event Cable
- **Purpose**: Event-driven communication
- **Direction**: Unidirectional (pub/sub)
- **Protocol**: WebSocket-based with event streaming
- **Bandwidth**: Low
- **Latency**: Very Low
- **Use Cases**: Notifications, triggers, real-time updates

### 3. AI Cable
- **Purpose**: AI intelligence sharing
- **Direction**: Bidirectional
- **Protocol**: Secure WebSocket with encrypted AI context
- **Bandwidth**: Medium
- **Latency**: Low
- **Use Cases**: AI coordination, context sharing, decision sync

### 4. Config Cable
- **Purpose**: Configuration synchronization
- **Direction**: Bidirectional
- **Protocol**: REST-based with config validation
- **Bandwidth**: Low
- **Latency**: Medium
- **Use Cases**: Config updates, setting sync, validation

### 5. Security Cable
- **Purpose**: Security context propagation
- **Direction**: Unidirectional (from security module)
- **Protocol**: Secure REST with JWT tokens
- **Bandwidth**: Low
- **Latency**: Low
- **Use Cases**: Auth propagation, permission sync, security events

## Cable Specification

### Cable Definition
```json
{
  "cableId": "CABLE_USER_TO_ORGANIZATION",
  "sourceModule": "M002_USER_MANAGEMENT",
  "targetModule": "M003_ORGANIZATION",
  "type": "data",
  "protocol": "uip-v1",
  "status": "connected|disconnected|pending|error",
  "bandwidth": "high|medium|low",
  "latency": "low|medium|high",
  "encryption": true,
  "compression": true,
  "circuitBreaker": true,
  "retryPolicy": {
    "maxRetries": 3,
    "backoff": "exponential",
    "initialDelay": 1000
  },
  "qos": {
    "guaranteedDelivery": true,
    "ordering": false,
    "deduplication": true
  },
  "monitoring": {
    "enabled": true,
    "metrics": ["throughput", "latency", "errors"],
    "alerting": true
  }
}
```

## Cable Management

### Create Cable Connection
```javascript
POST /api/v1/uip/cables
{
  "sourceModule": "M002_USER_MANAGEMENT",
  "targetModule": "M003_ORGANIZATION",
  "type": "data",
  "options": {
    "encryption": true,
    "circuitBreaker": true
  }
}
```

### Disconnect Cable
```javascript
DELETE /api/v1/uip/cables/{cableId}
```

### Get Cable Status
```javascript
GET /api/v1/uip/cables/{cableId}/status
```

### List All Cables
```javascript
GET /api/v1/uip/cables
```

## Cable Communication

### Send Data via Cable
```javascript
POST /api/v1/uip/cables/{cableId}/send
{
  "data": {},
  "metadata": {},
  "priority": "normal|high|urgent"
}
```

### Receive Data from Cable
```javascript
// Data is received via WebSocket or callback
{
  "cableId": "CABLE_USER_TO_ORGANIZATION",
  "data": {},
  "metadata": {},
  "timestamp": "2026-08-24T20:00:00Z"
}
```

## Circuit Breaker Pattern

The UIP system implements a circuit breaker pattern to prevent cascading failures:

### States
- **Closed**: Normal operation, requests pass through
- **Open**: Circuit is open, requests fail fast
- **Half-Open**: Testing if the system has recovered

### Configuration
```json
{
  "circuitBreaker": {
    "enabled": true,
    "failureThreshold": 5,
    "successThreshold": 2,
    "timeout": 60000,
    "halfOpenMaxCalls": 3
  }
}
```

## Quality of Service (QoS)

### Guaranteed Delivery
- Ensures data reaches destination
- Uses acknowledgments and retries
- Persistent queue for failed messages

### Ordering
- Optional message ordering
- Sequence numbers for tracking
- Reordering at destination

### Deduplication
- Prevents duplicate messages
- Based on message IDs
- Time-based deduplication window

## Monitoring and Metrics

### Cable Metrics
- **Throughput**: Messages per second
- **Latency**: End-to-end delay
- **Error Rate**: Failed messages percentage
- **Queue Depth**: Pending messages count

### Health Monitoring
- Cable connection status
- Dependency health
- Performance degradation alerts

## Security

### Encryption
- All cables support TLS encryption
- AI cables use additional encryption layers
- Configurable encryption levels

### Authentication
- Mutual TLS for inter-module communication
- JWT-based authentication for API access
- Role-based access control

### Authorization
- Cable-level permissions
- Data-level access control
- Audit logging

## Error Handling

### Retry Policy
- Configurable retry attempts
- Exponential backoff
- Dead letter queue for failed messages

### Error Types
- **Connection Errors**: Network issues
- **Protocol Errors**: Invalid messages
- **Business Errors**: Logic failures
- **Timeout Errors**: Response delays

## Best Practices

1. **Use appropriate cable types** for different communication needs
2. **Enable circuit breakers** for critical connections
3. **Monitor cable health** and performance
4. **Implement proper error handling** and retries
5. **Use encryption** for sensitive data
6. **Configure QoS** based on requirements
7. **Test cable connections** before production

## Cable Templates

### Standard Data Cable
```json
{
  "type": "data",
  "bandwidth": "high",
  "latency": "low",
  "encryption": true,
  "circuitBreaker": true,
  "qos": {
    "guaranteedDelivery": true,
    "ordering": false,
    "deduplication": true
  }
}
```

### Real-time Event Cable
```json
{
  "type": "event",
  "bandwidth": "low",
  "latency": "very-low",
  "encryption": false,
  "circuitBreaker": false,
  "qos": {
    "guaranteedDelivery": false,
    "ordering": true,
    "deduplication": true
  }
}
```

### AI Intelligence Cable
```json
{
  "type": "ai",
  "bandwidth": "medium",
  "latency": "low",
  "encryption": true,
  "circuitBreaker": true,
  "qos": {
    "guaranteedDelivery": true,
    "ordering": false,
    "deduplication": false
  }
}
```

## Integration with Modules

### Module Cable Interface
Each module implements the cable interface:

```javascript
class ModuleService {
  async receiveCableData(cableId, data) {
    // Handle incoming cable data
  }
  
  async sendCableData(cableId, data) {
    // Send data via cable
  }
  
  getCableConfigurations() {
    // Return cable configurations
  }
}
```

### Cable Discovery
Modules automatically discover available cables through the registry:

```javascript
const cables = await uipSystem.getModuleCables('M002_USER_MANAGEMENT');
// Returns all cables connected to this module
```

## Troubleshooting

### Common Issues

1. **Cable Connection Failed**
   - Check if both modules are running
   - Verify cable configuration
   - Check network connectivity

2. **High Latency**
   - Monitor bandwidth usage
   - Check for network congestion
   - Consider cable type upgrade

3. **Message Loss**
   - Verify QoS settings
   - Check retry policy
   - Monitor error rates

4. **Circuit Breaker Tripping**
   - Check target module health
   - Review failure thresholds
   - Analyze error patterns

---

*The Universal Interconnection Protocol provides reliable, scalable, and secure communication between modules, following the plug-and-play philosophy of the EBDESIGN modular system.*