# Master Data Pagination API Documentation

This document describes the pagination, search, and sorting features implemented for all Master Data services.

## General API Structure

All Master Data endpoints now support the following query parameters:

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (minimum: 1) |
| `pageSize` | integer | 10 | Items per page (minimum: 1, maximum: 100) |
| `search` | string | "" | Search term for text-based filtering |
| `sortBy` | string | varies | Field to sort by (see service-specific options) |
| `sortOrder` | string | "ASC" | Sort direction ("ASC" or "DESC") |

### Response Structure

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "data": [...], // Array of items
    "pagination": {
      "total": 150,
      "page": 1,
      "pageSize": 10,
      "totalPages": 15
    }
  }
}
```

## Service-Specific Implementation

### 1. Product Service
**Endpoint:** `GET /api/master-data/product`

**Search Fields:** name, description  
**Sort Options:** name, createdAt, updatedAt  
**Additional Filters:** categoryId, typeId, companyId

**Example:**
```
GET /api/master-data/product?page=1&pageSize=20&search=laptop&sortBy=name&sortOrder=ASC&categoryId=1
```

### 2. Car Service
**Endpoint:** `GET /api/master-data/car`

**Search Fields:** name, plate_number, description  
**Sort Options:** name, plate_number, is_active, createdAt, updatedAt  
**Additional Filters:** active (boolean)

**Example:**
```
GET /api/master-data/car?page=2&pageSize=15&search=truck&sortBy=is_active&sortOrder=DESC&active=true
```

### 3. Company Service
**Endpoint:** `GET /api/master-data/company`

**Search Fields:** name, description  
**Sort Options:** name, createdAt, updatedAt

**Example:**
```
GET /api/master-data/company?page=1&pageSize=10&search=tech&sortBy=name&sortOrder=ASC
```

### 4. Employee Service
**Endpoint:** `GET /api/master-data/employee`

**Search Fields:** nama, phone, role, address  
**Sort Options:** nama, role, salary, is_active, createdAt, updatedAt  
**Additional Filters:** active (boolean)

**Example:**
```
GET /api/master-data/employee?page=1&pageSize=25&search=manager&sortBy=salary&sortOrder=DESC&active=true
```

### 5. Customer Service
**Endpoint:** `GET /api/master-data/customer`

**Search Fields:** name, email, phoneNumber, address, alias  
**Sort Options:** name, email, createdAt, updatedAt  
**Additional Filters:** isPosCustomer (boolean)

**Example:**
```
GET /api/master-data/customer?page=1&pageSize=50&search=john&sortBy=name&sortOrder=ASC&isPosCustomer=false
```

### 6. Product Price Service
**Endpoint:** `GET /api/master-data/product-price/:productId`

**Search Fields:** unitName  
**Sort Options:** unitName, basePrice, masterModal

**Example:**
```
GET /api/master-data/product-price/123?page=1&pageSize=10&search=kg&sortBy=basePrice&sortOrder=DESC
```

### 7. Warehouse Rack Service
**Endpoint:** `GET /api/master-data/warehouse/:warehouseId/rack`

**Search Fields:** name, description  
**Sort Options:** name, createdAt, updatedAt

**Example:**
```
GET /api/master-data/warehouse/1/rack?page=1&pageSize=20&search=A1&sortBy=name&sortOrder=ASC
```

## Backward Compatibility

All existing API calls continue to work without pagination parameters. When no pagination parameters are provided:
- Default pagination is applied (page=1, pageSize=10)
- Original sorting behavior is maintained where applicable
- All existing filters continue to work as before

## Error Handling

- Invalid `page` or `pageSize` values return a 400 Bad Request
- Invalid `sortBy` values fall back to default sorting
- Invalid `sortOrder` values fall back to "ASC"
- Database errors return appropriate 500 responses

## Performance Considerations

- Database-level pagination using `LIMIT` and `OFFSET`
- Search queries use case-insensitive `ILIKE` operations
- Indexes should be considered for frequently searched fields
- Product Price service uses client-side pagination due to its unique data structure