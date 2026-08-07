# Volume 11B: Engineering Platform API Specifications

## Executive Summary

This document provides comprehensive API specifications for all services in the AFRERA Engineering OS, following RESTful principles and OpenAPI 3.0 standards.

## API Overview

### Base URL

- Development: `http://localhost:3001/api/v1/engineering`
- Production: `https://api.afrera.com/api/v1/engineering`

### Authentication

All API endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>

```

### Response Format

All responses follow a consistent format:

```json

{
  "success": true,
  "data": {},
  "message": "Success",
  "errors": null,
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}

```

### Error Format


```json

{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Error description"
    }
  ],
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}

```

### Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Project Service APIs

### Create Project

**Endpoint**: `POST /projects`

**Description**: Create a new engineering project

**Request Body**:

```json

{
  "project_type": "greenhouse",
  "project_subtype": "polyhouse",
  "industry_sector": "agriculture",
  "name": "Tomato Polyhouse Project",
  "description": "5000 sqm polyhouse for tomato cultivation with climate control",
  "location": {
    "address": "Village X, District Y, State Z",
    "latitude": 26.1234,
    "longitude": 91.5678,
    "pincode": "781001",
    "state": "Assam",
    "district": "Kamrup"
  },
  "capacity": 5000,
  "capacity_unit": "sqm",
  "budget": 2500000,
  "currency": "INR",
  "timeline": 12,
  "tags": ["polyhouse", "tomato", "climate-control"],
  "priority": "normal"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_number": "ENG-2024-0001",
    "user_id": "uuid",
    "project_type": "greenhouse",
    "project_subtype": "polyhouse",
    "industry_sector": "agriculture",
    "name": "Tomato Polyhouse Project",
    "description": "5000 sqm polyhouse for tomato cultivation with climate control",
    "location": {
      "address": "Village X, District Y, State Z",
      "latitude": 26.1234,
      "longitude": 91.5678,
      "pincode": "781001",
      "state": "Assam",
      "district": "Kamrup"
    },
    "capacity": 5000,
    "capacity_unit": "sqm",
    "budget": 2500000,
    "currency": "INR",
    "timeline": 12,
    "status": "created",
    "phase": "requirement",
    "phase_progress": 0,
    "tags": ["polyhouse", "tomato", "climate-control"],
    "priority": "normal",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Project created successfully"
}

```

### List Projects

**Endpoint**: `GET /projects`

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page
- `status` (string) - Filter by status
- `project_type` (string) - Filter by project type
- `phase` (string) - Filter by phase
- `search` (string) - Search in name/description

**Response**:

```json

{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "project_number": "ENG-2024-0001",
        "name": "Tomato Polyhouse Project",
        "project_type": "greenhouse",
        "project_subtype": "polyhouse",
        "location": {
          "state": "Assam",
          "district": "Kamrup"
        },
        "capacity": 5000,
        "budget": 2500000,
        "status": "design",
        "phase": "structural_analysis",
        "phase_progress": 45,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  },
  "message": "Projects retrieved successfully"
}

```

### Get Project Details

**Endpoint**: `GET /projects/:id`

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_number": "ENG-2024-0001",
    "user_id": "uuid",
    "fpo_id": "uuid",
    "project_type": "greenhouse",
    "project_subtype": "polyhouse",
    "industry_sector": "agriculture",
    "name": "Tomato Polyhouse Project",
    "description": "5000 sqm polyhouse for tomato cultivation with climate control",
    "location": {
      "address": "Village X, District Y, State Z",
      "latitude": 26.1234,
      "longitude": 91.5678,
      "pincode": "781001",
      "state": "Assam",
      "district": "Kamrup"
    },
    "capacity": 5000,
    "capacity_unit": "sqm",
    "budget": 2500000,
    "currency": "INR",
    "timeline": 12,
    "status": "design",
    "phase": "structural_analysis",
    "phase_progress": 45,
    "team_members": [
      {
        "user_id": "uuid",
        "name": "John Doe",
        "role": "consultant",
        "permissions": ["read", "write", "approve"]
      }
    ],
    "permissions": {
      "read": true,
      "write": true,
      "delete": false,
      "approve": false
    },
    "tags": ["polyhouse", "tomato", "climate-control"],
    "priority": "normal",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  },
  "message": "Project details retrieved successfully"
}

```

### Update Project

**Endpoint**: `PUT /projects/:id`

**Request Body**:

```json

{
  "name": "Updated Project Name",
  "description": "Updated description",
  "budget": 3000000,
  "timeline": 15,
  "phase": "cost_estimation",
  "priority": "high"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_number": "ENG-2024-0001",
    "name": "Updated Project Name",
    "description": "Updated description",
    "budget": 3000000,
    "timeline": 15,
    "phase": "cost_estimation",
    "priority": "high",
    "updated_at": "2024-01-20T15:00:00Z"
  },
  "message": "Project updated successfully"
}

```

### Delete Project

**Endpoint**: `DELETE /projects/:id`

**Response**:

```json

{
  "success": true,
  "data": null,
  "message": "Project deleted successfully"
}

```

### Add Team Member

**Endpoint**: `POST /projects/:id/team`

**Request Body**:

```json

{
  "user_id": "uuid",
  "role": "consultant",
  "permissions": ["read", "write"]
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "user_id": "uuid",
    "name": "Jane Smith",
    "role": "consultant",
    "permissions": ["read", "write"],
    "added_at": "2024-01-20T15:30:00Z"
  },
  "message": "Team member added successfully"
}

```

### Update Project Phase

**Endpoint**: `PUT /projects/:id/phase`

**Request Body**:

```json

{
  "phase": "structural_analysis",
  "phase_progress": 50
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "phase": "structural_analysis",
    "phase_progress": 50,
    "updated_at": "2024-01-20T16:00:00Z"
  },
  "message": "Project phase updated successfully"
}

```

### Get Project History

**Endpoint**: `GET /projects/:id/history`

**Query Parameters**:
- `limit` (integer, default: 50) - Number of records
- `offset` (integer, default: 0) - Offset for pagination

**Response**:

```json

{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid",
        "action": "phase_changed",
        "entity_type": "project",
        "old_values": {
          "phase": "design",
          "phase_progress": 45
        },
        "new_values": {
          "phase": "structural_analysis",
          "phase_progress": 50
        },
        "user_id": "uuid",
        "user_name": "John Doe",
        "timestamp": "2024-01-20T16:00:00Z"
      }
    ],
    "total": 120
  },
  "message": "Project history retrieved successfully"
}

```

---

## Design Service APIs

### Create Design Document

**Endpoint**: `POST /projects/:id/designs`

**Request Body**:

```json

{
  "document_type": "layout",
  "document_name": "Greenhouse Layout Design",
  "version": "1.0",
  "description": "Initial layout design for 5000 sqm polyhouse",
  "file_url": "https://s3.../design.dwg",
  "file_size": 2048576,
  "file_format": "dwg",
  "file_hash": "sha256_hash",
  "metadata": {
    "author": "John Doe",
    "software": "AutoCAD",
    "date": "2024-01-15"
  },
  "design_parameters": {
    "area": 5000,
    "crop_type": "tomato",
    "automation_level": "high",
    "climate_control": true
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "document_type": "layout",
    "document_name": "Greenhouse Layout Design",
    "version": "1.0",
    "description": "Initial layout design for 5000 sqm polyhouse",
    "file_url": "https://s3.../design.dwg",
    "file_size": 2048576,
    "file_format": "dwg",
    "file_hash": "sha256_hash",
    "metadata": {
      "author": "John Doe",
      "software": "AutoCAD",
      "date": "2024-01-15"
    },
    "design_parameters": {
      "area": 5000,
      "crop_type": "tomato",
      "automation_level": "high",
      "climate_control": true
    },
    "status": "draft",
    "uploaded_by": "uuid",
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "Design document created successfully"
}

```

### List Design Documents

**Endpoint**: `GET /projects/:id/designs`

**Query Parameters**:
- `document_type` (string) - Filter by document type
- `status` (string) - Filter by status
- `version` (string) - Filter by version

**Response**:

```json

{
  "success": true,
  "data": {
    "designs": [
      {
        "id": "uuid",
        "document_type": "layout",
        "document_name": "Greenhouse Layout Design",
        "version": "1.0",
        "status": "draft",
        "file_format": "dwg",
        "created_at": "2024-01-15T11:00:00Z"
      }
    ],
    "total": 5
  },
  "message": "Design documents retrieved successfully"
}

```

### Get Design Document

**Endpoint**: `GET /designs/:id`

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "document_type": "layout",
    "document_name": "Greenhouse Layout Design",
    "version": "1.0",
    "description": "Initial layout design for 5000 sqm polyhouse",
    "file_url": "https://s3.../design.dwg",
    "file_size": 2048576,
    "file_format": "dwg",
    "file_hash": "sha256_hash",
    "metadata": {
      "author": "John Doe",
      "software": "AutoCAD",
      "date": "2024-01-15"
    },
    "design_parameters": {
      "area": 5000,
      "crop_type": "tomato",
      "automation_level": "high",
      "climate_control": true
    },
    "design_results": null,
    "status": "draft",
    "uploaded_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "reviewed_by": null,
    "reviewed_at": null,
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "Design document retrieved successfully"
}

```

### Generate AI Design

**Endpoint**: `POST /designs/:id/generate`

**Request Body**:

```json

{
  "design_type": "layout",
  "parameters": {
    "area": 5000,
    "crop_type": "tomato",
    "automation_level": "high",
    "climate_control": true,
    "optimization_criteria": ["cost", "efficiency", "space_utilization"]
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "design_id": "uuid",
    "status": "processing",
    "estimated_time": 300,
    "job_id": "uuid",
    "created_at": "2024-01-15T11:30:00Z"
  },
  "message": "AI design generation started"
}

```

### Get Design Generation Status

**Endpoint**: `GET /designs/:id/generation-status`

**Response**:

```json

{
  "success": true,
  "data": {
    "design_id": "uuid",
    "status": "completed",
    "progress": 100,
    "result": {
      "layout": {
        "zones": [
          {
            "id": "zone_1",
            "type": "production",
            "area": 4000,
            "position": {"x": 0, "y": 0}
          }
        ],
        "dimensions": {
          "length": 100,
          "width": 50,
          "height": 4
        }
      },
      "equipment_placement": [
        {
          "equipment": "ventilation_fan",
          "position": {"x": 10, "y": 25},
          "quantity": 4
        }
      ],
      "optimization_score": 0.92
    },
    "processing_time": 285,
    "completed_at": "2024-01-15T11:35:00Z"
  },
  "message": "Design generation completed successfully"
}

```

### Approve Design

**Endpoint**: `POST /designs/:id/approve`

**Request Body**:

```json

{
  "approval_notes": "Design meets all requirements. Approved for next phase."
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "reviewed_by": {
      "id": "uuid",
      "name": "Jane Smith"
    },
    "reviewed_at": "2024-01-15T12:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z"
  },
  "message": "Design approved successfully"
}

```

### Review Design

**Endpoint**: `POST /designs/:id/review`

**Request Body**:

```json

{
  "review_status": "approved_with_changes",
  "review_comments": "Design is good but needs minor adjustments in zone layout.",
  "required_changes": [
    "Adjust zone 2 dimensions",
    "Add emergency exit in zone 3"
  ]
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "review",
    "reviewed_by": {
      "id": "uuid",
      "name": "Jane Smith"
    },
    "reviewed_at": "2024-01-15T12:30:00Z",
    "updated_at": "2024-01-15T12:30:00Z"
  },
  "message": "Design review submitted successfully"
}

```

### Get Design Versions

**Endpoint**: `GET /designs/:id/versions`

**Response**:

```json

{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "version": "1.0",
        "status": "approved",
        "created_at": "2024-01-15T11:00:00Z",
        "created_by": "John Doe"
      },
      {
        "id": "uuid",
        "version": "1.1",
        "status": "draft",
        "created_at": "2024-01-16T10:00:00Z",
        "created_by": "John Doe"
      }
    ],
    "total": 2
  },
  "message": "Design versions retrieved successfully"
}

```

---

## Analysis Service APIs

### Create Analysis

**Endpoint**: `POST /projects/:id/analysis`

**Request Body**:

```json

{
  "analysis_type": "structural",
  "analysis_subtype": "beam_optimization",
  "design_id": "uuid",
  "input_parameters": {
    "span": 6,
    "load": 5,
    "material": "concrete",
    "code": "IS_456",
    "support_conditions": "fixed"
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "design_id": "uuid",
    "analysis_type": "structural",
    "analysis_subtype": "beam_optimization",
    "analysis_version": "1.0",
    "input_parameters": {
      "span": 6,
      "load": 5,
      "material": "concrete",
      "code": "IS_456",
      "support_conditions": "fixed"
    },
    "processing_status": "pending",
    "job_id": "uuid",
    "created_by": "uuid",
    "created_at": "2024-01-15T13:00:00Z"
  },
  "message": "Analysis created successfully"
}

```

### List Analyses

**Endpoint**: `GET /projects/:id/analysis`

**Query Parameters**:
- `analysis_type` (string) - Filter by analysis type
- `status` (string) - Filter by status

**Response**:

```json

{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "uuid",
        "analysis_type": "structural",
        "analysis_subtype": "beam_optimization",
        "processing_status": "completed",
        "created_at": "2024-01-15T13:00:00Z"
      }
    ],
    "total": 10
  },
  "message": "Analyses retrieved successfully"
}

```

### Get Analysis Details

**Endpoint**: `GET /analysis/:id`

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "design_id": "uuid",
    "analysis_type": "structural",
    "analysis_subtype": "beam_optimization",
    "analysis_version": "1.0",
    "input_parameters": {
      "span": 6,
      "load": 5,
      "material": "concrete",
      "code": "IS_456",
      "support_conditions": "fixed"
    },
    "output_results": {
      "beam_size": "300x600mm",
      "reinforcement": {
        "top": "4-16mm",
        "bottom": "4-20mm",
        "stirrups": "8mm@150mm c/c"
      },
      "deflection": "5.2mm",
      "stress_ratio": 0.85,
      "code_compliance": true
    },
    "confidence_score": 0.95,
    "accuracy_score": 0.92,
    "processing_time": 45,
    "processing_status": "completed",
    "ai_model_used": "structural-ai-v2",
    "model_version": "2.1.0",
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "created_at": "2024-01-15T13:00:00Z",
    "completed_at": "2024-01-15T13:00:45Z"
  },
  "message": "Analysis details retrieved successfully"
}

```

### Rerun Analysis

**Endpoint**: `POST /analysis/:id/rerun`

**Request Body**:

```json

{
  "input_parameters": {
    "span": 8,
    "load": 6,
    "material": "concrete",
    "code": "IS_456",
    "support_conditions": "fixed"
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "processing_status": "processing",
    "job_id": "uuid",
    "updated_at": "2024-01-15T14:00:00Z"
  },
  "message": "Analysis rerun started"
}

```

### Get Analysis Results

**Endpoint**: `GET /analysis/:id/results`

**Response**:

```json

{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "results": {
      "beam_size": "300x600mm",
      "reinforcement": {
        "top": "4-16mm",
        "bottom": "4-20mm",
        "stirrups": "8mm@150mm c/c"
      },
      "deflection": "5.2mm",
      "stress_ratio": 0.85,
      "code_compliance": true,
      "load_summary": {
        "dead_load": 2.5,
        "live_load": 2.5,
        "total_load": 5.0
      },
      "material_quantities": {
        "concrete": "0.18 cum",
        "steel": "45 kg"
      }
    },
    "visualizations": {
      "bending_moment_diagram": "url",
      "shear_force_diagram": "url",
      "deflection_curve": "url"
    }
  },
  "message": "Analysis results retrieved successfully"
}

```

### Compare Analyses

**Endpoint**: `GET /analysis/:id/compare`

**Query Parameters**:
- `compare_with` (string, required) - Analysis ID to compare with

**Response**:

```json

{
  "success": true,
  "data": {
    "analysis_1": {
      "id": "uuid",
      "input_parameters": {...},
      "output_results": {...}
    },
    "analysis_2": {
      "id": "uuid",
      "input_parameters": {...},
      "output_results": {...}
    },
    "comparison": {
      "beam_size": {
        "analysis_1": "300x600mm",
        "analysis_2": "350x650mm",
        "difference": "+16.7%"
      },
      "deflection": {
        "analysis_1": "5.2mm",
        "analysis_2": "4.8mm",
        "difference": "-7.7%"
      },
      "material_cost": {
        "analysis_1": 5000,
        "analysis_2": 5500,
        "difference": "+10%"
      }
    }
  },
  "message": "Analysis comparison completed successfully"
}

```

---

## BOQ Service APIs

### Generate BOQ

**Endpoint**: `POST /projects/:id/boq`

**Request Body**:

```json

{
  "design_id": "uuid",
  "boq_type": "detailed",
  "include_contingency": true,
  "region": "assam"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "boq_id": "uuid",
    "project_id": "uuid",
    "design_id": "uuid",
    "status": "processing",
    "job_id": "uuid",
    "created_at": "2024-01-15T15:00:00Z"
  },
  "message": "BOQ generation started"
}

```

### Get BOQ

**Endpoint**: `GET /projects/:id/boq`

**Response**:

```json

{
  "success": true,
  "data": {
    "boq_id": "uuid",
    "project_id": "uuid",
    "version": "1.0",
    "status": "completed",
    "items": [
      {
        "id": "uuid",
        "category": "structural",
        "subcategory": "steel",
        "item_code": "STR-001",
        "description": "Steel columns 200x200mm",
        "specifications": {
          "grade": "Fe500",
          "length": "6m"
        },
        "unit": "nos",
        "quantity": 50,
        "unit_rate": 5000,
        "total_amount": 250000,
        "source_type": "marketplace",
        "vendor_id": null,
        "marketplace_product_id": "uuid"
      }
    ],
    "total_amount": 2500000,
    "contingency_amount": 250000,
    "grand_total": 2750000,
    "created_at": "2024-01-15T15:30:00Z",
    "updated_at": "2024-01-15T15:30:00Z"
  },
  "message": "BOQ retrieved successfully"
}

```

### Add BOQ Item

**Endpoint**: `POST /boq/:boqId/items`

**Request Body**:

```json

{
  "category": "electrical",
  "subcategory": "lighting",
  "item_code": "ELEC-001",
  "description": "LED grow lights 100W",
  "specifications": {
    "power": "100W",
    "spectrum": "full spectrum",
    "coverage": "2 sqm"
  },
  "unit": "nos",
  "quantity": 100,
  "unit_rate": 2500,
  "source_type": "marketplace",
  "marketplace_product_id": "uuid"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "boq_id": "uuid",
    "category": "electrical",
    "subcategory": "lighting",
    "item_code": "ELEC-001",
    "description": "LED grow lights 100W",
    "specifications": {
      "power": "100W",
      "spectrum": "full spectrum",
      "coverage": "2 sqm"
    },
    "unit": "nos",
    "quantity": 100,
    "unit_rate": 2500,
    "total_amount": 250000,
    "source_type": "marketplace",
    "marketplace_product_id": "uuid",
    "created_at": "2024-01-15T16:00:00Z"
  },
  "message": "BOQ item added successfully"
}

```

### Update BOQ Item

**Endpoint**: `PUT /boq/:boqId/items/:itemId`

**Request Body**:

```json

{
  "quantity": 120,
  "unit_rate": 2400
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "quantity": 120,
    "unit_rate": 2400,
    "total_amount": 288000,
    "updated_at": "2024-01-15T16:30:00Z"
  },
  "message": "BOQ item updated successfully"
}

```

### Export BOQ

**Endpoint**: `POST /boq/:boqId/export`

**Request Body**:

```json

{
  "format": "excel",
  "include_summary": true,
  "include_specifications": true
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "export_id": "uuid",
    "download_url": "https://s3.../boq_export.xlsx",
    "format": "excel",
    "file_size": 102400,
    "expires_at": "2024-01-16T16:00:00Z"
  },
  "message": "BOQ export completed successfully"
}

```

---

## Cost Service APIs

### Generate Cost Estimate

**Endpoint**: `POST /projects/:id/cost/estimate`

**Request Body**:

```json

{
  "estimate_type": "detailed",
  "boq_id": "uuid",
  "region": "assam",
  "currency": "INR",
  "include_contingency": true,
  "contingency_percentage": 10
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "estimate_id": "uuid",
    "project_id": "uuid",
    "estimate_type": "detailed",
    "version": "1.0",
    "region": "assam",
    "currency": "INR",
    "total_capex": 2500000,
    "total_opex": 500000,
    "breakdown": {
      "civil_work": {
        "amount": 1000000,
        "percentage": 40
      },
      "structural": {
        "amount": 500000,
        "percentage": 20
      },
      "electrical": {
        "amount": 300000,
        "percentage": 12
      },
      "mechanical": {
        "amount": 400000,
        "percentage": 16
      },
      "automation": {
        "amount": 300000,
        "percentage": 12
      }
    },
    "assumptions": {
      "material_prices": "current_market_rates",
      "labor_rates": "regional_minimum_wage",
      "equipment_rates": "market_average"
    },
    "contingency_percentage": 10,
    "contingency_amount": 250000,
    "inflation_factor": 1.0,
    "created_by": "uuid",
    "created_at": "2024-01-15T17:00:00Z"
  },
  "message": "Cost estimate generated successfully"
}

```

### Get Cost Estimate

**Endpoint**: `GET /projects/:id/cost`

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "estimate_type": "detailed",
    "version": "1.0",
    "region": "assam",
    "currency": "INR",
    "total_capex": 2500000,
    "total_opex": 500000,
    "breakdown": {
      "civil_work": {
        "amount": 1000000,
        "percentage": 40,
        "items": [...]
      },
      "structural": {
        "amount": 500000,
        "percentage": 20,
        "items": [...]
      }
    },
    "assumptions": {
      "material_prices": "current_market_rates",
      "labor_rates": "regional_minimum_wage",
      "equipment_rates": "market_average"
    },
    "contingency_percentage": 10,
    "contingency_amount": 250000,
    "inflation_factor": 1.0,
    "previous_estimate_id": null,
    "variance_percentage": null,
    "variance_reason": null,
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "approved_by": null,
    "approved_at": null,
    "created_at": "2024-01-15T17:00:00Z",
    "updated_at": "2024-01-15T17:00:00Z"
  },
  "message": "Cost estimate retrieved successfully"
}

```

### Get Material Prices

**Endpoint**: `GET /materials/prices`

**Query Parameters**:
- `category` (string) - Filter by category
- `region` (string) - Filter by region
- `search` (string) - Search by name/code

**Response**:

```json

{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "uuid",
        "material_code": "MAT-001",
        "material_name": "Steel TMT Bar",
        "category": "structural",
        "subcategory": "steel",
        "brand": "TATA",
        "grade": "Fe500",
        "unit": "ton",
        "base_price": 55000,
        "currency": "INR",
        "regional_prices": {
          "assam": 56000,
          "maharashtra": 57000
        },
        "supplier": "TATA Steel",
        "availability": "available",
        "lead_time": 7,
        "valid_from": "2024-01-01T00:00:00Z",
        "valid_until": "2024-01-31T23:59:59Z"
      }
    ],
    "total": 100
  },
  "message": "Material prices retrieved successfully"
}

```

### Get Labor Rates

**Endpoint**: `GET /labor/rates`

**Query Parameters**:
- `labor_type` (string) - Filter by labor type
- `skill_category` (string) - Filter by skill category
- `region` (string) - Filter by region

**Response**:

```json

{
  "success": true,
  "data": {
    "labor_rates": [
      {
        "id": "uuid",
        "labor_type": "skilled",
        "skill_category": "mason",
        "region": "assam",
        "daily_rate": 800,
        "hourly_rate": 100,
        "currency": "INR",
        "productivity_factor": 1.0,
        "overtime_multiplier": 1.5,
        "valid_from": "2024-01-01T00:00:00Z",
        "valid_until": "2024-03-31T23:59:59Z"
      }
    ],
    "total": 50
  },
  "message": "Labor rates retrieved successfully"
}

```

### Get Equipment Rates

**Endpoint**: `GET /equipment/rates`

**Query Parameters**:
- `category` (string) - Filter by category
- `region` (string) - Filter by region

**Response**:

```json

{
  "success": true,
  "data": {
    "equipment_rates": [
      {
        "id": "uuid",
        "equipment_code": "EQP-001",
        "equipment_name": "Excavator 20T",
        "category": "earthmoving",
        "subcategory": "excavator",
        "brand": "JCB",
        "model": "3DX",
        "daily_rate": 8000,
        "weekly_rate": 50000,
        "monthly_rate": 150000,
        "currency": "INR",
        "regional_rates": {
          "assam": {
            "daily": 8000,
            "weekly": 50000,
            "monthly": 150000
          }
        },
        "availability": "available",
        "lead_time": 3,
        "valid_from": "2024-01-01T00:00:00Z",
        "valid_until": "2024-01-31T23:59:59Z"
      }
    ],
    "total": 75
  },
  "message": "Equipment rates retrieved successfully"
}

```

---

## Schedule Service APIs

### Create Schedule

**Endpoint**: `POST /projects/:id/schedule`

**Request Body**:

```json

{
  "schedule_type": "cpm",
  "start_date": "2024-02-01",
  "end_date": "2024-12-31",
  "activities": [
    {
      "activity_code": "ACT-001",
      "activity_name": "Site Preparation",
      "duration": 15,
      "predecessors": [],
      "resources": {
        "labor": [{"type": "skilled", "category": "mason", "count": 5}],
        "equipment": [{"type": "excavator", "count": 1}]
      },
      "cost": 150000
    }
  ],
  "milestones": [
    {
      "id": "MIL-001",
      "name": "Foundation Completion",
      "date": "2024-03-15",
      "status": "pending"
    }
  ]
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "schedule_type": "cpm",
    "version": "1.0",
    "activities": [...],
    "milestones": [...],
    "critical_path": ["ACT-001", "ACT-003", "ACT-005"],
    "start_date": "2024-02-01",
    "end_date": "2024-12-31",
    "total_duration": 335,
    "resources": {
      "labor": [...],
      "equipment": [...],
      "materials": [...]
    },
    "created_by": "uuid",
    "created_at": "2024-01-15T18:00:00Z",
    "updated_at": "2024-01-15T18:00:00Z"
  },
  "message": "Schedule created successfully"
}

```

### Get Schedule

**Endpoint**: `GET /projects/:id/schedule`

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "schedule_type": "cpm",
    "version": "1.0",
    "activities": [
      {
        "id": "uuid",
        "activity_code": "ACT-001",
        "activity_name": "Site Preparation",
        "activity_type": "task",
        "duration": 15,
        "start_date": "2024-02-01",
        "end_date": "2024-02-15",
        "predecessors": [],
        "successors": ["ACT-002"],
        "resources": {...},
        "cost": 150000,
        "status": "not_started",
        "progress": 0,
        "is_critical": true,
        "float": 0
      }
    ],
    "milestones": [...],
    "critical_path": ["ACT-001", "ACT-003", "ACT-005"],
    "start_date": "2024-02-01",
    "end_date": "2024-12-31",
    "total_duration": 335,
    "resources": {...},
    "created_at": "2024-01-15T18:00:00Z",
    "updated_at": "2024-01-15T18:00:00Z"
  },
  "message": "Schedule retrieved successfully"
}

```

### Get Gantt Chart Data

**Endpoint**: `GET /schedules/:id/gantt`

**Response**:

```json

{
  "success": true,
  "data": {
    "schedule_id": "uuid",
    "gantt_data": {
      "activities": [
        {
          "id": "uuid",
          "name": "Site Preparation",
          "start": "2024-02-01",
          "end": "2024-02-15",
          "duration": 15,
          "progress": 0,
          "dependencies": [],
          "critical": true,
          "resources": {...}
        }
      ],
      "milestones": [
        {
          "id": "MIL-001",
          "name": "Foundation Completion",
          "date": "2024-03-15",
          "status": "pending"
        }
      ]
    }
  },
  "message": "Gantt chart data retrieved successfully"
}

```

### Get Critical Path

**Endpoint**: `GET /schedules/:id/critical-path`

**Response**:

```json

{
  "success": true,
  "data": {
    "schedule_id": "uuid",
    "critical_path": [
      {
        "activity_id": "uuid",
        "activity_code": "ACT-001",
        "activity_name": "Site Preparation",
        "duration": 15,
        "start_date": "2024-02-01",
        "end_date": "2024-02-15",
        "float": 0
      },
      {
        "activity_id": "uuid",
        "activity_code": "ACT-003",
        "activity_name": "Foundation Construction",
        "duration": 30,
        "start_date": "2024-02-16",
        "end_date": "2024-03-17",
        "float": 0
      }
    ],
    "total_duration": 335,
    "critical_activities_count": 15
  },
  "message": "Critical path retrieved successfully"
}

```

### Optimize Schedule

**Endpoint**: `POST /schedules/:id/optimize`

**Request Body**:

```json

{
  "optimization_criteria": ["cost", "time"],
  "constraints": {
    "max_duration": 300,
    "max_cost": 3000000
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "schedule_id": "uuid",
    "optimized_schedule": {
      "activities": [...],
      "total_duration": 300,
      "total_cost": 2800000,
      "improvements": {
        "time_reduction": 35,
        "cost_reduction": 200000
      }
    },
    "optimization_report": {
      "original_duration": 335,
      "optimized_duration": 300,
      "original_cost": 3000000,
      "optimized_cost": 2800000,
      "recommendations": [
        "Parallelize activities ACT-004 and ACT-005",
        "Use faster equipment for ACT-003"
      ]
    }
  },
  "message": "Schedule optimization completed successfully"
}

```

---

## BIM Service APIs

### Upload BIM Model

**Endpoint**: `POST /projects/:id/bim`

**Request Body** (multipart/form-data):

```
file: [BIM file]
model_name: Greenhouse BIM Model
model_type: architectural
lod_level: 300
software: Revit
software_version: 2023

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "design_id": null,
    "model_name": "Greenhouse BIM Model",
    "model_type": "architectural",
    "lod_level": 300,
    "file_url": "https://s3.../bim_model.rvt",
    "file_format": "rvt",
    "file_size": 52428800,
    "software": "Revit",
    "software_version": "2023",
    "author": "John Doe",
    "elements_count": 1500,
    "surfaces_count": 3200,
    "volume": 20000,
    "status": "draft",
    "uploaded_by": "uuid",
    "created_at": "2024-01-15T19:00:00Z",
    "updated_at": "2024-01-15T19:00:00Z"
  },
  "message": "BIM model uploaded successfully"
}

```

### Get BIM Models

**Endpoint**: `GET /projects/:id/bim`

**Query Parameters**:
- `model_type` (string) - Filter by model type
- `lod_level` (integer) - Filter by LOD level
- `status` (string) - Filter by status

**Response**:

```json

{
  "success": true,
  "data": {
    "models": [
      {
        "id": "uuid",
        "model_name": "Greenhouse BIM Model",
        "model_type": "architectural",
        "lod_level": 300,
        "file_format": "rvt",
        "file_size": 52428800,
        "status": "draft",
        "created_at": "2024-01-15T19:00:00Z"
      }
    ],
    "total": 3
  },
  "message": "BIM models retrieved successfully"
}

```

### Export BIM Model

**Endpoint**: `POST /bim/:id/export`

**Request Body**:

```json

{
  "format": "ifc",
  "include_metadata": true
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "export_id": "uuid",
    "download_url": "https://s3.../bim_export.ifc",
    "format": "ifc",
    "file_size": 15728640,
    "expires_at": "2024-01-16T19:00:00Z"
  },
  "message": "BIM model export completed successfully"
}

```

### Run Clash Detection

**Endpoint**: `GET /bim/:id/clath-detection`

**Response**:

```json

{
  "success": true,
  "data": {
    "bim_id": "uuid",
    "clash_detection_results": {
      "total_clashes": 5,
      "clashes": [
        {
          "id": "CLASH-001",
          "severity": "high",
          "elements": [
            {
              "id": "EL-001",
              "type": "beam",
              "name": "Beam-1"
            },
            {
              "id": "EL-002",
              "type": "duct",
              "name": "HVAC-Duct-1"
            }
          ],
          "location": {
            "x": 10.5,
            "y": 5.2,
            "z": 3.0
          },
          "description": "The beam intersects with HVAC duct"
        }
      ]
    },
    "recommendations": [
      "Relocate HVAC duct CLASH-001",
      "Adjust beam height for CLASH-002"
    ]
  },
  "message": "Clash detection completed successfully"
}

```

### Get BIM Viewer URL

**Endpoint**: `GET /bim/:id/viewer`

**Response**:

```json

{
  "success": true,
  "data": {
    "viewer_url": "https://viewer.afrera.com/bim/uuid",
    "viewer_config": {
      "enable_measurements": true,
      "enable_selection": true,
      "enable_layers": true,
      "default_view": "3d"
    },
    "expires_at": "2024-01-16T20:00:00Z"
  },
  "message": "BIM viewer URL generated successfully"
}

```

---

## CAD Service APIs

### Upload CAD File

**Endpoint**: `POST /projects/:id/cad`

**Request Body** (multipart/form-data):

```
file: [CAD file]
file_name: Greenhouse Layout Plan
drawing_type: architectural
drawing_number: ARCH-001
scale: "1:100"
sheet_size: "A1"

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "design_id": null,
    "file_name": "Greenhouse Layout Plan",
    "drawing_type": "architectural",
    "drawing_number": "ARCH-001",
    "file_url": "https://s3.../drawing.dwg",
    "file_format": "dwg",
    "file_size": 10485760,
    "scale": "1:100",
    "sheet_size": "A1",
    "layers": [
      {
        "name": "WALLS",
        "color": "RED",
        "line_type": "CONTINUOUS"
      }
    ],
    "status": "draft",
    "uploaded_by": "uuid",
    "created_at": "2024-01-15T21:00:00Z",
    "updated_at": "2024-01-15T21:00:00Z"
  },
  "message": "CAD file uploaded successfully"
}

```

### Get CAD Files

**Endpoint**: `GET /projects/:id/cad`

**Query Parameters**:
- `drawing_type` (string) - Filter by drawing type
- `status` (string) - Filter by status

**Response**:

```json

{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "file_name": "Greenhouse Layout Plan",
        "drawing_type": "architectural",
        "drawing_number": "ARCH-001",
        "file_format": "dwg",
        "file_size": 10485760,
        "status": "draft",
        "created_at": "2024-01-15T21:00:00Z"
      }
    ],
    "total": 8
  },
  "message": "CAD files retrieved successfully"
}

```

### Convert CAD File

**Endpoint**: `POST /cad/:id/convert`

**Request Body**:

```json

{
  "target_format": "pdf",
  "include_layers": true,
  "include_attributes": true
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "conversion_id": "uuid",
    "download_url": "https://s3.../drawing.pdf",
    "target_format": "pdf",
    "file_size": 5242880,
    "expires_at": "2024-01-16T21:00:00Z"
  },
  "message": "CAD file conversion completed successfully"
}

```

### Get CAD Layers

**Endpoint**: `GET /cad/:id/layers`

**Response**:

```json

{
  "success": true,
  "data": {
    "cad_id": "uuid",
    "layers": [
      {
        "name": "WALLS",
        "color": "RED",
        "line_type": "CONTINUOUS",
        "line_weight": 0.3,
        "visible": true,
        "locked": false
      },
      {
        "name": "DOORS",
        "color": "BLUE",
        "line_type": "CONTINUOUS",
        "line_weight": 0.2,
        "visible": true,
        "locked": false
      }
    ],
    "total": 15
  },
  "message": "CAD layers retrieved successfully"
}

```

---

## Digital Twin Service APIs

### Register Sensor

**Endpoint**: `POST /projects/:id/digital-twin/sensors`

**Request Body**:

```json

{
  "sensor_id": "TEMP-001",
  "sensor_name": "Zone A Temperature Sensor",
  "sensor_type": "temperature",
  "sensor_category": "environmental",
  "location": {
    "zone": "A",
    "position": "wall",
    "coordinates": {
      "x": 10.5,
      "y": 5.2,
      "z": 2.0
    }
  },
  "manufacturer": "Siemens",
  "model": "SITRANS T",
  "specifications": {
    "range": "-20 to 80°C",
    "accuracy": "±0.5°C",
    "resolution": "0.1°C"
  },
  "sampling_interval": 60,
  "alert_thresholds": {
    "min": 15,
    "max": 35,
    "critical": 40
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "sensor_id": "TEMP-001",
    "sensor_name": "Zone A Temperature Sensor",
    "sensor_type": "temperature",
    "sensor_category": "environmental",
    "location": {
      "zone": "A",
      "position": "wall",
      "coordinates": {
        "x": 10.5,
        "y": 5.2,
        "z": 2.0
      }
    },
    "manufacturer": "Siemens",
    "model": "SITRANS T",
    "specifications": {
      "range": "-20 to 80°C",
      "accuracy": "±0.5°C",
      "resolution": "0.1°C"
    },
    "sampling_interval": 60,
    "alert_thresholds": {
      "min": 15,
      "max": 35,
      "critical": 40
    },
    "status": "active",
    "created_at": "2024-01-15T22:00:00Z",
    "updated_at": "2024-01-15T22:00:00Z"
  },
  "message": "Sensor registered successfully"
}

```

### Get Sensors

**Endpoint**: `GET /projects/:id/digital-twin/sensors`

**Query Parameters**:
- `sensor_type` (string) - Filter by sensor type
- `sensor_category` (string) - Filter by category
- `status` (string) - Filter by status

**Response**:

```json

{
  "success": true,
  "data": {
    "sensors": [
      {
        "id": "uuid",
        "sensor_id": "TEMP-001",
        "sensor_name": "Zone A Temperature Sensor",
        "sensor_type": "temperature",
        "sensor_category": "environmental",
        "location": {
          "zone": "A",
          "position": "wall"
        },
        "status": "active",
        "last_reading_time": "2024-01-15T22:30:00Z"
      }
    ],
    "total": 25
  },
  "message": "Sensors retrieved successfully"
}

```

### Get Sensor Data

**Endpoint**: `GET /digital-twin/sensors/:sensorId/data`

**Query Parameters**:
- `from` (date, required) - Start date
- `to` (date, required) - End date
- `aggregation` (string) - Aggregation method (raw, hourly, daily)
- `limit` (integer) - Maximum number of records

**Response**:

```json

{
  "success": true,
  "data": {
    "sensor_id": "TEMP-001",
    "sensor_name": "Zone A Temperature Sensor",
    "sensor_type": "temperature",
    "data": [
      {
        "timestamp": "2024-01-15T22:00:00Z",
        "value": 22.5,
        "unit": "°C",
        "quality": "good"
      },
      {
        "timestamp": "2024-01-15T22:01:00Z",
        "value": 22.6,
        "unit": "°C",
        "quality": "good"
      }
    ],
    "statistics": {
      "min": 20.5,
      "max": 25.0,
      "average": 22.8,
      "count": 1440
    },
    "from": "2024-01-15T00:00:00Z",
    "to": "2024-01-15T23:59:59Z"
  },
  "message": "Sensor data retrieved successfully"
}

```

### Get Digital Twin Dashboard

**Endpoint**: `GET /projects/:id/digital-twin/dashboard`

**Response**:

```json

{
  "success": true,
  "data": {
    "project_id": "uuid",
    "dashboard": {
      "overview": {
        "total_sensors": 25,
        "active_sensors": 24,
        "inactive_sensors": 1,
        "alerts_today": 3
      },
      "environmental": {
        "temperature": {
          "current": 22.5,
          "min": 20.5,
          "max": 25.0,
          "average": 22.8,
          "unit": "°C"
        },
        "humidity": {
          "current": 65.0,
          "min": 60.0,
          "max": 70.0,
          "average": 65.5,
          "unit": "%"
        },
        "co2": {
          "current": 450,
          "min": 400,
          "max": 500,
          "average": 450,
          "unit": "ppm"
        }
      },
      "energy": {
        "current_consumption": 15.5,
        "daily_consumption": 372,
        "monthly_consumption": 11160,
        "unit": "kWh"
      },
      "alerts": [
        {
          "id": "ALERT-001",
          "sensor_id": "TEMP-005",
          "severity": "warning",
          "message": "Temperature exceeds threshold",
          "timestamp": "2024-01-15T22:30:00Z"
        }
      ]
    },
    "last_updated": "2024-01-15T22:30:00Z"
  },
  "message": "Digital twin dashboard retrieved successfully"
}

```

### Create Alert

**Endpoint**: `POST /projects/:id/digital-twin/alerts`

**Request Body**:

```json

{
  "sensor_id": "TEMP-001",
  "alert_type": "threshold",
  "severity": "warning",
  "message": "Temperature exceeds maximum threshold",
  "threshold_value": 35,
  "actual_value": 36.5
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "alert_id": "uuid",
    "sensor_id": "TEMP-001",
    "alert_type": "threshold",
    "severity": "warning",
    "message": "Temperature exceeds maximum threshold",
    "threshold_value": 35,
    "actual_value": 36.5,
    "created_at": "2024-01-15T22:35:00Z"
  },
  "message": "Alert created successfully"
}

```

---

## DPR Service APIs

### Generate DPR

**Endpoint**: `POST /projects/:id/dpr`

**Request Body**:

```json

{
  "dpr_type": "bank",
  "dpr_purpose": "loan",
  "target_institution": "State Bank of India",
  "loan_amount": 2000000,
  "include_subsidy": true,
  "include_technical": true,
  "include_financial": true
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "dpr_id": "uuid",
    "project_id": "uuid",
    "dpr_type": "bank",
    "dpr_purpose": "loan",
    "document_name": "DPR - Tomata Polyhouse Project",
    "status": "processing",
    "job_id": "uuid",
    "created_by": "uuid",
    "created_at": "2024-01-15T23:00:00Z"
  },
  "message": "DPR generation started"
}

```

### Get DPR

**Endpoint**: `GET /projects/:id/dpr`

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "dpr_type": "bank",
    "dpr_purpose": "loan",
    "document_name": "DPR - Tomato Polyhouse Project",
    "document_url": "https://s3.../dpr.pdf",
    "file_format": "pdf",
    "file_size": 5242880,
    "total_project_cost": 2500000,
    "subsidy_amount": 500000,
    "loan_amount": 2000000,
    "own_contribution": 0,
    "target_institution": "State Bank of India",
    "submission_status": "draft",
    "financial_summary": {
      "total_project_cost": 2500000,
      "subsidy_amount": 500000,
      "loan_amount": 2000000,
      "own_contribution": 0,
      "irr": 18.5,
      "npv": 1500000,
      "payback_period": 5.2,
      "dscr": 1.45
    },
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "submitted_by": null,
    "submitted_at": null,
    "created_at": "2024-01-15T23:00:00Z",
    "updated_at": "2024-01-15T23:30:00Z"
  },
  "message": "DPR retrieved successfully"
}

```

### Download DPR

**Endpoint**: `GET /dpr/:id/download`

**Response**: Binary file download (PDF)

### Submit DPR

**Endpoint**: `POST /dpr/:id/submit`

**Request Body**:

```json

{
  "submission_notes": "DPR submitted for loan approval"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "submission_status": "submitted",
    "submitted_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "submitted_at": "2024-01-15T23:45:00Z",
    "updated_at": "2024-01-15T23:45:00Z"
  },
  "message": "DPR submitted successfully"
}

```

---

## Subsidy Service APIs

### Check Subsidy Eligibility

**Endpoint**: `POST /projects/:id/subsidy/check`

**Request Body**:

```json

{
  "project_type": "greenhouse",
  "project_subtype": "polyhouse",
  "location": {
    "state": "Assam",
    "district": "Kamrup"
  },
  "capacity": 5000,
  "budget": 2500000,
  "applicant_type": "individual"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "project_id": "uuid",
    "eligible_schemes": [
      {
        "scheme_code": "PMMSY",
        "scheme_name": "Pradhan Mantri Matsya Sampada Yojana",
        "subsidy_percentage": 40,
        "max_subsidy_amount": 1000000,
        "estimated_subsidy": 1000000,
        "eligibility_status": "eligible",
        "requirements": [
          "Project must be in eligible district",
          "Minimum capacity: 1000 sqm",
          "Applicant must be registered fish farmer"
        ]
      },
      {
        "scheme_code": "MIDH",
        "scheme_name": "Mission for Integrated Development of Horticulture",
        "subsidy_percentage": 50,
        "max_subsidy_amount": 1250000,
        "estimated_subsidy": 1250000,
        "eligibility_status": "eligible",
        "requirements": [
          "Project must be in horticulture sector",
          "Minimum area: 2000 sqm",
          "Applicant must have land ownership"
        ]
      }
    ],
    "total_estimated_subsidy": 2250000,
    "recommended_scheme": "MIDH",
    "checked_at": "2024-01-16T00:00:00Z"
  },
  "message": "Subsidy eligibility check completed successfully"
}

```

### Get Applicable Schemes

**Endpoint**: `GET /projects/:id/subsidy/schemes`

**Response**:

```json

{
  "success": true,
  "data": {
    "schemes": [
      {
        "scheme_code": "PMMSY",
        "scheme_name": "Pradhan Mantri Matsya Sampada Yojana",
        "ministry": "Ministry of Fisheries, Animal Husbandry and Dairying",
        "description": "Scheme for development of fisheries infrastructure",
        "subsidy_percentage": 40,
        "max_subsidy_amount": 1000000,
        "eligible_project_types": ["cold_storage", "ice_plant", "hatchery"],
        "eligible_states": ["Assam", "West Bengal", "Odisha"],
        "application_deadline": "2024-03-31",
        "processing_time": "45-60 days"
      }
    ],
    "total": 5
  },
  "message": "Applicable schemes retrieved successfully"
}

```

### Apply for Subsidy

**Endpoint**: `POST /projects/:id/subsidy/apply`

**Request Body**:

```json

{
  "scheme_code": "MIDH",
  "application_type": "new",
  "documents": [
    {
      "document_type": "land_record",
      "document_url": "https://s3.../land_record.pdf"
    },
    {
      "document_type": "project_report",
      "document_url": "https://s3.../project_report.pdf"
    }
  ],
  "declaration": "I declare that all information provided is true and correct"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "application_id": "uuid",
    "project_id": "uuid",
    "scheme_code": "MIDH",
    "application_number": "SUB-2024-0001",
    "application_type": "new",
    "status": "submitted",
    "submitted_at": "2024-01-16T00:30:00Z",
    "estimated_processing_time": "45-60 days"
  },
  "message": "Subsidy application submitted successfully"
}

```

### Get Application Status

**Endpoint**: `GET /subsidy/applications/:applicationId`

**Response**:

```json

{
  "success": true,
  "data": {
    "application_id": "uuid",
    "application_number": "SUB-2024-0001",
    "project_id": "uuid",
    "scheme_code": "MIDH",
    "scheme_name": "Mission for Integrated Development of Horticulture",
    "status": "under_review",
    "current_stage": "document_verification",
    "stages": [
      {
        "stage": "document_verification",
        "status": "in_progress",
        "completed_at": null
      },
      {
        "stage": "field_inspection",
        "status": "pending",
        "completed_at": null
      },
      {
        "stage": "technical_approval",
        "status": "pending",
        "completed_at": null
      },
      {
        "stage": "sanction",
        "status": "pending",
        "completed_at": null
      }
    ],
    "submitted_at": "2024-01-16T00:30:00Z",
    "last_updated": "2024-01-20T10:00:00Z",
    "estimated_completion": "2024-03-15T00:00:00Z"
  },
  "message": "Application status retrieved successfully"
}

```

---

## Tender Service APIs

### Create Tender

**Endpoint**: `POST /projects/:id/tenders`

**Request Body**:

```json

{
  "tender_name": "Greenhouse Construction Tender",
  "tender_type": "open",
  "work_description": "Construction of 5000 sqm polyhouse with climate control system",
  "estimated_cost": 2500000,
  "bid_security_amount": 250000,
  "bid_submission_deadline": "2024-02-15T17:00:00Z",
  "bid_opening_date": "2024-02-16T10:00:00Z",
  "estimated_start_date": "2024-03-01",
  "estimated_completion_date": "2024-12-31"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "tender_number": "TEN-2024-0001",
    "tender_name": "Greenhouse Construction Tender",
    "tender_type": "open",
    "work_description": "Construction of 5000 sqm polyhouse with climate control system",
    "estimated_cost": 2500000,
    "bid_security_amount": 250000,
    "bid_submission_deadline": "2024-02-15T17:00:00Z",
    "bid_opening_date": "2024-02-16T10:00:00Z",
    "estimated_start_date": "2024-03-01",
    "estimated_completion_date": "2024-12-31",
    "status": "draft",
    "created_by": "uuid",
    "created_at": "2024-01-16T01:00:00Z",
    "updated_at": "2024-01-16T01:00:00Z"
  },
  "message": "Tender created successfully"
}

```

### Get Tenders

**Endpoint**: `GET /projects/:id/tenders`

**Response**:

```json

{
  "success": true,
  "data": {
    "tenders": [
      {
        "id": "uuid",
        "tender_number": "TEN-2024-0001",
        "tender_name": "Greenhouse Construction Tender",
        "tender_type": "open",
        "estimated_cost": 2500000,
        "bid_submission_deadline": "2024-02-15T17:00:00Z",
        "status": "published",
        "created_at": "2024-01-16T01:00:00Z"
      }
    ],
    "total": 2
  },
  "message": "Tenders retrieved successfully"
}

```

### Submit Bid

**Endpoint**: `POST /tenders/:tenderId/bids`

**Request Body**:

```json

{
  "bidder_name": "ABC Construction Pvt Ltd",
  "bidder_company": "ABC Construction Pvt Ltd",
  "bid_amount": 2400000,
  "bid_security_amount": 240000,
  "technical_proposal": {
    "experience": "10 years",
    "similar_projects": 5,
    "team_size": 25
  },
  "bid_documents": [
    {
      "document_name": "Technical Proposal",
      "document_url": "https://s3.../technical_proposal.pdf"
    },
    {
      "document_name": "Financial Proposal",
      "document_url": "https://s3.../financial_proposal.pdf"
    }
  ]
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "tender_id": "uuid",
    "bidder_id": "uuid",
    "bidder_name": "ABC Construction Pvt Ltd",
    "bidder_company": "ABC Construction Pvt Ltd",
    "bid_amount": 2400000,
    "bid_security_amount": 240000,
    "technical_score": null,
    "commercial_score": null,
    "total_score": null,
    "status": "submitted",
    "submitted_at": "2024-01-16T01:30:00Z",
    "created_at": "2024-01-16T01:30:00Z",
    "updated_at": "2024-01-16T01:30:00Z"
  },
  "message": "Bid submitted successfully"
}

```

### Evaluate Bids

**Endpoint**: `POST /tenders/:tenderId/evaluate`

**Request Body**:

```json

{
  "evaluation_criteria": {
    "technical_weight": 0.4,
    "commercial_weight": 0.6
  },
  "evaluation_notes": "Evaluation based on technical capability and commercial competitiveness"
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "tender_id": "uuid",
    "evaluation_results": [
      {
        "bid_id": "uuid",
        "bidder_name": "ABC Construction Pvt Ltd",
        "bid_amount": 2400000,
        "technical_score": 85,
        "commercial_score": 90,
        "total_score": 88,
        "rank": 1,
        "status": "qualified"
      },
      {
        "bid_id": "uuid",
        "bidder_name": "XYZ Infrastructure Ltd",
        "bid_amount": 2450000,
        "technical_score": 80,
        "commercial_score": 85,
        "total_score": 83,
        "rank": 2,
        "status": "qualified"
      }
    ],
    "recommended_bidder": {
      "bid_id": "uuid",
      "bidder_name": "ABC Construction Pvt Ltd",
      "total_score": 88,
      "rank": 1
    },
    "evaluated_by": "uuid",
    "evaluated_at": "2024-01-16T02:00:00Z"
  },
  "message": "Bid evaluation completed successfully"
}

```

---

## Construction Service APIs

### Report Progress

**Endpoint**: `POST /projects/:id/construction/progress`

**Request Body**:

```json

{
  "report_date": "2024-01-16",
  "schedule_activity_id": "uuid",
  "progress_percentage": 75,
  "status": "on_track",
  "work_completed": "Foundation work completed 75%. Concrete pouring in progress.",
  "issues_encountered": "Minor delay due to rain",
  "mitigation_plan": "Additional manpower allocated to recover delay",
  "labor_on_site": 15,
  "equipment_on_site": [
    {
      "type": "excavator",
      "count": 1
    },
    {
      "type": "concrete_mixer",
      "count": 2
    }
  ],
  "materials_consumed": [
    {
      "material": "cement",
      "quantity": 50
    },
    {
      "material": "steel",
      "quantity": 10
    }
  ],
  "photo_urls": [
    "https://s3.../photo1.jpg",
    "https://s3.../photo2.jpg"
  ]
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "schedule_activity_id": "uuid",
    "report_date": "2024-01-16",
    "progress_percentage": 75,
    "status": "on_track",
    "work_completed": "Foundation work completed 75%. Concrete pouring in progress.",
    "issues_encountered": "Minor delay due to rain",
    "mitigation_plan": "Additional manpower allocated to recover delay",
    "labor_on_site": 15,
    "equipment_on_site": [...],
    "materials_consumed": [...],
    "photo_urls": [...],
    "reported_by": "uuid",
    "created_at": "2024-01-16T02:30:00Z"
  },
  "message": "Progress reported successfully"
}

```

### Get Progress Reports

**Endpoint**: `GET /projects/:id/construction/progress`

**Query Parameters**:
- `from_date` (date) - Start date
- `to_date` (date) - End date
- `activity_id` (string) - Filter by activity

**Response**:

```json

{
  "success": true,
  "data": {
    "progress_reports": [
      {
        "id": "uuid",
        "report_date": "2024-01-16",
        "progress_percentage": 75,
        "status": "on_track",
        "work_completed": "Foundation work completed 75%",
        "labor_on_site": 15,
        "created_at": "2024-01-16T02:30:00Z"
      }
    ],
    "total": 30
  },
  "message": "Progress reports retrieved successfully"
}

```

### Submit Quality Check

**Endpoint**: `POST /projects/:id/construction/quality`

**Request Body**:

```json

{
  "check_type": "material",
  "check_category": "concrete",
  "check_name": "Concrete Strength Test",
  "check_date": "2024-01-16",
  "location": {
    "zone": "A",
    "position": "foundation"
  },
  "check_status": "pass",
  "check_score": 95,
  "observations": "Concrete strength meets design requirements",
  "non_conformances": [],
  "corrective_actions": null
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "check_type": "material",
    "check_category": "concrete",
    "check_name": "Concrete Strength Test",
    "check_date": "2024-01-16",
    "location": {
      "zone": "A",
      "position": "foundation"
    },
    "check_status": "pass",
    "check_score": 95,
    "observations": "Concrete strength meets design requirements",
    "non_conformances": [],
    "corrective_actions": null,
    "inspected_by": "uuid",
    "approved_by": null,
    "created_at": "2024-01-16T03:00:00Z",
    "updated_at": "2024-01-16T03:00:00Z"
  },
  "message": "Quality check submitted successfully"
}

```

### Get Quality Checks

**Endpoint**: `GET /projects/:id/construction/quality`

**Query Parameters**:
- `check_type` (string) - Filter by check type
- `status` (string) - Filter by status
- `from_date` (date) - Start date
- `to_date` (date) - End date

**Response**:

```json

{
  "success": true,
  "data": {
    "quality_checks": [
      {
        "id": "uuid",
        "check_type": "material",
        "check_category": "concrete",
        "check_name": "Concrete Strength Test",
        "check_date": "2024-01-16",
        "check_status": "pass",
        "check_score": 95,
        "created_at": "2024-01-16T03:00:00Z"
      }
    ],
    "total": 45
  },
  "message": "Quality checks retrieved successfully"
}

```

---

## Compliance Service APIs

### Check Compliance

**Endpoint**: `POST /projects/:id/compliance/check`

**Request Body**:

```json

{
  "standards": ["NBC_2016", "IS_456", "FSSAI"],
  "project_parameters": {
    "building_type": "greenhouse",
    "area": 5000,
    "height": 4,
    "occupancy": "agricultural",
    "fire_safety": true,
    "electrical_safety": true
  }
}

```

**Response**:

```json

{
  "success": true,
  "data": {
    "compliance_id": "uuid",
    "project_id": "uuid",
    "results": [
      {
        "standard_code": "NBC_2016",
        "standard_name": "National Building Code 2016",
        "standard_category": "building",
        "compliance_status": "compliant",
        "compliance_score": 95,
        "gap_analysis": [],
        "required_actions": null
      },
      {
        "standard_code": "IS_456",
        "standard_name": "Indian Standard Plain and Reinforced Concrete",
        "standard_category": "structural",
        "compliance_status": "partial",
        "compliance_score": 85,
        "gap_analysis": [
          {
            "requirement": "Beam reinforcement spacing",
            "status": "non_compliant",
            "gap": "Spacing exceeds maximum limit of 200mm",
            "recommendation": "Reduce spacing to 150mm"
          }
        ],
        "required_actions": "Adjust beam reinforcement spacing to comply with IS 456"
      },
      {
        "standard_code": "FSSAI",
        "standard_name": "Food Safety and Standards Authority of India",
        "standard_category": "food",
        "compliance_status": "not_applicable",
        "compliance_score": null,
        "gap_analysis": [],
        "required_actions": null
      }
    ],
    "overall_compliance_score": 90,
    "overall_status": "compliant_with_conditions",
    "checked_at": "2024-01-16T03:30:00Z"
  },
  "message": "Compliance check completed successfully"
}

```

### Get Compliance Records

**Endpoint**: `GET /projects/:id/compliance`

**Query Parameters**:
- `standard_code` (string) - Filter by standard
- `status` (string) - Filter by compliance status
- `category` (string) - Filter by category

**Response**:

```json

{
  "success": true,
  "data": {
    "compliance_records": [
      {
        "id": "uuid",
        "standard_code": "NBC_2016",
        "standard_name": "National Building Code 2016",
        "standard_category": "building",
        "compliance_status": "compliant",
        "compliance_score": 95,
        "verified_by": {
          "id": "uuid",
          "name": "Jane Smith"
        },
        "verified_at": "2024-01-16T03:30:00Z",
        "created_at": "2024-01-16T03:30:00Z"
      }
    ],
    "total": 8
  },
  "message": "Compliance records retrieved successfully"
}

```

---

## Conclusion

This API specification document provides comprehensive endpoints for all services in the AFRERA Engineering OS. The APIs are designed to be:

- **RESTful**: Following REST principles for resource-based operations
- **Consistent**: Uniform response formats and error handling
- **Secure**: JWT-based authentication and role-based authorization
- **Scalable**: Designed for horizontal scaling and load balancing
- **Documented**: Clear request/response examples for all endpoints

The API specifications support the complete engineering lifecycle from project creation through design, analysis, cost estimation, scheduling, construction monitoring, to facility operation and digital twin management.
