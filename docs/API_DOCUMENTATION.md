# EBDESIGN API Documentation

**Version:** 1.0.0  
**Last Updated:** 30 August 2026  
**Base URL:** `http://localhost:3001/api/v1` (Development) / `https://api.ebdesign.com/api/v1` (Production)

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [API Endpoints](#api-endpoints)
7. [Examples](#examples)
8. [Best Practices](#best-practices)

---

## Overview

The EBDESIGN API provides a comprehensive RESTful interface for interacting with the agricultural digital operating system. All endpoints return JSON responses and follow standard HTTP methods.

### Key Features

- **RESTful Architecture:** Clean resource-based URL structure
- **JWT Authentication:** Secure token-based authentication
- **Standardized Responses:** Consistent response format across all endpoints
- **Error Handling:** Comprehensive error codes and messages
- **Rate Limiting:** Built-in rate limiting to prevent abuse
- **Pagination:** Built-in pagination for list endpoints
- **Filtering & Sorting:** Advanced filtering and sorting capabilities

---

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

**POST** `/auth/login`

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "farmer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "metadata": {
    "timestamp": "2026-08-30T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Token Refresh

**POST** `/auth/refresh`

```json
{
  "refreshToken": "your_refresh_token"
}
```

### Token Expiration

- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "metadata": {
    "timestamp": "2026-08-30T10:00:00Z",
    "requestId": "req_abc123",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Authentication required",
    "details": {
      "field": "Authorization header"
    },
    "timestamp": "2026-08-30T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Error Codes

### Authentication Errors

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| `AUTH_001` | Authentication required | 401 | No valid authentication token provided |
| `AUTH_002` | Invalid credentials | 401 | Invalid email or password |
| `AUTH_003` | Session expired, please login again | 401 | JWT token has expired |
| `AUTH_004` | You do not have permission to perform this action | 403 | Insufficient permissions for the requested action |

### Validation Errors

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| `VAL_001` | Invalid input data | 400 | General validation error |
| `VAL_002` | Required field is missing | 400 | A required field was not provided |
| `VAL_003` | Invalid data format | 400 | Data format is incorrect |
| `VAL_004` | This record already exists | 409 | Duplicate entry detected |

### Resource Errors

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| `RES_001` | Resource not found | 404 | Requested resource does not exist |
| `RES_002` | Resource conflict | 409 | Conflict with existing resource |
| `RES_003` | Resource is currently locked | 423 | Resource is locked by another operation |

### Server Errors

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| `SRV_001` | An unexpected error occurred | 500 | Internal server error |
| `SRV_002` | Database operation failed | 500 | Database operation error |
| `SRV_003` | External service unavailable | 503 | Third-party service is down |
| `SRV_004` | Too many requests, please try again later | 429 | Rate limit exceeded |

### Business Logic Errors

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| `BIZ_001` | Business rule violation | 400 | Violation of business logic rules |
| `BIZ_002` | This operation is not allowed | 400 | Operation not permitted in current state |
| `BIZ_003` | Insufficient funds for this operation | 400 | Not enough funds for transaction |
| `BIZ_004` | Requested quantity exceeds available stock | 400 | Insufficient inventory |

---

## Rate Limiting

### Rate Limits

- **Authenticated Users:** 1000 requests per hour
- **Unauthenticated Users:** 100 requests per hour
- **WebSocket Connections:** 10 connections per user

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1693368000
```

### Rate Limit Error Response

```json
{
  "success": false,
  "error": {
    "code": "SRV_004",
    "message": "Too many requests, please try again later",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

---

## API Endpoints

### Authentication

#### Login
**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** User object with access and refresh tokens

#### Logout
**POST** `/auth/logout`

Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

#### Refresh Token
**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

#### Register
**POST** `/auth/register`

Register new user account.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)",
  "role": "string (farmer|admin|consumer)"
}
```

### Users

#### Get Current User
**GET** `/users/me`

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

#### Update User
**PUT** `/users/me`

Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "phone": "string",
  "address": "object"
}
```

#### Get User by ID
**GET** `/users/:id`

Get user profile by ID.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): User ID

### Products

#### List Products
**GET** `/products`

Get list of products with pagination and filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category
- `search` (optional): Search term
- `sort` (optional): Sort field (default: createdAt)
- `order` (optional): Sort order (asc|desc, default: desc)

**Response:** Paginated list of products

#### Get Product
**GET** `/products/:id`

Get product details by ID.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Product ID

#### Create Product
**POST** `/products`

Create new product.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "category": "string (required)",
  "price": "number (required)",
  "quantity": "number (required)",
  "images": ["array of strings"],
  "attributes": "object"
}
```

#### Update Product
**PUT** `/products/:id`

Update product details.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Product ID

**Request Body:** Same as create product

#### Delete Product
**DELETE** `/products/:id`

Delete product.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Product ID

### Orders

#### List Orders
**GET** `/orders`

Get list of orders with pagination and filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

#### Get Order
**GET** `/orders/:id`

Get order details by ID.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Order ID

#### Create Order
**POST** `/orders`

Create new order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "string (required)",
      "quantity": "number (required)",
      "price": "number (required)"
    }
  ],
  "shippingAddress": "object (required)",
  "paymentMethod": "string (required)"
}
```

#### Update Order Status
**PUT** `/orders/:id/status`

Update order status.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Order ID

**Request Body:**
```json
{
  "status": "string (pending|processing|shipped|delivered|cancelled)"
}
```

### Farmers

#### Get Farmer Profile
**GET** `/farmers/:id`

Get farmer profile by ID.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Farmer ID

#### Update Farmer Profile
**PUT** `/farmers/:id`

Update farmer profile.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Farmer ID

**Request Body:**
```json
{
  "name": "string",
  "phone": "string",
  "address": "object",
  "farmSize": "number",
  "crops": ["array of strings"]
}
```

#### List Farmers
**GET** `/farmers`

Get list of farmers with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `region` (optional): Filter by region
- `crop` (optional): Filter by crop type

### AI Services

#### AI Chat
**POST** `/ai/chat`

Send message to AI assistant.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "string (required)",
  "context": "object (optional)",
  "sessionId": "string (optional)"
}
```

**Response:** AI response with message and context

#### AI Recommendations
**POST** `/ai/recommendations`

Get AI-powered recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "string (crops|prices|weather)",
  "parameters": "object"
}
```

#### Agricultural Intelligence
**POST** `/ai/agricultural-intelligence`

Get agricultural insights and predictions.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "location": "object (required)",
  "cropType": "string",
  "analysisType": "string (yield|soil|weather|pest)"
}
```

### Financial Services

#### Get Loan Status
**GET** `/financial/loans/:id`

Get loan details by ID.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Loan ID

#### Apply for Loan
**POST** `/financial/loans`

Apply for new loan.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": "number (required)",
  "purpose": "string (required)",
  "term": "number (required, in months)",
  "collateral": "object"
}
```

#### Get Credit Score
**GET** `/financial/credit-score`

Get user's credit score.

**Headers:** `Authorization: Bearer <token>`

### Logistics

#### Track Shipment
**GET** `/logistics/shipments/:id`

Track shipment by ID.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Shipment ID

#### Create Shipment
**POST** `/logistics/shipments`

Create new shipment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "string (required)",
  "destination": "object (required)",
  "weight": "number (required)",
  "dimensions": "object"
}
```

#### Update Shipment Status
**PUT** `/logistics/shipments/:id/status`

Update shipment status.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Shipment ID

**Request Body:**
```json
{
  "status": "string (pending|picked_up|in_transit|delivered)",
  "location": "object",
  "notes": "string"
}
```

### Platform Core

#### Health Check
**GET** `/platform/health`

Check platform health status.

**Response:** Platform health metrics

#### Platform Statistics
**GET** `/platform/statistics`

Get platform statistics and metrics.

**Headers:** `Authorization: Bearer <token>`

#### System Configuration
**GET** `/platform/config`

Get system configuration.

**Headers:** `Authorization: Bearer <token>` (admin only)

---

## Examples

### Example 1: User Login Flow

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'farmer@example.com',
    password: 'securePassword123'
  })
});

const { data } = await loginResponse.json();
const { accessToken, user } = data;

// 2. Use token for authenticated requests
const productsResponse = await fetch('http://localhost:3001/api/v1/products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const products = await productsResponse.json();
```

### Example 2: Creating an Order

```javascript
const createOrder = async (accessToken, orderData) => {
  const response = await fetch('http://localhost:3001/api/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [
        {
          productId: 'prod_123',
          quantity: 5,
          price: 100
        }
      ],
      shippingAddress: {
        street: '123 Farm Road',
        city: 'Guwahati',
        state: 'Assam',
        zipCode: '781001'
      },
      paymentMethod: 'cod'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
};
```

### Example 3: Error Handling

```javascript
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`http://localhost:3001/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!data.success) {
      // Handle different error types
      switch (data.error.code) {
        case 'AUTH_001':
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'AUTH_004':
          // Show permission error
          showToast('You do not have permission for this action', 'error');
          break;
        case 'VAL_001':
          // Show validation error
          showToast(data.error.message, 'warning');
          break;
        default:
          // Show generic error
          showToast('An error occurred. Please try again.', 'error');
      }
      throw new Error(data.error.message);
    }

    return data.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

### Example 4: Pagination

```javascript
const getProducts = async (page = 1, limit = 20) => {
  const response = await fetch(
    `http://localhost:3001/api/v1/products?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    }
  );

  const { data, metadata } = await response.json();
  
  return {
    products: data,
    pagination: metadata.pagination
  };
};

// Usage
const { products, pagination } = await getProducts(1, 20);
console.log(`Showing ${products.length} of ${pagination.total} products`);
```

---

## Best Practices

### 1. Authentication

- Always store tokens securely (use httpOnly cookies or secure storage)
- Implement token refresh logic before expiration
- Clear tokens on logout
- Use HTTPS in production

### 2. Error Handling

- Always check the `success` field in responses
- Handle different error codes appropriately
- Implement retry logic for transient errors
- Log errors for debugging

### 3. Rate Limiting

- Respect rate limit headers
- Implement exponential backoff for rate limit errors
- Cache responses when appropriate
- Use WebSocket for real-time updates instead of polling

### 4. Pagination

- Use pagination for large datasets
- Implement infinite scroll or load more buttons
- Cache paginated results
- Handle empty pages gracefully

### 5. Performance

- Use request batching when possible
- Implement request deduplication
- Compress large payloads
- Use CDN for static assets

### 6. Security

- Validate all input data
- Sanitize user-generated content
- Implement CSRF protection
- Use parameterized queries for database operations

### 7. Testing

- Mock API responses in tests
- Test error scenarios
- Implement integration tests
- Monitor API performance

---

## WebSocket Connection

### Connection URL

```
ws://localhost:3001 (Development)
wss://api.ebdesign.com (Production)
```

### Authentication

WebSocket connections require authentication via query parameter:

```
ws://localhost:3001?token=<your_jwt_token>
```

### Events

#### Client → Server

- `join_room` - Join a room for real-time updates
- `leave_room` - Leave a room
- `send_message` - Send a message to a room

#### Server → Client

- `room_update` - Room data update
- `notification` - New notification
- `status_update` - Status change update

### Example

```javascript
const socket = new WebSocket(`ws://localhost:3001?token=${accessToken}`);

socket.onopen = () => {
  console.log('WebSocket connected');
  socket.send(JSON.stringify({
    event: 'join_room',
    data: { room: 'orders' }
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.event) {
    case 'room_update':
      handleRoomUpdate(message.data);
      break;
    case 'notification':
      showNotification(message.data);
      break;
  }
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

socket.onclose = () => {
  console.log('WebSocket disconnected');
};
```

---

## SDKs

### JavaScript/TypeScript

```bash
npm install @ebdesign/sdk
```

```javascript
import { EBDesignClient } from '@ebdesign/sdk';

const client = new EBDesignClient({
  baseURL: 'https://api.ebdesign.com/api/v1',
  accessToken: 'your_token'
});

// Use the client
const products = await client.products.list();
const user = await client.users.getMe();
```

### Python

```bash
pip install ebdesign-sdk
```

```python
from ebdesign import EBDesignClient

client = EBDesignClient(
    base_url='https://api.ebdesign.com/api/v1',
    access_token='your_token'
)

# Use the client
products = client.products.list()
user = client.users.get_me()
```

---

## Support

For API support and questions:
- **Email:** api-support@ebdesign.com
- **Documentation:** https://docs.ebdesign.com/api
- **Status Page:** https://status.ebdesign.com

---

*This documentation is automatically generated from the OpenAPI specification. For the most up-to-date information, always refer to the live API documentation.*