# Volume 5: API Specification

## Executive Summary

The AFRERA platform API specification defines the complete interface for all external and internal communications. The platform provides REST APIs, GraphQL endpoints, WebSocket connections, and comprehensive error handling with standardized authentication and authorization mechanisms.

---

## API Architecture Overview

### API Gateway: Kong

**Base URL**: `https://api.afrera.com`
**API Version**: v1
**Content Type**: application/json
**Character Encoding**: UTF-8

### API Categories

**Public APIs**: No authentication required
**Private APIs**: Authentication required
**Admin APIs**: Admin authentication required
**Partner APIs**: Partner authentication required
**Internal APIs**: Internal service communication

---

## REST API Specification

### 1. Authentication APIs

#### POST /api/v1/auth/register

**Description**: Register a new user

**Request Body**:

```json

{
  "email": "string (required, email format)",
  "phone": "string (required, 10-15 digits)",
  "password": "string (required, min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special)",
  "firstName": "string (required, 2-100 chars)",
  "lastName": "string (required, 2-100 chars)",
  "userType": "string (required: FARMER, BUYER, GOVERNMENT, PARTNER, COOPERATIVE)",
  "dateOfBirth": "string (optional, ISO 8601 date)",
  "gender": "string (optional: MALE, FEMALE, OTHER)",
  "referralCode": "string (optional)"
}

```

**Response 201**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "phone": "string",
    "firstName": "string",
    "lastName": "string",
    "userType": "string",
    "status": "PENDING_VERIFICATION",
    "emailVerified": false,
    "phoneVerified": false,
    "createdAt": "ISO 8601 timestamp"
  }
}

```

**Error Responses**:
- 400: Invalid input data
- 409: Email or phone already registered
- 422: Validation error

#### POST /api/v1/auth/login

**Description**: User login

**Request Body**:

```json

{
  "identifier": "string (required, email or phone)",
  "password": "string (required)",
  "deviceInfo": {
    "deviceType": "string (optional: WEB, MOBILE, TABLET)",
    "deviceName": "string (optional)",
    "os": "string (optional)",
    "browser": "string (optional)"
  }
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "phone": "string",
      "firstName": "string",
      "lastName": "string",
      "userType": "string",
      "profileImageUrl": "string"
    },
    "tokens": {
      "accessToken": "string (JWT)",
      "refreshToken": "string",
      "expiresIn": 86400
    },
    "permissions": ["string"]
  }
}

```

**Error Responses**:
- 400: Invalid credentials
- 401: Account locked
- 404: User not found
- 429: Too many attempts

#### POST /api/v1/auth/refresh

**Description**: Refresh access token

**Request Body**:

```json

{
  "refreshToken": "string (required)"
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "accessToken": "string (JWT)",
    "refreshToken": "string",
    "expiresIn": 86400
  }
}

```

#### POST /api/v1/auth/logout

**Description**: User logout

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "message": "Logged out successfully"
}

```

#### POST /api/v1/auth/forgot-password

**Description**: Initiate password reset

**Request Body**:

```json

{
  "email": "string (required)"
}

```

**Response 200**:

```json

{
  "success": true,
  "message": "Password reset email sent"
}

```

#### POST /api/v1/auth/reset-password

**Description**: Reset password with token

**Request Body**:

```json

{
  "token": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}

```

**Response 200**:

```json

{
  "success": true,
  "message": "Password reset successfully"
}

```

---

### 2. User Management APIs

#### GET /api/v1/users/me

**Description**: Get current user profile

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "phone": "string",
    "firstName": "string",
    "lastName": "string",
    "profileImageUrl": "string",
    "dateOfBirth": "ISO 8601 date",
    "gender": "string",
    "userType": "string",
    "status": "string",
    "emailVerified": true,
    "phoneVerified": true,
    "kycVerified": true,
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}

```

#### PUT /api/v1/users/me

**Description**: Update current user profile

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "dateOfBirth": "string (optional)",
  "gender": "string (optional)",
  "profileImage": "string (optional, base64 or file upload)"
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "phone": "string",
    "firstName": "string",
    "lastName": "string",
    "profileImageUrl": "string",
    "dateOfBirth": "ISO 8601 date",
    "gender": "string",
    "updatedAt": "ISO 8601 timestamp"
  }
}

```

#### POST /api/v1/users/me/kyc

**Description**: Submit KYC documents

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "aadhaarNumber": "string (required, 12 digits)",
  "aadhaarFrontImage": "string (required, base64)",
  "aadhaarBackImage": "string (required, base64)",
  "panNumber": "string (optional, 10 chars)",
  "panImage": "string (optional, base64)",
  "bankAccountNumber": "string (required)",
  "bankIfscCode": "string (required, 11 chars)",
  "bankPassbookImage": "string (required, base64)"
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "SUBMITTED",
    "submittedAt": "ISO 8601 timestamp"
  }
}

```

---

### 3. Farmer Management APIs

#### GET /api/v1/farmers/me

**Description**: Get farmer profile

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "farmerCode": "string",
    "userId": "uuid",
    "aadhaarNumber": "string",
    "panNumber": "string",
    "dateOfBirth": "ISO 8601 date",
    "gender": "string",
    "category": "string",
    "educationLevel": "string",
    "farmingExperienceYears": "integer",
    "landHoldingSize": "decimal",
    "irrigationSource": "string",
    "soilType": "string",
    "primaryCrop": "string",
    "secondaryCrops": ["string"],
    "livestockDetails": {},
    "farmingPractices": ["string"],
    "certificationDetails": {},
    "fdiScore": "integer",
    "fdiGrade": "string",
    "fdiCalculatedAt": "ISO 8601 timestamp",
    "bankAccountNumber": "string",
    "bankIfscCode": "string",
    "bankAccountVerified": "boolean",
    "cooperativeId": "uuid",
    "isCooperativeMember": "boolean",
    "status": "string",
    "verifiedAt": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp"
  }
}

```

#### PUT /api/v1/farmers/me

**Description**: Update farmer profile

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "category": "string (optional)",
  "educationLevel": "string (optional)",
  "farmingExperienceYears": "integer (optional)",
  "landHoldingSize": "decimal (optional)",
  "irrigationSource": "string (optional)",
  "soilType": "string (optional)",
  "primaryCrop": "string (optional)",
  "secondaryCrops": ["string"] (optional),
  "livestockDetails": {} (optional),
  "farmingPractices": ["string"] (optional)
}

```

#### GET /api/v1/farmers/me/farms

**Description**: Get farmer's farms

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "farmCode": "string",
      "farmName": "string",
      "locationName": "string",
      "state": "string",
      "district": "string",
      "block": "string",
      "village": "string",
      "latitude": "decimal",
      "longitude": "decimal",
      "altitude": "decimal",
      "totalArea": "decimal",
      "cultivatedArea": "decimal",
      "soilType": "string",
      "soilPhLevel": "decimal",
      "irrigationType": "string",
      "waterSource": "string",
      "ownershipType": "string",
      "landDocumentType": "string",
      "landDocumentNumber": "string",
      "landDocumentUrl": "string",
      "isOrganic": "boolean",
      "organicCertificationNumber": "string",
      "organicCertifiedAt": "ISO 8601 timestamp",
      "organicExpiryDate": "ISO 8601 date",
      "geoBoundary": {
        "type": "Polygon",
        "coordinates": [[[decimal, decimal]]]
      }
    }
  ]
}

```

#### POST /api/v1/farmers/me/farms

**Description**: Add new farm

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "farmName": "string (required)",
  "locationName": "string (required)",
  "state": "string (required)",
  "district": "string (required)",
  "block": "string (optional)",
  "village": "string (optional)",
  "latitude": "decimal (required)",
  "longitude": "decimal (required)",
  "altitude": "decimal (optional)",
  "totalArea": "decimal (required)",
  "cultivatedArea": "decimal (required)",
  "soilType": "string (optional)",
  "soilPhLevel": "decimal (optional)",
  "irrigationType": "string (optional)",
  "waterSource": "string (optional)",
  "ownershipType": "string (required)",
  "landDocumentType": "string (optional)",
  "landDocumentNumber": "string (optional)",
  "landDocumentUrl": "string (optional)",
  "isOrganic": "boolean (optional)",
  "organicCertificationNumber": "string (optional)",
  "organicCertifiedAt": "ISO 8601 date (optional)",
  "organicExpiryDate": "ISO 8601 date (optional)",
  "geoBoundary": {
    "type": "Polygon",
    "coordinates": [[[decimal, decimal]]]
  } (optional)
}

```

#### GET /api/v1/farmers/me/fdi-score

**Description**: Get FDI score details

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "overallScore": "integer",
    "grade": "string",
    "calculatedAt": "ISO 8601 timestamp",
    "components": {
      "landQuality": {
        "score": "integer",
        "weight": "decimal",
        "factors": {}
      },
      "cropDiversity": {
        "score": "integer",
        "weight": "decimal",
        "factors": {}
      },
      "sustainability": {
        "score": "integer",
        "weight": "decimal",
        "factors": {}
      },
      "technologyAdoption": {
        "score": "integer",
        "weight": "decimal",
        "factors": {}
      },
      "marketParticipation": {
        "score": "integer",
        "weight": "decimal",
        "factors": {}
      }
    }
  }
}

```

---

### 4. Marketplace APIs

#### GET /api/v1/products

**Description**: Search and list products

**Query Parameters**:
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)
- `category`: string (optional)
- `subcategory`: string (optional)
- `search`: string (optional)
- `minPrice`: decimal (optional)
- `maxPrice`: decimal (optional)
- `isOrganic`: boolean (optional)
- `isGiProduct`: boolean (optional)
- `state`: string (optional)
- `sortBy`: string (optional: price_asc, price_desc, rating, newest)
- `farmerId`: uuid (optional)

**Response 200**:

```json

{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "productCode": "string",
        "name": "string",
        "description": "string",
        "category": {
          "id": "uuid",
          "name": "string"
        },
        "subcategory": {
          "id": "uuid",
          "name": "string"
        },
        "farmer": {
          "id": "uuid",
          "name": "string",
          "farmerCode": "string",
          "fdiScore": "integer",
          "fdiGrade": "string"
        },
        "isGiProduct": "boolean",
        "giNumber": "string",
        "giRegion": "string",
        "isOrganic": "boolean",
        "organicCertificationNumber": "string",
        "nutritionalInfo": {},
        "specifications": {},
        "images": ["string"],
        "primaryImageUrl": "string",
        "basePrice": "decimal",
        "currency": "string",
        "unit": "string",
        "availableQuantity": "decimal",
        "minimumOrderQuantity": "decimal",
        "harvestDate": "ISO 8601 date",
        "expiryDate": "ISO 8601 date",
        "storageConditions": ["string"],
        "qualityGrade": "string",
        "fdiScore": "integer",
        "carbonFootprint": "decimal",
        "sustainabilityScore": "integer",
        "tags": ["string"],
        "status": "string",
        "isFeatured": "boolean",
        "viewCount": "integer",
        "purchaseCount": "integer",
        "ratingAverage": "decimal",
        "ratingCount": "integer"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  }
}

```

#### GET /api/v1/products/{id}

**Description**: Get product details

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "productCode": "string",
    "name": "string",
    "description": "string",
    "category": {
      "id": "uuid",
      "name": "string",
      "description": "string"
    },
    "subcategory": {
      "id": "uuid",
      "name": "string",
      "description": "string"
    },
    "farmer": {
      "id": "uuid",
      "name": "string",
      "farmerCode": "string",
      "fdiScore": "integer",
      "fdiGrade": "string",
      "state": "string",
      "district": "string"
    },
    "farm": {
      "id": "uuid",
      "farmName": "string",
      "locationName": "string",
      "state": "string",
      "district": "string"
    },
    "isGiProduct": "boolean",
    "giNumber": "string",
    "giRegion": "string",
    "isOrganic": "boolean",
    "organicCertificationNumber": "string",
    "nutritionalInfo": {
      "calories": "decimal",
      "protein": "decimal",
      "carbohydrates": "decimal",
      "fat": "decimal",
      "fiber": "decimal",
      "vitamins": {},
      "minerals": {}
    },
    "specifications": {
      "weight": "decimal",
      "dimensions": {},
      "shelfLife": "string",
      "storageConditions": ["string"]
    },
    "images": ["string"],
    "primaryImageUrl": "string",
    "basePrice": "decimal",
    "currency": "string",
    "unit": "string",
    "availableQuantity": "decimal",
    "minimumOrderQuantity": "decimal",
    "harvestDate": "ISO 8601 date",
    "expiryDate": "ISO 8601 date",
    "storageConditions": ["string"],
    "qualityGrade": "string",
    "fdiScore": "integer",
    "carbonFootprint": "decimal",
    "sustainabilityScore": "integer",
    "tags": ["string"],
    "status": "string",
    "isFeatured": "boolean",
    "viewCount": "integer",
    "purchaseCount": "integer",
    "ratingAverage": "decimal",
    "ratingCount": "integer",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}

```

#### POST /api/v1/products

**Description**: Create new product listing (Farmer only)

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "name": "string (required)",
  "description": "string (required)",
  "categoryId": "uuid (required)",
  "subcategoryId": "uuid (optional)",
  "farmId": "uuid (required)",
  "isGiProduct": "boolean (optional)",
  "giNumber": "string (optional)",
  "giRegion": "string (optional)",
  "isOrganic": "boolean (optional)",
  "organicCertificationNumber": "string (optional)",
  "nutritionalInfo": {} (optional),
  "specifications": {} (optional),
  "images": ["string"] (required, min 1),
  "basePrice": "decimal (required)",
  "unit": "string (required)",
  "availableQuantity": "decimal (required)",
  "minimumOrderQuantity": "decimal (optional)",
  "harvestDate": "ISO 8601 date (optional)",
  "expiryDate": "ISO 8601 date (optional)",
  "storageConditions": ["string"] (optional),
  "qualityGrade": "string (optional)",
  "tags": ["string"] (optional)
}

```

#### GET /api/v1/categories

**Description**: Get product categories

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "parentId": "uuid",
      "iconUrl": "string",
      "imageUrl": "string",
      "displayOrder": "integer",
      "isActive": "boolean",
      "subcategories": [
        {
          "id": "uuid",
          "name": "string",
          "description": "string",
          "iconUrl": "string",
          "imageUrl": "string",
          "displayOrder": "integer",
          "isActive": "boolean"
        }
      ]
    }
  ]
}

```

---

### 5. Order Management APIs

#### POST /api/v1/orders

**Description**: Create new order

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "orderType": "string (required: STANDARD, PRE_SEASON, CONTRACT, BULK)",
  "items": [
    {
      "productId": "uuid (required)",
      "quantity": "decimal (required)",
      "unit": "string (required)"
    }
  ] (required, min 1 item),
  "shippingAddress": {
    "name": "string (required)",
    "phone": "string (required)",
    "addressLine1": "string (required)",
    "addressLine2": "string (optional)",
    "city": "string (required)",
    "state": "string (required)",
    "district": "string (required)",
    "pincode": "string (required)",
    "landmark": "string (optional)"
  } (required),
  "billingAddress": {} (optional, same structure as shippingAddress),
  "paymentMethod": "string (required: UPI, CARD, NET_BANKING, WALLET, COD)",
  "couponCode": "string (optional)",
  "notes": "string (optional)
}

```

**Response 201**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "string",
    "userId": "uuid",
    "buyerType": "string",
    "orderType": "string",
    "status": "PENDING",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "string",
        "productCode": "string",
        "quantity": "decimal",
        "unit": "string",
        "unitPrice": "decimal",
        "discountAmount": "decimal",
        "taxAmount": "decimal",
        "totalPrice": "decimal",
        "farmerId": "uuid",
        "farmId": "uuid",
        "harvestDate": "ISO 8601 date",
        "qualityGrade": "string"
      }
    ],
    "subtotal": "decimal",
    "discountAmount": "decimal",
    "taxAmount": "decimal",
    "shippingAmount": "decimal",
    "totalAmount": "decimal",
    "currency": "string",
    "paymentMethod": "string",
    "paymentStatus": "PENDING",
    "shippingAddress": {},
    "billingAddress": {},
    "expectedDeliveryDate": "ISO 8601 date",
    "couponCode": "string",
    "marginPercentage": "decimal",
    "marginAmount": "decimal",
    "createdAt": "ISO 8601 timestamp"
  }
}

```

#### GET /api/v1/orders

**Description**: Get user's orders

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**:
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `status`: string (optional)
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)

**Response 200**:

```json

{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "string",
        "orderType": "string",
        "status": "string",
        "totalAmount": "decimal",
        "currency": "string",
        "paymentStatus": "string",
        "items": [
          {
            "productName": "string",
            "quantity": "decimal",
            "unit": "string",
            "totalPrice": "decimal"
          }
        ],
        "shippingAddress": {
          "city": "string",
          "state": "string",
          "pincode": "string"
        },
        "expectedDeliveryDate": "ISO 8601 date",
        "actualDeliveryDate": "ISO 8601 date",
        "trackingNumber": "string",
        "carrier": "string",
        "createdAt": "ISO 8601 timestamp"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  }
}

```

#### GET /api/v1/orders/{id}

**Description**: Get order details

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "string",
    "userId": "uuid",
    "buyerType": "string",
    "orderType": "string",
    "status": "string",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "string",
        "productCode": "string",
        "quantity": "decimal",
        "unit": "string",
        "unitPrice": "decimal",
        "discountAmount": "decimal",
        "taxAmount": "decimal",
        "totalPrice": "decimal",
        "farmerId": "uuid",
        "farmId": "uuid",
        "harvestDate": "ISO 8601 date",
        "qualityGrade": "string",
        "specifications": {}
      }
    ],
    "subtotal": "decimal",
    "discountAmount": "decimal",
    "taxAmount": "decimal",
    "shippingAmount": "decimal",
    "totalAmount": "decimal",
    "currency": "string",
    "paymentMethod": "string",
    "paymentStatus": "string",
    "paymentId": "string",
    "shippingAddress": {},
    "billingAddress": {},
    "expectedDeliveryDate": "ISO 8601 date",
    "actualDeliveryDate": "ISO 8601 date",
    "trackingNumber": "string",
    "carrier": "string",
    "notes": "string",
    "couponCode": "string",
    "marginPercentage": "decimal",
    "marginAmount": "decimal",
    "createdAt": "ISO 8601 timestamp",
    "confirmedAt": "ISO 8601 timestamp",
    "shippedAt": "ISO 8601 timestamp",
    "deliveredAt": "ISO 8601 timestamp"
  }
}

```

#### POST /api/v1/orders/{id}/cancel

**Description**: Cancel order

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "reason": "string (required)",
  "refundMethod": "string (optional)"
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "string",
    "status": "CANCELLED",
    "cancelledAt": "ISO 8601 timestamp",
    "cancellationReason": "string"
  }
}

```

---

### 6. Cart Management APIs

#### GET /api/v1/cart

**Description**: Get user's cart

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "product": {
          "id": "uuid",
          "name": "string",
          "basePrice": "decimal",
          "unit": "string",
          "availableQuantity": "decimal",
          "primaryImageUrl": "string",
          "isOrganic": "boolean",
          "isGiProduct": "boolean"
        },
        "quantity": "decimal",
        "unit": "string",
        "unitPrice": "decimal",
        "totalPrice": "decimal"
      }
    ],
    "subtotal": "decimal",
    "discountAmount": "decimal",
    "taxAmount": "decimal",
    "shippingAmount": "decimal",
    "totalAmount": "decimal",
    "currency": "string",
    "updatedAt": "ISO 8601 timestamp"
  }
}

```

#### POST /api/v1/cart/items

**Description**: Add item to cart

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "productId": "uuid (required)",
  "quantity": "decimal (required)",
  "unit": "string (required)"
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "quantity": "decimal",
    "unit": "string",
    "unitPrice": "decimal",
    "totalPrice": "decimal"
  }
}

```

#### PUT /api/v1/cart/items/{id}

**Description**: Update cart item quantity

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "quantity": "decimal (required)"
}

```

**Response 200**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "quantity": "decimal",
    "unitPrice": "decimal",
    "totalPrice": "decimal"
  }
}

```

#### DELETE /api/v1/cart/items/{id}

**Description**: Remove item from cart

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "message": "Item removed from cart"
}

```

#### DELETE /api/v1/cart

**Description**: Clear cart

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "message": "Cart cleared"
}

```

---

### 7. Financial Services APIs

#### GET /api/v1/accounts

**Description**: Get user's accounts

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountNumber": "string",
      "accountType": "string",
      "accountName": "string",
      "balance": "decimal",
      "currency": "string",
      "status": "string",
      "kycVerified": "boolean",
      "creditLimit": "decimal",
      "availableCredit": "decimal",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}

```

#### GET /api/v1/accounts/{id}/transactions

**Description**: Get account transactions

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**:
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)
- `type`: string (optional)
- `category`: string (optional)

**Response 200**:

```json

{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transactionId": "string",
        "transactionType": "string",
        "amount": "decimal",
        "currency": "string",
        "description": "string",
        "referenceId": "uuid",
        "referenceType": "string",
        "balanceBefore": "decimal",
        "balanceAfter": "decimal",
        "category": "string",
        "tags": ["string"],
        "status": "string",
        "createdAt": "ISO 8601 timestamp"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  }
}

```

#### POST /api/v1/loans

**Description**: Apply for loan

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "loanType": "string (required: CROP_LOAN, EQUIPMENT_LOAN, LAND_DEVELOPMENT, WORKING_CAPITAL, GREENHOUSE, INFRASTRUCTURE)",
  "principalAmount": "decimal (required)",
  "tenureMonths": "integer (required)",
  "purpose": "string (required)",
  "collateralDetails": {} (optional),
  "subsidySchemeId": "uuid (optional)
}

```

**Response 201**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "loanNumber": "string",
    "userId": "uuid",
    "accountId": "uuid",
    "loanType": "string",
    "principalAmount": "decimal",
    "interestRate": "decimal",
    "interestType": "string",
    "tenureMonths": "integer",
    "emiAmount": "decimal",
    "totalInterest": "decimal",
    "totalAmount": "decimal",
    "purpose": "string",
    "collateralDetails": {},
    "subsidyPercentage": "decimal",
    "subsidyAmount": "decimal",
    "subsidySchemeId": "uuid",
    "status": "PENDING",
    "applicationDate": "ISO 8601 date",
    "createdAt": "ISO 8601 timestamp"
  }
}

```

#### GET /api/v1/loans

**Description**: Get user's loans

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "loanNumber": "string",
      "loanType": "string",
      "principalAmount": "decimal",
      "interestRate": "decimal",
      "tenureMonths": "integer",
      "emiAmount": "decimal",
      "totalAmount": "decimal",
      "status": "string",
      "applicationDate": "ISO 8601 date",
      "approvalDate": "ISO 8601 date",
      "disbursementDate": "ISO 8601 date",
      "maturityDate": "ISO 8601 date"
    }
  ]
}

```

#### GET /api/v1/loans/{id}/repayments

**Description**: Get loan repayment schedule

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "loanId": "uuid",
    "loanNumber": "string",
    "repayments": [
      {
        "id": "uuid",
        "installmentNumber": "integer",
        "dueDate": "ISO 8601 date",
        "amountDue": "decimal",
        "principalComponent": "decimal",
        "interestComponent": "decimal",
        "amountPaid": "decimal",
        "paymentDate": "ISO 8601 date",
        "paymentMethod": "string",
        "paymentReference": "string",
        "status": "string",
        "lateFee": "decimal",
        "paidLateFee": "decimal"
      }
    ]
  }
}

```

---

### 8. Insurance APIs

#### GET /api/v1/insurance/policies

**Description**: Get user's insurance policies

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "policyNumber": "string",
      "policyType": "string",
      "insuranceProvider": "string",
      "schemeId": "uuid",
      "coverageAmount": "decimal",
      "premiumAmount": "decimal",
      "premiumFrequency": "string",
      "sumAssured": "decimal",
      "deductibleAmount": "decimal",
      "policyStartDate": "ISO 8601 date",
      "policyEndDate": "ISO 8601 date",
      "coverageDetails": {},
      "premiumPaidAmount": "decimal",
      "subsidyPercentage": "decimal",
      "subsidyAmount": "decimal",
      "status": "string"
    }
  ]
}

```

#### POST /api/v1/insurance/claims

**Description**: Submit insurance claim

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "policyId": "uuid (required)",
  "claimType": "string (required)",
  "incidentDate": "ISO 8601 date (required)",
  "claimAmount": "decimal (required)",
  "description": "string (required)",
  "incidentDetails": {} (required),
  "supportingDocuments": ["string"] (required, min 1)
}

```

**Response 201**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "claimNumber": "string",
    "policyId": "uuid",
    "userId": "uuid",
    "claimType": "string",
    "incidentDate": "ISO 8601 date",
    "reportedDate": "ISO 8601 date",
    "claimAmount": "decimal",
    "description": "string",
    "incidentDetails": {},
    "supportingDocuments": ["string"],
    "status": "PENDING",
    "aiConfidenceScore": "decimal",
    "aiRecommendation": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}

```

#### GET /api/v1/insurance/claims

**Description**: Get user's insurance claims

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "claimNumber": "string",
      "policyId": "uuid",
      "claimType": "string",
      "incidentDate": "ISO 8601 date",
      "reportedDate": "ISO 8601 date",
      "claimAmount": "decimal",
      "approvedAmount": "decimal",
      "settlementAmount": "decimal",
      "settlementDate": "ISO 8601 date",
      "status": "string",
      "aiConfidenceScore": "decimal",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}

```

---

### 9. Government Schemes APIs

#### GET /api/v1/schemes

**Description**: Get government schemes

**Query Parameters**:
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `type`: string (optional)
- `state`: string (optional)
- `status`: string (optional)

**Response 200**:

```json

{
  "success": true,
  "data": {
    "schemes": [
      {
        "id": "uuid",
        "schemeCode": "string",
        "schemeName": "string",
        "schemeType": "string",
        "ministry": "string",
        "description": "string",
        "eligibilityCriteria": {},
        "requiredDocuments": ["string"],
        "benefitDetails": {},
        "applicationProcess": "string",
        "subsidyPercentage": "decimal",
        "maxSubsidyAmount": "decimal",
        "applicationStartDate": "ISO 8601 date",
        "applicationEndDate": "ISO 8601 date",
        "schemeStartDate": "ISO 8601 date",
        "schemeEndDate": "ISO 8601 date",
        "stateSpecific": {},
        "targetBeneficiaries": ["string"],
        "status": "string",
        "websiteUrl": "string"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  }
}

```

#### POST /api/v1/schemes/{id}/apply

**Description**: Apply for government scheme

**Headers**: `Authorization: Bearer {accessToken}`

**Request Body**:

```json

{
  "applicationData": {} (required),
  "documents": ["string"] (required, min 1)
}

```

**Response 201**:

```json

{
  "success": true,
  "data": {
    "id": "uuid",
    "applicationNumber": "string",
    "schemeId": "uuid",
    "userId": "uuid",
    "farmerId": "uuid",
    "applicationData": {},
    "documents": ["string"],
    "submissionDate": "ISO 8601 date",
    "status": "SUBMITTED",
    "aiEligibilityScore": "decimal",
    "aiRecommendation": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}

```

#### GET /api/v1/schemes/applications

**Description**: Get user's scheme applications

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "applicationNumber": "string",
      "scheme": {
        "id": "uuid",
        "schemeCode": "string",
        "schemeName": "string",
        "schemeType": "string"
      },
      "submissionDate": "ISO 8601 date",
      "status": "string",
      "currentStage": "string",
      "approvedAmount": "decimal",
      "subsidyAmount": "decimal",
      "disbursementDate": "ISO 8601 date",
      "aiEligibilityScore": "decimal",
      "aiRecommendation": "string"
    }
  ]
}

```

---

### 10. Logistics APIs

#### GET /api/v1/shipments

**Description**: Get user's shipments

**Headers**: `Authorization: Bearer {accessToken}`

**Query Parameters**:
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `status`: string (optional)
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)

**Response 200**:

```json

{
  "success": true,
  "data": {
    "shipments": [
      {
        "id": "uuid",
        "shipmentNumber": "string",
        "orderId": "uuid",
        "shipmentType": "string",
        "originAddress": {},
        "destinationAddress": {},
        "pickupDate": "ISO 8601 date",
        "expectedDeliveryDate": "ISO 8601 date",
        "actualDeliveryDate": "ISO 8601 date",
        "carrier": {
          "id": "uuid",
          "name": "string",
          "phone": "string"
        },
        "trackingNumber": "string",
        "status": "string",
        "cost": "decimal",
        "subsidyAmount": "decimal",
        "createdAt": "ISO 8601 timestamp"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "totalPages": "integer"
    }
  }
}

```

#### GET /api/v1/shipments/{id}/tracking

**Description**: Get shipment tracking details

**Headers**: `Authorization: Bearer {accessToken}`

**Response 200**:

```json

{
  "success": true,
  "data": {
    "shipmentId": "uuid",
    "shipmentNumber": "string",
    "status": "string",
    "tracking": [
      {
        "id": "uuid",
        "location": {
          "latitude": "decimal",
          "longitude": "decimal",
          "name": "string"
        },
        "status": "string",
        "timestamp": "ISO 8601 timestamp",
        "speed": "decimal",
        "heading": "decimal",
        "temperature": "decimal",
        "humidity": "decimal"
      }
    ]
  }
}

```

---

## GraphQL API Specification

### GraphQL Endpoint

**URL**: `https://api.afrera.com/graphql`
**Method**: POST
**Content-Type**: application/json

### Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer {accessToken}

```

### GraphQL Schema

#### Type Definitions

```graphql

type User {
  id: ID!
  email: String!
  phone: String
  firstName: String!
  lastName: String!
  profileImageUrl: String
  userType: UserType!
  status: UserStatus!
  emailVerified: Boolean!
  phoneVerified: Boolean!
  kycVerified: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum UserType {
  FARMER
  BUYER
  GOVERNMENT
  ADMIN
  PARTNER
  COOPERATIVE
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

type Farmer {
  id: ID!
  userId: ID!
  farmerCode: String!
  aadhaarNumber: String
  panNumber: String
  dateOfBirth: Date
  gender: String
  category: String
  educationLevel: String
  farmingExperienceYears: Int
  landHoldingSize: Decimal
  irrigationSource: String
  soilType: String
  primaryCrop: String
  secondaryCrops: [String]
  fdiScore: Int
  fdiGrade: String
  bankAccountNumber: String
  bankIfscCode: String
  cooperativeId: ID
  isCooperativeMember: Boolean
  status: FarmerStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum FarmerStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  BLACKLISTED
}

type Product {
  id: ID!
  productCode: String!
  name: String!
  description: String
  category: ProductCategory!
  subcategory: ProductSubcategory
  farmer: Farmer!
  farm: Farm
  isGiProduct: Boolean!
  giNumber: String
  giRegion: String
  isOrganic: Boolean!
  organicCertificationNumber: String
  nutritionalInfo: Json
  specifications: Json
  images: [String]
  primaryImageUrl: String
  basePrice: Decimal!
  currency: String!
  unit: ProductUnit!
  availableQuantity: Decimal!
  minimumOrderQuantity: Decimal!
  harvestDate: Date
  expiryDate: Date
  qualityGrade: String
  fdiScore: Int
  carbonFootprint: Decimal
  sustainabilityScore: Int
  tags: [String]
  status: ProductStatus!
  ratingAverage: Decimal
  ratingCount: Int
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ProductUnit {
  KG
  GRAM
  LITER
  ML
  PIECE
  DOZEN
  BUNCH
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
  DISCONTINUED
}

type Order {
  id: ID!
  orderNumber: String!
  userId: ID!
  buyerType: BuyerType!
  orderType: OrderType!
  status: OrderStatus!
  items: [OrderItem]
  subtotal: Decimal!
  discountAmount: Decimal!
  taxAmount: Decimal!
  shippingAmount: Decimal!
  totalAmount: Decimal!
  currency: String!
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus!
  shippingAddress: Json!
  billingAddress: Json
  expectedDeliveryDate: Date
  actualDeliveryDate: Date
  trackingNumber: String
  carrier: String
  marginPercentage: Decimal
  marginAmount: Decimal
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum BuyerType {
  INDIVIDUAL
  COOPERATIVE
  BUSINESS
  GOVERNMENT
}

enum OrderType {
  STANDARD
  PRE_SEASON
  CONTRACT
  BULK
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  UPI
  CARD
  NET_BANKING
  WALLET
  COD
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

type OrderItem {
  id: ID!
  orderId: ID!
  productId: ID
  productName: String!
  productCode: String
  quantity: Decimal!
  unit: String!
  unitPrice: Decimal!
  discountAmount: Decimal!
  taxAmount: Decimal!
  totalPrice: Decimal!
  farmerId: ID
  farmId: ID
  harvestDate: Date
  qualityGrade: String
  specifications: Json
}

```

#### Queries

```graphql

type Query {
  # User queries
  me: User
  user(id: ID!): User
  
  # Farmer queries
  farmer(id: ID!): Farmer
  farmers(
    page: Int
    limit: Int
    state: String
    district: String
    fdiScoreMin: Int
    fdiScoreMax: Int
  ): FarmerConnection!
  
  # Product queries
  product(id: ID!): Product
  products(
    page: Int
    limit: Int
    category: ID
    subcategory: ID
    search: String
    minPrice: Decimal
    maxPrice: Decimal
    isOrganic: Boolean
    isGiProduct: Boolean
    state: String
    sortBy: ProductSortBy
  ): ProductConnection!
  
  # Order queries
  order(id: ID!): Order
  orders(
    page: Int
    limit: Int
    status: OrderStatus
    startDate: Date
    endDate: Date
  ): OrderConnection!
  
  # Scheme queries
  scheme(id: ID!): GovernmentScheme
  schemes(
    page: Int
    limit: Int
    type: String
    state: String
    status: String
  ): SchemeConnection!
  
  # Search queries
  searchProducts(query: String!, page: Int, limit: Int): ProductConnection!
  searchFarmers(query: String!, page: Int, limit: Int): FarmerConnection!
}

enum ProductSortBy {
  PRICE_ASC
  PRICE_DESC
  RATING
  NEWEST
  POPULARITY
}

type FarmerConnection {
  edges: [FarmerEdge]
  pageInfo: PageInfo!
  totalCount: Int
}

type FarmerEdge {
  node: Farmer
  cursor: String
}

type ProductConnection {
  edges: [ProductEdge]
  pageInfo: PageInfo!
  totalCount: Int
}

type ProductEdge {
  node: Product
  cursor: String
}

type OrderConnection {
  edges: [OrderEdge]
  pageInfo: PageInfo!
  totalCount: Int
}

type OrderEdge {
  node: Order
  cursor: String
}

type SchemeConnection {
  edges: [SchemeEdge]
  pageInfo: PageInfo!
  totalCount: Int
}

type SchemeEdge {
  node: GovernmentScheme
  cursor: String
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

```

#### Mutations

```graphql

type Mutation {
  # Authentication mutations
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  refreshToken(input: RefreshTokenInput!): AuthPayload!
  logout: Boolean!
  
  # User mutations
  updateProfile(input: UpdateProfileInput!): User!
  submitKYC(input: KYCInput!): KYCSubmission!
  
  # Farmer mutations
  updateFarmerProfile(input: UpdateFarmerInput!): Farmer!
  addFarm(input: AddFarmInput!): Farm!
  updateFarm(id: ID!, input: UpdateFarmInput!): Farm!
  
  # Product mutations
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ID!): Boolean!
  
  # Order mutations
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(id: ID!, input: CancelOrderInput!): Order!
  
  # Cart mutations
  addToCart(input: AddToCartInput!): CartItem!
  updateCartItem(id: ID!, input: UpdateCartItemInput!): CartItem!
  removeFromCart(id: ID!): Boolean!
  clearCart: Boolean!
  
  # Scheme mutations
  applyForScheme(schemeId: ID!, input: SchemeApplicationInput!): SchemeApplication!
}

input RegisterInput {
  email: String!
  phone: String!
  password: String!
  firstName: String!
  lastName: String!
  userType: UserType!
  dateOfBirth: Date
  gender: String
  referralCode: String
}

input LoginInput {
  identifier: String!
  password: String!
  deviceInfo: DeviceInfoInput
}

input DeviceInfoInput {
  deviceType: String
  deviceName: String
  os: String
  browser: String
}

input RefreshTokenInput {
  refreshToken: String!
}

type AuthPayload {
  user: User!
  tokens: Tokens!
  permissions: [String]
}

type Tokens {
  accessToken: String!
  refreshToken: String!
  expiresIn: Int
}

input UpdateProfileInput {
  firstName: String
  lastName: String
  dateOfBirth: Date
  gender: String
  profileImage: String
}

input KYCInput {
  aadhaarNumber: String!
  aadhaarFrontImage: String!
  aadhaarBackImage: String!
  panNumber: String
  panImage: String
  bankAccountNumber: String!
  bankIfscCode: String!
  bankPassbookImage: String!
}

type KYCSubmission {
  id: ID!
  userId: ID!
  status: String!
  submittedAt: DateTime!
}

input UpdateFarmerInput {
  category: String
  educationLevel: String
  farmingExperienceYears: Int
  landHoldingSize: Decimal
  irrigationSource: String
  soilType: String
  primaryCrop: String
  secondaryCrops: [String]
  livestockDetails: Json
  farmingPractices: [String]
}

input AddFarmInput {
  farmName: String!
  locationName: String!
  state: String!
  district: String!
  block: String
  village: String
  latitude: Decimal!
  longitude: Decimal!
  altitude: Decimal
  totalArea: Decimal!
  cultivatedArea: Decimal!
  soilType: String
  soilPhLevel: Decimal
  irrigationType: String
  waterSource: String
  ownershipType: String!
  landDocumentType: String
  landDocumentNumber: String
  landDocumentUrl: String
  isOrganic: Boolean
  organicCertificationNumber: String
  organicCertifiedAt: Date
  organicExpiryDate: Date
  geoBoundary: Json
}

input UpdateFarmInput {
  farmName: String
  locationName: String
  totalArea: Decimal
  cultivatedArea: Decimal
  soilType: String
  soilPhLevel: Decimal
  irrigationType: String
  waterSource: String
  isOrganic: Boolean
  organicCertificationNumber: String
  organicCertifiedAt: Date
  organicExpiryDate: Date
}

input CreateProductInput {
  name: String!
  description: String!
  categoryId: ID!
  subcategoryId: ID
  farmId: ID!
  isGiProduct: Boolean
  giNumber: String
  giRegion: String
  isOrganic: Boolean
  organicCertificationNumber: String
  nutritionalInfo: Json
  specifications: Json
  images: [String]!
  basePrice: Decimal!
  unit: ProductUnit!
  availableQuantity: Decimal!
  minimumOrderQuantity: Decimal
  harvestDate: Date
  expiryDate: Date
  storageConditions: [String]
  qualityGrade: String
  tags: [String]
}

input UpdateProductInput {
  name: String
  description: String
  basePrice: Decimal
  availableQuantity: Decimal
  minimumOrderQuantity: Decimal
  harvestDate: Date
  expiryDate: Date
  qualityGrade: String
  tags: [String]
  status: ProductStatus
}

input CreateOrderInput {
  orderType: OrderType!
  items: [OrderItemInput!]!
  shippingAddress: Json!
  billingAddress: Json
  paymentMethod: PaymentMethod!
  couponCode: String
  notes: String
}

input OrderItemInput {
  productId: ID!
  quantity: Decimal!
  unit: String!
}

input CancelOrderInput {
  reason: String!
  refundMethod: String
}

input AddToCartInput {
  productId: ID!
  quantity: Decimal!
  unit: String!
}

input UpdateCartItemInput {
  quantity: Decimal!
}

input SchemeApplicationInput {
  applicationData: Json!
  documents: [String]!
}

```

---

## WebSocket API Specification

### WebSocket Endpoint

**URL**: `wss://api.afrera.com/ws`
**Protocol**: WebSocket Secure (WSS)

### Authentication

Connect with JWT token in query parameter:

```
wss://api.afrera.com/ws?token={accessToken}

```

### Connection Flow

1. **Connect**: Establish WebSocket connection with token
2. **Authenticate**: Server validates token
3. **Subscribe**: Client subscribes to channels
4. **Receive**: Client receives real-time updates
5. **Disconnect**: Client closes connection

### WebSocket Events

#### Client → Server Events

**Subscribe to Channel**:

```json

{
  "event": "subscribe",
  "data": {
    "channel": "orders"
  }
}

```

**Unsubscribe from Channel**:

```json

{
  "event": "unsubscribe",
  "data": {
    "channel": "orders"
  }
}

```

**Ping**:

```json

{
  "event": "ping",
  "data": {
    "timestamp": "ISO 8601 timestamp"
  }
}

```

#### Server → Client Events

**Connection Established**:

```json

{
  "event": "connected",
  "data": {
    "userId": "uuid",
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Order Update**:

```json

{
  "event": "order_update",
  "data": {
    "orderId": "uuid",
    "orderNumber": "string",
    "status": "string",
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Shipment Update**:

```json

{
  "event": "shipment_update",
  "data": {
    "shipmentId": "uuid",
    "shipmentNumber": "string",
    "status": "string",
    "location": {
      "latitude": "decimal",
      "longitude": "decimal",
      "name": "string"
    },
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Notification**:

```json

{
  "event": "notification",
  "data": {
    "id": "uuid",
    "type": "string",
    "title": "string",
    "message": "string",
    "priority": "string",
    "actionUrl": "string",
    "actionLabel": "string",
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Price Alert**:

```json

{
  "event": "price_alert",
  "data": {
    "productId": "uuid",
    "productName": "string",
    "oldPrice": "decimal",
    "newPrice": "decimal",
    "changePercentage": "decimal",
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Weather Alert**:

```json

{
  "event": "weather_alert",
  "data": {
    "alertId": "string",
    "alertType": "string",
    "severity": "string",
    "affectedRegions": {},
    "startDate": "ISO 8601 date",
    "endDate": "ISO 8601 date",
    "description": "string",
    "advisory": "string",
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Pong**:

```json

{
  "event": "pong",
  "data": {
    "timestamp": "ISO 8601 timestamp"
  }
}

```

**Error**:

```json

{
  "event": "error",
  "data": {
    "code": "string",
    "message": "string",
    "timestamp": "ISO 8601 timestamp"
  }
}

```

### Available Channels

- `orders`: Order status updates
- `shipments`: Shipment tracking updates
- `notifications`: User notifications
- `price_alerts`: Price change alerts
- `weather_alerts`: Weather alerts
- `scheme_updates`: Government scheme updates
- `training_updates`: Training program updates

---

## Error Codes

### Standard Error Response Format

```json

{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": {},
    "timestamp": "ISO 8601 timestamp",
    "requestId": "string"
  }
}

```

### Error Code Categories

**1xx**: Informational
**2xx**: Success
**4xx**: Client Errors
**5xx**: Server Errors

### Common Error Codes

| Code | HTTP Status | Message | Description |
|------|------------|---------|-------------|
| AUTH_001 | 401 | Invalid token | JWT token is invalid or expired |
| AUTH_002 | 401 | Token expired | JWT token has expired |
| AUTH_003 | 401 | Invalid credentials | Username or password is incorrect |
| AUTH_004 | 403 | Access denied | User does not have permission |
| AUTH_005 | 429 | Too many attempts | Too many login attempts |
| AUTH_006 | 403 | Account locked | Account is locked |
| AUTH_007 | 401 | Session expired | User session has expired |
| VAL_001 | 400 | Validation error | Request validation failed |
| VAL_002 | 400 | Invalid input | Input data is invalid |
| VAL_003 | 400 | Missing required field | Required field is missing |
| VAL_004 | 400 | Invalid format | Data format is invalid |
| VAL_005 | 400 | Invalid email | Email format is invalid |
| VAL_006 | 400 | Invalid phone | Phone number format is invalid |
| VAL_007 | 400 | Invalid date | Date format is invalid |
| VAL_008 | 400 | Invalid enum | Invalid enum value |
| VAL_009 | 400 | Invalid UUID | UUID format is invalid |
| VAL_010 | 400 | Invalid range | Value is out of valid range |
| USR_001 | 404 | User not found | User does not exist |
| USR_002 | 409 | Email already exists | Email is already registered |
| USR_003 | 409 | Phone already exists | Phone number is already registered |
| USR_004 | 403 | KYC not verified | KYC verification required |
| USR_005 | 403 | Account inactive | Account is not active |
| USR_006 | 403 | Account suspended | Account is suspended |
| FMR_001 | 404 | Farmer not found | Farmer profile does not exist |
| FMR_002 | 403 | Not a farmer | User is not a farmer |
| FMR_003 | 404 | Farm not found | Farm does not exist |
| PRD_001 | 404 | Product not found | Product does not exist |
| PRD_002 | 400 | Out of stock | Product is out of stock |
| PRD_003 | 400 | Insufficient quantity | Requested quantity not available |
| PRD_004 | 403 | Not product owner | User does not own this product |
| ORD_001 | 404 | Order not found | Order does not exist |
| ORD_002 | 400 | Invalid order status | Order cannot be modified in current status |
| ORD_003 | 400 | Cart empty | Cart is empty |
| ORD_004 | 400 | Invalid quantity | Quantity is invalid |
| ORD_005 | 400 | Minimum order not met | Minimum order quantity not met |
| PAY_001 | 400 | Payment failed | Payment processing failed |
| PAY_002 | 400 | Invalid payment method | Payment method is not supported |
| PAY_003 | 400 | Payment already processed | Payment has already been processed |
| PAY_004 | 400 | Refund failed | Refund processing failed |
| LON_001 | 404 | Loan not found | Loan does not exist |
| LON_002 | 400 | Loan already exists | Loan application already exists |
| LON_003 | 400 | Invalid loan amount | Loan amount is invalid |
| LON_004 | 400 | Invalid tenure | Loan tenure is invalid |
| INS_001 | 404 | Policy not found | Insurance policy does not exist |
| INS_002 | 400 | Claim already exists | Claim already submitted |
| INS_003 | 400 | Invalid claim amount | Claim amount is invalid |
| INS_004 | 400 | Policy expired | Insurance policy has expired |
| SCH_001 | 404 | Scheme not found | Government scheme does not exist |
| SCH_002 | 400 | Application already exists | Scheme application already exists |
| SCH_003 | 400 | Application closed | Scheme application is closed |
| SCH_004 | 400 | Not eligible | User is not eligible for this scheme |
| SHP_001 | 404 | Shipment not found | Shipment does not exist |
| SHP_002 | 400 | Invalid shipment status | Shipment cannot be modified in current status |
| SHP_003 | 404 | Tracking not available | Tracking information not available |
| SRV_001 | 500 | Internal server error | Internal server error occurred |
| SRV_002 | 503 | Service unavailable | Service is temporarily unavailable |
| SRV_003 | 504 | Gateway timeout | Gateway timeout occurred |
| SRV_004 | 500 | Database error | Database error occurred |
| SRV_005 | 500 | External service error | External service error occurred |
| SRV_006 | 429 | Rate limit exceeded | Rate limit has been exceeded |
| SRV_007 | 503 | Maintenance mode | Service is under maintenance |

---

## Authentication Specification

### JWT Token Structure

**Access Token**:

```json

{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "afrera.com",
    "sub": "user-id",
    "aud": "afrera-api",
    "exp": 1234567890,
    "iat": 1234567890,
    "userId": "uuid",
    "userType": "FARMER",
    "permissions": ["READ", "WRITE"]
  }
}

```

**Refresh Token**:

```json

{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "afrera.com",
    "sub": "user-id",
    "aud": "afrera-refresh",
    "exp": 1234567890,
    "iat": 1234567890,
    "userId": "uuid",
    "tokenId": "uuid"
  }
}

```

### Authentication Flow

1. **Registration**: User registers with email/phone
2. **Verification**: Email/phone verification
3. **Login**: User logs in with credentials
4. **Token Generation**: Server generates access and refresh tokens
5. **Token Usage**: Client uses access token for API calls
6. **Token Refresh**: Client refreshes access token using refresh token
7. **Logout**: Client invalidates tokens

### Authorization

**Role-Based Access Control (RBAC)**:
- Roles: FARMER, BUYER, GOVERNMENT, ADMIN, PARTNER, COOPERATIVE
- Permissions: READ, WRITE, DELETE, ADMIN
- Resource-level access control

**Attribute-Based Access Control (ABAC)**:
- Dynamic permissions based on attributes
- Context-aware authorization
- Fine-grained access control

### Rate Limiting

**Default Limits**:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user
- 10 requests per minute for sensitive endpoints

**Rate Limit Headers**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890

```

---

## API Versioning

### Versioning Strategy

**URL-based versioning**: `/api/v1/`, `/api/v2/`
**Backward compatibility**: Maintain backward compatibility for 12 months
**Deprecation policy**: 6-month deprecation notice
**Migration support**: Provide migration guides

### Version Lifecycle

1. **Development**: `/api/dev/`
2. **Beta**: `/api/beta/`
3. **Stable**: `/api/v1/`
4. **Deprecated**: `/api/v1/` (with deprecation notice)
5. **Sunset**: Endpoint removed

---

## Conclusion

The AFRERA API specification provides a comprehensive interface for all platform operations, including REST APIs, GraphQL endpoints, WebSocket connections, and standardized error handling. The API is designed for security, performance, and developer experience, with clear authentication and authorization mechanisms.
