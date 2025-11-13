# Database Schema Documentation

**SCal Mobile RMA Portal - Supabase PostgreSQL Database**

Complete reference for database structure, relationships, and queries.

---

## Overview

**Database**: Supabase PostgreSQL
**Schema**: Public
**Tables**: 3 core tables
**Access**: Via Supabase JS client (@supabase/supabase-js)

---

## Tables

### 1. rma_submissions

**Purpose**: Main submission records

**Table Name**: `rma_submissions`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `reference_number` | VARCHAR(50) | NO | UNIQUE | RMA tracking number (e.g., "RMA-1M8X9C2-A3F5") |
| `company_name` | VARCHAR(255) | NO | - | Customer company name |
| `company_email` | VARCHAR(255) | NO | - | Customer email address |
| `order_number` | VARCHAR(100) | YES | NULL | Sales order number |
| `customer_type` | VARCHAR(20) | YES | 'US' | 'US' or 'INTERNATIONAL' |
| `overall_status` | VARCHAR(50) | YES | 'SUBMITTED' | SUBMITTED, PENDING, APPROVED, DENIED |
| `total_devices` | INTEGER | YES | 0 | Total devices in submission |
| `approved_count` | INTEGER | YES | 0 | Number of approved devices |
| `denied_count` | INTEGER | YES | 0 | Number of denied devices |
| `pending_count` | INTEGER | YES | 0 | Number of pending devices |
| `submission_date` | TIMESTAMP | YES | NOW() | When customer submitted |
| `created_at` | TIMESTAMP | YES | NOW() | Record creation time |
| `updated_at` | TIMESTAMP | YES | NOW() | Last update time |

**Indexes**:
- PRIMARY KEY (`id`)
- UNIQUE (`reference_number`)
- INDEX (`overall_status`)
- INDEX (`created_at`)

**Sample Row**:
```sql
{
  id: 1,
  reference_number: 'RMA-1M8X9C2-A3F5',
  company_name: 'Tech Solutions Inc',
  company_email: 'returns@techsolutions.com',
  order_number: 'SO-2025-001',
  customer_type: 'US',
  overall_status: 'PENDING',
  total_devices: 50,
  approved_count: 0,
  denied_count: 0,
  pending_count: 50,
  created_at: '2025-11-13T10:30:00.000Z',
  updated_at: '2025-11-13T10:30:00.000Z'
}
```

---

### 2. rma_devices

**Purpose**: Individual device records with IMEI validation

**Table Name**: `rma_devices`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `submission_id` | INTEGER | NO | FK | Foreign key to rma_submissions.id |
| `reference_number` | VARCHAR(50) | NO | - | RMA reference (denormalized for queries) |
| `imei` | VARCHAR(15) | YES | NULL | Sanitized IMEI (15 digits) |
| `imei_original` | TEXT | YES | NULL | Original IMEI value from upload |
| `imei_valid` | BOOLEAN | YES | FALSE | IMEI passed validation |
| `imei_validation_errors` | TEXT | YES | NULL | JSON array of validation errors |
| `imei_validation_warnings` | TEXT | YES | NULL | JSON array of validation warnings |
| `requires_imei_review` | BOOLEAN | YES | FALSE | Needs manual IMEI review |
| `model` | VARCHAR(255) | YES | NULL | Device model (e.g., "iPhone 14 Pro") |
| `storage` | VARCHAR(50) | YES | NULL | Storage capacity (e.g., "256GB") |
| `condition` | VARCHAR(50) | YES | NULL | Condition grade (A, B, C, D) |
| `issue_description` | TEXT | YES | NULL | Description of issue |
| `issue_category` | VARCHAR(100) | YES | NULL | Category of issue |
| `requested_action` | VARCHAR(50) | YES | 'PENDING' | RETURN, REPAIR, or PENDING |
| `unit_price` | DECIMAL(10,2) | YES | 0.00 | Device value |
| `repair_cost` | DECIMAL(10,2) | YES | NULL | Cost of repair (if applicable) |
| `approval_status` | VARCHAR(50) | YES | 'PENDING' | PENDING, APPROVED, DENIED, INFO_REQUESTED |
| `created_at` | TIMESTAMP | YES | NOW() | Record creation time |

**Indexes**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`submission_id`) REFERENCES `rma_submissions(id)` ON DELETE CASCADE
- INDEX (`reference_number`)
- INDEX (`imei`)
- INDEX (`imei_valid`)
- INDEX (`approval_status`)

**Sample Row**:
```sql
{
  id: 1,
  submission_id: 1,
  reference_number: 'RMA-1M8X9C2-A3F5',
  imei: '357069403525410',
  imei_original: '357069403525410',
  imei_valid: true,
  imei_validation_errors: null,
  imei_validation_warnings: null,
  requires_imei_review: false,
  model: 'iPhone 14 Pro',
  storage: '256GB',
  condition: 'B',
  issue_description: 'Screen crack',
  issue_category: 'Physical Damage',
  requested_action: 'RETURN',
  unit_price: 750.00,
  repair_cost: null,
  approval_status: 'PENDING',
  created_at: '2025-11-13T10:30:00.000Z'
}
```

---

### 3. rma_files

**Purpose**: Uploaded file metadata and processing status

**Table Name**: `rma_files`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO | AUTO | Primary key |
| `submission_id` | INTEGER | NO | FK | Foreign key to rma_submissions.id |
| `original_filename` | VARCHAR(255) | NO | - | Original filename from upload |
| `file_type` | VARCHAR(50) | YES | NULL | Type: spreadsheet, document, image, video, other |
| `file_size_bytes` | BIGINT | YES | NULL | File size in bytes |
| `mime_type` | VARCHAR(100) | YES | NULL | MIME type (e.g., "application/vnd.ms-excel") |
| `local_path` | TEXT | NO | - | Full path to file on server |
| `storage_url` | TEXT | YES | NULL | URL if stored in cloud (Supabase Storage) |
| `processing_status` | VARCHAR(50) | YES | 'PENDING' | PENDING, PROCESSING, PROCESSED, FAILED |
| `extracted_data` | JSONB | YES | NULL | Parsed data from file |
| `devices_extracted` | INTEGER | YES | 0 | Number of devices extracted from file |
| `processing_error` | TEXT | YES | NULL | Error message if processing failed |
| `uploaded_at` | TIMESTAMP | YES | NOW() | Upload timestamp |

**Indexes**:
- PRIMARY KEY (`id`)
- FOREIGN KEY (`submission_id`) REFERENCES `rma_submissions(id)` ON DELETE CASCADE
- INDEX (`submission_id`)
- INDEX (`processing_status`)

**Sample Row**:
```sql
{
  id: 1,
  submission_id: 1,
  original_filename: 'devices.xlsx',
  file_type: 'spreadsheet',
  file_size_bytes: 15420,
  mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  local_path: '/uploads/1731496200000_devices.xlsx',
  storage_url: null,
  processing_status: 'PROCESSED',
  extracted_data: {...}, // JSONB object
  devices_extracted: 50,
  processing_error: null,
  uploaded_at: '2025-11-13T10:30:00.000Z'
}
```

---

## Relationships

```
rma_submissions (1) ←→ (Many) rma_devices
    └─→ (Many) rma_files

One submission has many devices
One submission has many files
```

**Foreign Keys**:
- `rma_devices.submission_id` → `rma_submissions.id` (CASCADE DELETE)
- `rma_files.submission_id` → `rma_submissions.id` (CASCADE DELETE)

**Cascade Delete**: When a submission is deleted, all related devices and files are automatically deleted.

---

## Common Queries

### Get All Submissions with Device Count

```sql
SELECT
    s.*,
    COUNT(d.id) as device_count
FROM rma_submissions s
LEFT JOIN rma_devices d ON s.id = d.submission_id
GROUP BY s.id
ORDER BY s.created_at DESC
LIMIT 50;
```

### Get Submission with All Devices

```sql
SELECT
    s.*,
    json_agg(d.*) as devices
FROM rma_submissions s
LEFT JOIN rma_devices d ON s.id = d.submission_id
WHERE s.reference_number = 'RMA-1M8X9C2-A3F5'
GROUP BY s.id;
```

### Get Submissions with File Count

```sql
SELECT
    s.*,
    COUNT(f.id) as file_count
FROM rma_submissions s
LEFT JOIN rma_files f ON s.id = f.submission_id
GROUP BY s.id
ORDER BY s.created_at DESC;
```

### Get Invalid IMEIs Needing Review

```sql
SELECT
    d.*,
    s.company_name,
    s.reference_number
FROM rma_devices d
JOIN rma_submissions s ON d.submission_id = s.id
WHERE d.imei_valid = false
OR d.requires_imei_review = true
ORDER BY d.created_at DESC;
```

### Get Statistics

```sql
SELECT
    COUNT(*) as total_submissions,
    SUM(total_devices) as total_devices,
    COUNT(CASE WHEN overall_status IN ('SUBMITTED', 'PENDING') THEN 1 END) as pending,
    COUNT(CASE WHEN overall_status = 'APPROVED' THEN 1 END) as approved,
    COUNT(CASE WHEN overall_status = 'DENIED' THEN 1 END) as denied
FROM rma_submissions;
```

### Update Submission Status

```sql
UPDATE rma_submissions
SET
    overall_status = 'APPROVED',
    updated_at = NOW()
WHERE reference_number = 'RMA-1M8X9C2-A3F5';
```

---

## Setup Script

Located at: `/Users/brandonin/scal rma dashboard/scripts/setup-database.js`

Run with:
```bash
npm run setup-db
```

Creates all tables with proper indexes and constraints.

---

## Access via Supabase Client

**File**: `services/supabase-client.js`

### Initialize Client

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
```

### Create Submission

```javascript
const { data, error } = await supabase
    .from('rma_submissions')
    .insert([{
        reference_number: 'RMA-1M8X9C2-A3F5',
        company_name: 'Tech Solutions Inc',
        company_email: 'returns@techsolutions.com',
        order_number: 'SO-2025-001',
        customer_type: 'US',
        overall_status: 'SUBMITTED'
    }])
    .select()
    .single();
```

### Add Devices

```javascript
const { data, error } = await supabase
    .from('rma_devices')
    .insert(deviceRecords)
    .select();
```

### Query Submissions

```javascript
const { data, error } = await supabase
    .from('rma_submissions')
    .select('*, rma_devices(count)')
    .order('created_at', { ascending: false })
    .range(0, 49); // First 50
```

---

## Backup & Restore

### Export Data (Supabase Dashboard)

1. Go to Supabase Dashboard
2. SQL Editor
3. Run export query
4. Download results as CSV

### Backup Query

```sql
COPY (
    SELECT * FROM rma_submissions
) TO '/tmp/submissions_backup.csv' WITH CSV HEADER;
```

---

## Migration Notes

### From Local JSON to Supabase

Script: `migrate-local-to-supabase.js`

Migrates data from `uploads/submissions.json` to Supabase tables.

---

**Last Updated**: November 2025
**Database**: Supabase PostgreSQL
**Schema Version**: 1.2.0
