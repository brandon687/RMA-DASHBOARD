# API Documentation

**SCal Mobile RMA Portal - REST API Reference**

Complete reference for all API endpoints, request/response formats, and integration examples.

---

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Customer Endpoints](#customer-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Error Handling](#error-handling)
- [Response Codes](#response-codes)
- [Examples](#examples)

---

## Overview

The RMA Portal API provides two sets of endpoints:

1. **Customer API** - Public endpoints for RMA submission
2. **Admin API** - Protected endpoints for managing submissions

**API Version**: 1.2.0
**Base Technology**: Express.js REST API
**Data Format**: JSON (except file uploads which use `multipart/form-data`)

---

## Base URL

### Development
```
http://localhost:3000
```

### Production (Railway)
```
https://scal-rma-portal.railway.app
```

All endpoints are relative to the base URL.

---

## Authentication

### Current Implementation
- Customer endpoints: **No authentication** (rate-limited)
- Admin endpoints: **No authentication** (should be protected in production)

### Production Recommendation
Add authentication middleware to admin routes:

```javascript
// Example: JWT authentication
const jwt = require('jsonwebtoken');

function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Apply to admin routes
app.use('/api/admin/*', authenticateAdmin);
```

---

## Rate Limiting

### API Rate Limit
**All `/api/` routes**:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

**Implementation** (server.js, lines 43-49):
```javascript
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
```

### Submission Rate Limit
**POST `/api/submit-rma`**:
- **Window**: 1 hour
- **Max Submissions**: 10 per IP
- **Purpose**: Prevent spam/abuse

**Implementation** (server.js, lines 51-57):
```javascript
const submissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many submission attempts, please try again later.'
});
```

---

## Customer Endpoints

### 1. Submit RMA

Submit a new RMA request with company information and supporting files.

**Endpoint**: `POST /api/submit-rma`
**Rate Limit**: 10 per hour
**Content-Type**: `multipart/form-data`

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyName` | string | Yes | Company name |
| `companyEmail` | email | Yes | Company email address |
| `orderNumber` | string | Yes | Sales order number |
| `quantity` | integer | Yes | Quantity to return (1-10,000) |
| `customerType` | string | Yes | `"us"` or `"international"` |
| `file_0`, `file_1`, ... | file | Yes | One or more files (max 10MB each) |

#### Validation Rules

1. **Company Email**: Must be valid email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
2. **Quantity**: Must be integer between 1 and 10,000
3. **Customer Type**: Must be exactly `"us"` or `"international"`
4. **Files**:
   - At least 1 file required
   - Maximum 10MB per file
   - All file types accepted

#### Request Example

```javascript
const formData = new FormData();
formData.append('companyName', 'Tech Solutions Inc');
formData.append('companyEmail', 'returns@techsolutions.com');
formData.append('orderNumber', 'SO-2025-001');
formData.append('quantity', '50');
formData.append('customerType', 'us');
formData.append('file_0', fileBlob, 'devices.xlsx');
formData.append('file_1', pdfBlob, 'invoice.pdf');

const response = await fetch('/api/submit-rma', {
    method: 'POST',
    body: formData
});

const result = await response.json();
```

#### Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "referenceNumber": "RMA-1M8X9C2-A3F5",
    "message": "RMA request submitted successfully",
    "filesProcessed": 2,
    "googleSheets": true,
    "googleDrive": true
}
```

**Response Fields**:
- `success` (boolean): Always `true` on success
- `referenceNumber` (string): Unique tracking number for this RMA
- `message` (string): Success message
- `filesProcessed` (integer): Number of files successfully processed
- `googleSheets` (boolean): Whether data was synced to Google Sheets
- `googleDrive` (boolean): Whether files were uploaded to Google Drive

#### Error Responses

**HTTP 400 Bad Request** - Missing or invalid fields

```json
{
    "error": "Missing required fields",
    "message": "Please fill in all required fields"
}
```

```json
{
    "error": "Invalid email",
    "message": "Please provide a valid email address"
}
```

```json
{
    "error": "Invalid quantity",
    "message": "Quantity must be between 1 and 10,000"
}
```

```json
{
    "error": "No files uploaded",
    "message": "Please upload at least one file"
}
```

**HTTP 429 Too Many Requests** - Rate limit exceeded

```json
{
    "error": "Too many submission attempts, please try again later."
}
```

**HTTP 500 Internal Server Error** - Processing error

```json
{
    "error": "Submission failed",
    "message": "An error occurred while processing your request. Please try again or contact rma@scalmob.com"
}
```

#### File Processing

When files are uploaded, the system automatically:

1. **Detects file type** based on extension
2. **Processes accordingly**:
   - **Excel/CSV**: Extracts device data, validates IMEIs
   - **PDF**: Extracts text content
   - **Images/Videos**: Stores metadata
   - **Other**: Stores for manual review
3. **Saves to local storage** (`/uploads/` directory)
4. **Saves to database** (Supabase)
5. **Syncs to Google Sheets** (if configured)
6. **Uploads to Google Drive** (if configured)

**Server.js Implementation**: Lines 354-525

---

### 2. Health Check

Check server status and availability.

**Endpoint**: `GET /api/health`
**Rate Limit**: 100 per 15 minutes
**Authentication**: None

#### Request Example

```bash
curl https://scal-rma-portal.railway.app/api/health
```

```javascript
const response = await fetch('/api/health');
const data = await response.json();
```

#### Success Response

**HTTP 200 OK**

```json
{
    "status": "healthy",
    "timestamp": "2025-11-13T10:30:00.000Z",
    "service": "SCal Mobile RMA Portal"
}
```

**Response Fields**:
- `status` (string): Always `"healthy"` if server is running
- `timestamp` (string): ISO 8601 timestamp
- `service` (string): Service name

---

### 3. Get All Submissions (Legacy)

Get list of all submissions. **Note**: This endpoint should be moved to admin routes in production.

**Endpoint**: `GET /api/submissions`
**Rate Limit**: 100 per 15 minutes
**Authentication**: None (should be protected)
**Status**: Deprecated - Use `/api/admin/submissions` instead

#### Request Example

```javascript
const response = await fetch('/api/submissions');
const data = await response.json();
```

#### Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "count": 15,
    "submissions": [
        {
            "referenceNumber": "RMA-1M8X9C2-A3F5",
            "timestamp": "2025-11-13T10:30:00.000Z",
            "companyName": "Tech Solutions Inc",
            "companyEmail": "returns@techsolutions.com",
            "orderNumber": "SO-2025-001",
            "quantity": 50,
            "customerType": "us",
            "status": "submitted",
            "files": [
                {
                    "name": "devices.xlsx",
                    "type": "spreadsheet",
                    "size": 15420,
                    "status": "processed"
                }
            ]
        }
    ]
}
```

---

## Admin Endpoints

### 1. Get All Submissions

Retrieve all RMA submissions with statistics.

**Endpoint**: `GET /api/admin/submissions`
**Rate Limit**: 100 per 15 minutes
**Authentication**: None (should be protected)

#### Request Parameters

Currently no query parameters supported. Pagination defaults:
- **Page**: 1
- **Limit**: 100 submissions

#### Request Example

```javascript
const response = await fetch('/api/admin/submissions');
const data = await response.json();
```

#### Success Response

**HTTP 200 OK**

```json
{
    "submissions": [
        {
            "id": 1,
            "reference_number": "RMA-1M8X9C2-A3F5",
            "company_name": "Tech Solutions Inc",
            "company_email": "returns@techsolutions.com",
            "order_number": "SO-2025-001",
            "customer_type": "US",
            "overall_status": "PENDING",
            "total_devices": 50,
            "approved_count": 0,
            "denied_count": 0,
            "pending_count": 50,
            "created_at": "2025-11-13T10:30:00.000Z",
            "updated_at": "2025-11-13T10:30:00.000Z"
        }
    ],
    "stats": {
        "total": 15,
        "totalDevices": 750,
        "pending": 8,
        "approved": 5,
        "denied": 2
    },
    "page": 1,
    "totalPages": 1
}
```

**Response Fields**:
- `submissions` (array): Array of submission objects
- `stats` (object): Aggregate statistics
  - `total`: Total number of submissions
  - `totalDevices`: Total devices across all submissions
  - `pending`: Submissions in SUBMITTED or PENDING status
  - `approved`: Approved submissions
  - `denied`: Denied submissions
- `page` (integer): Current page number
- `totalPages` (integer): Total number of pages

**Server.js Implementation**: Lines 539-565

---

### 2. Get Single Submission Details

Get complete details for a specific RMA submission including devices and files.

**Endpoint**: `GET /api/admin/submission/:referenceNumber`
**Rate Limit**: 100 per 15 minutes
**Authentication**: None (should be protected)

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `referenceNumber` | string | RMA reference number (e.g., "RMA-1M8X9C2-A3F5") |

#### Request Example

```javascript
const refNum = 'RMA-1M8X9C2-A3F5';
const response = await fetch(`/api/admin/submission/${refNum}`);
const data = await response.json();
```

#### Success Response

**HTTP 200 OK**

```json
{
    "submission": {
        "id": 1,
        "reference_number": "RMA-1M8X9C2-A3F5",
        "company_name": "Tech Solutions Inc",
        "company_email": "returns@techsolutions.com",
        "order_number": "SO-2025-001",
        "customer_type": "US",
        "overall_status": "PENDING",
        "total_devices": 50,
        "approved_count": 0,
        "denied_count": 0,
        "pending_count": 50,
        "created_at": "2025-11-13T10:30:00.000Z",
        "updated_at": "2025-11-13T10:30:00.000Z"
    },
    "devices": [
        {
            "id": 1,
            "submission_id": 1,
            "reference_number": "RMA-1M8X9C2-A3F5",
            "imei": "357069403525410",
            "imei_original": "357069403525410",
            "imei_valid": true,
            "imei_validation_errors": null,
            "imei_validation_warnings": null,
            "requires_imei_review": false,
            "model": "iPhone 14 Pro",
            "storage": "256GB",
            "condition": "B",
            "issue_description": "Screen crack",
            "issue_category": "Physical Damage",
            "requested_action": "RETURN",
            "unit_price": 750.00,
            "repair_cost": null,
            "approval_status": "PENDING",
            "created_at": "2025-11-13T10:30:00.000Z"
        }
    ],
    "files": [
        {
            "id": 1,
            "submission_id": 1,
            "original_filename": "devices.xlsx",
            "file_type": "spreadsheet",
            "file_size_bytes": 15420,
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "local_path": "/uploads/1731496200000_devices.xlsx",
            "processing_status": "PROCESSED",
            "devices_extracted": 50,
            "uploaded_at": "2025-11-13T10:30:00.000Z"
        }
    ]
}
```

#### Error Response

**HTTP 500 Internal Server Error** - Submission not found

```json
{
    "error": "Failed to fetch submission details",
    "message": "no rows returned by a query that expected to return at least one row"
}
```

**Server.js Implementation**: Lines 568-608

---

### 3. Download File

Download an uploaded file.

**Endpoint**: `GET /api/admin/download/:referenceNumber/:fileId`
**Rate Limit**: 100 per 15 minutes
**Authentication**: None (should be protected)
**Content-Type**: Based on original file

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `referenceNumber` | string | RMA reference number |
| `fileId` | integer | File ID from database |

#### Request Example

```javascript
// Download file
window.location.href = `/api/admin/download/RMA-1M8X9C2-A3F5/1`;

// Or with fetch
const response = await fetch(`/api/admin/download/RMA-1M8X9C2-A3F5/1`);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'devices.xlsx';
a.click();
```

#### Success Response

**HTTP 200 OK**

File binary data with appropriate headers:
- `Content-Type`: Original file MIME type
- `Content-Disposition`: `attachment; filename="original_filename.ext"`

#### Error Responses

**HTTP 404 Not Found** - File not found in database

```json
{
    "error": "File not found"
}
```

**HTTP 404 Not Found** - File not found on disk

```json
{
    "error": "File not found on disk",
    "path": "/full/path/to/file"
}
```

**Server.js Implementation**: Lines 611-655

---

### 4. Update Submission Status

Change the status of an RMA submission.

**Endpoint**: `POST /api/admin/submission/:referenceNumber/status`
**Rate Limit**: 100 per 15 minutes
**Authentication**: None (should be protected)
**Content-Type**: `application/json`

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `referenceNumber` | string | RMA reference number |

#### Request Body

```json
{
    "status": "approved"
}
```

**Valid Status Values**:
- `"submitted"` - Initial state
- `"pending"` - Under review
- `"approved"` - Approved for return/repair
- `"denied"` - Request denied

#### Request Example

```javascript
const response = await fetch(`/api/admin/submission/RMA-1M8X9C2-A3F5/status`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        status: 'approved'
    })
});

const result = await response.json();
```

#### Success Response

**HTTP 200 OK**

```json
{
    "success": true,
    "message": "Status updated successfully",
    "submission": {
        "id": 1,
        "reference_number": "RMA-1M8X9C2-A3F5",
        "overall_status": "APPROVED",
        "updated_at": "2025-11-13T11:00:00.000Z"
    }
}
```

#### Error Responses

**HTTP 400 Bad Request** - Invalid status value

```json
{
    "error": "Invalid status",
    "message": "Status must be one of: submitted, pending, approved, denied"
}
```

**HTTP 404 Not Found** - Submission not found

```json
{
    "error": "Submission not found",
    "message": "No submission found with reference number: RMA-INVALID"
}
```

**Server.js Implementation**: Lines 658-708

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
    "error": "Error Category",
    "message": "Detailed error message for user"
}
```

### Common Error Categories

| Category | HTTP Code | Description |
|----------|-----------|-------------|
| `Missing required fields` | 400 | Required request parameters missing |
| `Invalid email` | 400 | Email format validation failed |
| `Invalid quantity` | 400 | Quantity out of range |
| `Invalid status` | 400 | Invalid status value provided |
| `No files uploaded` | 400 | File upload required but missing |
| `File not found` | 404 | Requested file doesn't exist |
| `Submission not found` | 404 | Reference number not found |
| `Submission failed` | 500 | Server error during processing |
| `Failed to fetch submissions` | 500 | Database query error |

---

## Response Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## Examples

### Complete RMA Submission Flow (JavaScript)

```javascript
// Step 1: Prepare form data
const submitRMA = async () => {
    const formData = new FormData();

    // Add text fields
    formData.append('companyName', document.getElementById('company-name').value);
    formData.append('companyEmail', document.getElementById('company-email').value);
    formData.append('orderNumber', document.getElementById('order-number').value);
    formData.append('quantity', document.getElementById('quantity').value);
    formData.append('customerType', document.getElementById('customer-type').value);

    // Add files
    const fileInput = document.getElementById('file-input');
    Array.from(fileInput.files).forEach((file, index) => {
        formData.append(`file_${index}`, file);
    });

    try {
        // Step 2: Submit to API
        const response = await fetch('/api/submit-rma', {
            method: 'POST',
            body: formData
        });

        // Step 3: Handle response
        if (response.ok) {
            const result = await response.json();
            console.log('Success!', result.referenceNumber);

            // Show success message
            alert(`RMA submitted successfully! Reference number: ${result.referenceNumber}`);

        } else {
            // Handle error
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }

    } catch (error) {
        console.error('Network error:', error);
        alert('Network error. Please check your connection and try again.');
    }
};
```

### Admin Dashboard Integration

```javascript
// Load all submissions
const loadSubmissions = async () => {
    try {
        const response = await fetch('/api/admin/submissions');
        const data = await response.json();

        // Update UI
        document.getElementById('total-submissions').textContent = data.stats.total;
        document.getElementById('total-devices').textContent = data.stats.totalDevices;
        document.getElementById('pending-count').textContent = data.stats.pending;

        // Render submission list
        renderSubmissions(data.submissions);

    } catch (error) {
        console.error('Error loading submissions:', error);
    }
};

// View submission details
const viewSubmission = async (referenceNumber) => {
    try {
        const response = await fetch(`/api/admin/submission/${referenceNumber}`);
        const data = await response.json();

        // Display in modal
        showSubmissionModal(data);

    } catch (error) {
        console.error('Error loading submission:', error);
    }
};

// Update status
const updateStatus = async (referenceNumber, newStatus) => {
    try {
        const response = await fetch(`/api/admin/submission/${referenceNumber}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Status updated:', result);

            // Reload submissions
            loadSubmissions();
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }

    } catch (error) {
        console.error('Error updating status:', error);
    }
};
```

---

## Integration Notes

### File Upload Best Practices

1. **Use FormData** for multipart uploads
2. **Validate file size** client-side before upload (10MB max)
3. **Show upload progress** for better UX
4. **Handle network errors** gracefully

### Error Handling Best Practices

1. **Check response.ok** before parsing JSON
2. **Display user-friendly messages** from `error.message`
3. **Log full errors** to console for debugging
4. **Implement retry logic** for network failures

### Rate Limiting Considerations

1. **Monitor rate limit headers** in responses
2. **Implement exponential backoff** for retries
3. **Cache submission lists** to reduce API calls
4. **Debounce status updates** to prevent rapid-fire requests

---

## Future Enhancements

### Planned API Features

1. **Authentication**:
   - JWT-based admin authentication
   - API key authentication for integrations
   - Role-based access control

2. **Pagination**:
   - Query parameters for page and limit
   - Cursor-based pagination for large datasets

3. **Filtering**:
   - Filter by status, date range, customer type
   - Search by company name or reference number

4. **Webhooks**:
   - Status change notifications
   - New submission alerts
   - Configurable webhook URLs

5. **Batch Operations**:
   - Bulk status updates
   - Batch exports (CSV, Excel)

---

## Support

For API questions or issues:

- **Email**: rma@scalmob.com
- **Documentation**: See other .md files in this repository
- **Source Code**: `server.js` (lines 310-781)

---

**Last Updated**: November 2025
**API Version**: 1.2.0
