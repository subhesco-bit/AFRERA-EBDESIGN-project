# EBDESIGN Platform - API Documentation

## Overview
Complete REST API for EBDESIGN Platform with 628 endpoints covering all 314 modules.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

## Module Endpoints (M031-M344)

### Base Pattern
```
POST   /m{moduleNum}/           Create item
GET    /m{moduleNum}/{id}       Get item
PUT    /m{moduleNum}/{id}       Update item
DELETE /m{moduleNum}/{id}       Delete item
GET    /m{moduleNum}/           List items
```

### Example: M031 (First Module)
```bash
# Create
POST /api/v1/m31/
{
  "name": "Item Name",
  "description": "Item Description"
}

# Read
GET /api/v1/m31/123

# Update
PUT /api/v1/m31/123
{
  "name": "Updated Name"
}

# Delete
DELETE /api/v1/m31/123

# List
GET /api/v1/m31/
```

## System Endpoints

### Health Check
```
GET /health
```
Response: `{ "status": "operational" }`

### System Statistics
```
GET /api/v1/system/stats
```

### Service Discovery
```
GET /api/v1/system/services
```

### Route Discovery
```
GET /api/v1/system/routes
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-11T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-09-11T00:00:00Z"
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per API key

## Pagination
```
GET /api/v1/m31/?limit=20&offset=0
```

## Filtering
```
GET /api/v1/m31/?status=active&category=supply-chain
```

## All Available Modules (314 Total)

### Tier 2: Supply Chain (M031-M050)
M031, M032, M033, ..., M050

### Tier 3: Agricultural (M051-M100)
M051, M052, M053, ..., M100

### Tier 4: Enterprise (M101-M150)
M101, M102, M103, ..., M150

### Tier 5: Advanced Enterprise (M151-M200)
M151, M152, M153, ..., M200

### Tier 6: Specialized (M201-M344)
M201-M225 (AI/ML)
M226-M250 (IoT/Sensors)
M251-M275 (Blockchain)
M276-M300 (VR/AR)
M301-M320 (Security)
M321-M344 (Data Science)

## Support
For API issues or questions, contact: support@ebdesign.local
