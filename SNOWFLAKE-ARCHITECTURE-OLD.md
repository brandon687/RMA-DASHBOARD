# Snowflake Data Architecture for SCal Mobile RMA Dashboard

## 1. Complete Data Model

### 1.1 Data Fields to Capture

#### Customer Information
- `company_name` (VARCHAR(255)) - Required
- `company_email` (VARCHAR(255)) - Required, validated format
- `contact_phone` (VARCHAR(50)) - Optional
- `contact_person` (VARCHAR(255)) - Optional
- `customer_type` (ENUM: 'US', 'INTERNATIONAL') - Required
- `customer_id` (VARCHAR(100)) - If available from CRM

#### RMA Request Information
- `rma_id` (VARCHAR(50)) - Primary key, format: RMA-YYYYMMDD-HHMMSS-XXXX
- `order_number` (VARCHAR(100)) - Required
- `submission_date` (TIMESTAMP_NTZ) - Auto-generated
- `requested_action` (ENUM: 'REFUND', 'REPLACEMENT', 'CREDIT', 'REPAIR')
- `priority` (ENUM: 'STANDARD', 'EXPEDITED', 'URGENT')
- `quantity_to_return` (NUMBER) - Required
- `estimated_return_value` (DECIMAL(10,2))

#### Device Information (from parsed CSV/Excel)
- `imei` (VARCHAR(20)) - Primary identifier for device
- `device_model` (VARCHAR(255))
- `device_manufacturer` (VARCHAR(100))
- `issue_description` (TEXT)
- `condition` (ENUM: 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED')
- `original_purchase_price` (DECIMAL(10,2))
- `serial_number` (VARCHAR(100))
- `carrier` (VARCHAR(100))
- `storage_capacity` (VARCHAR(20))
- `color` (VARCHAR(50))

#### File Upload Metadata
- `file_id` (UUID)
- `original_filename` (VARCHAR(500))
- `file_type` (VARCHAR(50))
- `file_size_bytes` (NUMBER)
- `s3_bucket` (VARCHAR(255))
- `s3_key` (VARCHAR(1000))
- `upload_timestamp` (TIMESTAMP_NTZ)
- `processing_status` (ENUM: 'UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED')

#### Processing Metadata
- `created_at` (TIMESTAMP_NTZ)
- `updated_at` (TIMESTAMP_NTZ)
- `processed_by` (VARCHAR(100)) - System or user ID
- `ip_address` (VARCHAR(45)) - For audit
- `user_agent` (VARCHAR(500)) - Browser info
- `session_id` (VARCHAR(100))

## 2. Snowflake Schema Design

### 2.1 Database Structure

```sql
-- Production Database
CREATE DATABASE IF NOT EXISTS SCAL_RMA_PROD;
USE DATABASE SCAL_RMA_PROD;

-- Schemas
CREATE SCHEMA IF NOT EXISTS RAW;        -- Raw data ingestion
CREATE SCHEMA IF NOT EXISTS STAGING;    -- Data transformation
CREATE SCHEMA IF NOT EXISTS CORE;       -- Core business tables
CREATE SCHEMA IF NOT EXISTS ANALYTICS;  -- Reporting views
CREATE SCHEMA IF NOT EXISTS AUDIT;      -- Audit and logging
```

### 2.2 Core Tables Design

#### Fact Table: RMA Submissions
```sql
CREATE OR REPLACE TABLE CORE.FACT_RMA_SUBMISSIONS (
    -- Primary Key
    rma_submission_key NUMBER AUTOINCREMENT PRIMARY KEY,
    rma_id VARCHAR(50) UNIQUE NOT NULL,

    -- Foreign Keys
    customer_key NUMBER,
    date_key NUMBER,

    -- Degenerate Dimensions
    order_number VARCHAR(100) NOT NULL,

    -- Measures
    total_devices_count NUMBER,
    estimated_total_value DECIMAL(12,2),
    actual_return_value DECIMAL(12,2),
    processing_time_hours NUMBER,

    -- Status & Timestamps
    submission_status VARCHAR(50),
    submission_timestamp TIMESTAMP_NTZ,
    completed_timestamp TIMESTAMP_NTZ,

    -- Metadata
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
) CLUSTER BY (submission_timestamp);

-- Add partitioning by month
ALTER TABLE CORE.FACT_RMA_SUBMISSIONS
ADD SEARCH OPTIMIZATION ON EQUALITY(rma_id, order_number);
```

#### Dimension Table: Customers
```sql
CREATE OR REPLACE TABLE CORE.DIM_CUSTOMERS (
    customer_key NUMBER AUTOINCREMENT PRIMARY KEY,
    customer_id VARCHAR(100),
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    contact_person VARCHAR(255),
    customer_type VARCHAR(20) NOT NULL,
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),

    -- SCD Type 2 fields
    effective_date DATE,
    expiry_date DATE,
    is_current BOOLEAN,

    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
) CLUSTER BY (customer_type, is_current);
```

#### Fact Table: Device Returns
```sql
CREATE OR REPLACE TABLE CORE.FACT_DEVICE_RETURNS (
    device_return_key NUMBER AUTOINCREMENT PRIMARY KEY,
    rma_submission_key NUMBER NOT NULL,

    -- Device Identifiers
    imei VARCHAR(20) NOT NULL,
    serial_number VARCHAR(100),

    -- Device Attributes
    device_model VARCHAR(255),
    device_manufacturer VARCHAR(100),
    storage_capacity VARCHAR(20),
    color VARCHAR(50),
    carrier VARCHAR(100),

    -- Return Details
    issue_description TEXT,
    condition VARCHAR(50),
    requested_action VARCHAR(50),

    -- Financial
    original_purchase_price DECIMAL(10,2),
    assessed_value DECIMAL(10,2),
    refund_amount DECIMAL(10,2),

    -- Processing
    inspection_status VARCHAR(50),
    inspection_notes TEXT,
    resolution VARCHAR(100),

    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),

    FOREIGN KEY (rma_submission_key) REFERENCES CORE.FACT_RMA_SUBMISSIONS(rma_submission_key)
);

CREATE INDEX idx_device_imei ON CORE.FACT_DEVICE_RETURNS(imei);
CREATE INDEX idx_device_model ON CORE.FACT_DEVICE_RETURNS(device_model);
```

#### File Upload Tracking
```sql
CREATE OR REPLACE TABLE CORE.FILE_UPLOADS (
    file_id VARCHAR(100) PRIMARY KEY DEFAULT UUID_STRING(),
    rma_submission_key NUMBER NOT NULL,

    -- File Metadata
    original_filename VARCHAR(500),
    file_type VARCHAR(50),
    file_size_bytes NUMBER,
    mime_type VARCHAR(100),

    -- Storage
    storage_type VARCHAR(50), -- 'S3', 'SNOWFLAKE_STAGE', 'LOCAL'
    storage_path VARCHAR(1000),
    s3_bucket VARCHAR(255),
    s3_key VARCHAR(1000),

    -- Processing
    processing_status VARCHAR(50),
    processed_at TIMESTAMP_NTZ,
    extracted_records_count NUMBER,
    error_message TEXT,

    -- Audit
    uploaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    uploaded_by VARCHAR(100),

    FOREIGN KEY (rma_submission_key) REFERENCES CORE.FACT_RMA_SUBMISSIONS(rma_submission_key)
);
```

### 2.3 Staging Tables for ETL

```sql
-- Raw JSON ingestion from Node.js
CREATE OR REPLACE TABLE STAGING.RAW_SUBMISSIONS (
    id NUMBER AUTOINCREMENT PRIMARY KEY,
    submission_json VARIANT,
    source_system VARCHAR(50),
    ingestion_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    processing_status VARCHAR(50) DEFAULT 'PENDING'
);

-- Parsed device data from CSV/Excel
CREATE OR REPLACE TABLE STAGING.DEVICE_UPLOAD_STAGING (
    staging_id NUMBER AUTOINCREMENT PRIMARY KEY,
    rma_id VARCHAR(50),
    file_id VARCHAR(100),
    row_number NUMBER,
    device_data VARIANT,
    validation_status VARCHAR(50),
    validation_errors VARIANT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### 2.4 Analytics Views

```sql
-- Daily RMA Summary
CREATE OR REPLACE VIEW ANALYTICS.V_DAILY_RMA_SUMMARY AS
SELECT
    DATE(submission_timestamp) as submission_date,
    customer_type,
    COUNT(DISTINCT rma_id) as total_submissions,
    SUM(total_devices_count) as total_devices,
    AVG(estimated_total_value) as avg_return_value,
    COUNT(CASE WHEN submission_status = 'COMPLETED' THEN 1 END) as completed_count,
    AVG(processing_time_hours) as avg_processing_hours
FROM CORE.FACT_RMA_SUBMISSIONS
GROUP BY 1, 2;

-- Device Return Analytics
CREATE OR REPLACE VIEW ANALYTICS.V_DEVICE_RETURN_METRICS AS
SELECT
    device_manufacturer,
    device_model,
    condition,
    COUNT(*) as return_count,
    AVG(assessed_value) as avg_assessed_value,
    MODE(issue_description) as most_common_issue,
    AVG(DATEDIFF('day', f.submission_timestamp, CURRENT_TIMESTAMP())) as avg_days_in_process
FROM CORE.FACT_DEVICE_RETURNS d
JOIN CORE.FACT_RMA_SUBMISSIONS f ON d.rma_submission_key = f.rma_submission_key
GROUP BY 1, 2, 3;
```

## 3. Data Flow Architecture

### 3.1 Ingestion Pipeline

```
Customer Form Submission
        ↓
    Node.js API
        ↓
    Validation Layer
        ↓
    Queue (Bull/RabbitMQ)
        ↓
    Processing Workers
        ↓
    Snowflake Staging
        ↓
    ETL/Transformation
        ↓
    Core Tables
        ↓
    Analytics Views
```

### 3.2 Partitioning Strategy

- **Time-based partitioning**: Partition FACT_RMA_SUBMISSIONS by month
- **Clustering**: Cluster by submission_timestamp for time-series queries
- **Micro-partitions**: Let Snowflake auto-manage for optimal performance

### 3.3 Index Recommendations

- Search optimization on high-cardinality lookup fields (rma_id, order_number, imei)
- Clustering keys on frequently filtered columns
- Materialized views for complex aggregations

## 4. Security & Compliance

### 4.1 Data Classification

```sql
-- Apply data classification tags
ALTER TABLE CORE.DIM_CUSTOMERS MODIFY COLUMN company_email
SET TAG CLASSIFICATION = 'PII';

ALTER TABLE CORE.DIM_CUSTOMERS MODIFY COLUMN contact_phone
SET TAG CLASSIFICATION = 'PII';

ALTER TABLE CORE.FACT_DEVICE_RETURNS MODIFY COLUMN imei
SET TAG CLASSIFICATION = 'SENSITIVE';
```

### 4.2 Access Control

```sql
-- Create roles
CREATE ROLE IF NOT EXISTS RMA_READ_ONLY;
CREATE ROLE IF NOT EXISTS RMA_ANALYST;
CREATE ROLE IF NOT EXISTS RMA_ADMIN;
CREATE ROLE IF NOT EXISTS RMA_SERVICE_ACCOUNT;

-- Grant permissions
GRANT USAGE ON DATABASE SCAL_RMA_PROD TO ROLE RMA_READ_ONLY;
GRANT SELECT ON ALL TABLES IN SCHEMA ANALYTICS TO ROLE RMA_READ_ONLY;

GRANT ALL ON SCHEMA STAGING TO ROLE RMA_SERVICE_ACCOUNT;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA CORE TO ROLE RMA_SERVICE_ACCOUNT;
```

## 5. Performance Optimization

### 5.1 Query Optimization
- Use result caching for frequently accessed analytics
- Implement query tags for monitoring
- Set appropriate warehouse sizes for workloads

### 5.2 Data Retention
```sql
-- Set data retention for recovery
ALTER TABLE CORE.FACT_RMA_SUBMISSIONS SET DATA_RETENTION_TIME_IN_DAYS = 90;
ALTER TABLE CORE.FACT_DEVICE_RETURNS SET DATA_RETENTION_TIME_IN_DAYS = 90;

-- Archive old data to cheaper storage
CREATE OR REPLACE TABLE ARCHIVE.FACT_RMA_SUBMISSIONS_ARCHIVE CLONE CORE.FACT_RMA_SUBMISSIONS;
```

## 6. Monitoring & Alerts

### 6.1 Data Quality Checks
```sql
-- Create data quality monitoring table
CREATE OR REPLACE TABLE AUDIT.DATA_QUALITY_CHECKS (
    check_id NUMBER AUTOINCREMENT PRIMARY KEY,
    check_name VARCHAR(100),
    check_query TEXT,
    expected_result VARCHAR(100),
    actual_result VARCHAR(100),
    check_status VARCHAR(20),
    check_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Example quality check procedure
CREATE OR REPLACE PROCEDURE AUDIT.CHECK_DUPLICATE_SUBMISSIONS()
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT rma_id, COUNT(*) as cnt
        FROM CORE.FACT_RMA_SUBMISSIONS
        GROUP BY rma_id
        HAVING COUNT(*) > 1
    );

    IF (duplicate_count > 0) THEN
        RETURN 'ALERT: Found ' || duplicate_count || ' duplicate RMA IDs';
    ELSE
        RETURN 'OK: No duplicates found';
    END IF;
END;
$$;
```

### 6.2 Performance Monitoring
```sql
-- Monitor query performance
CREATE OR REPLACE VIEW AUDIT.V_SLOW_QUERIES AS
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    execution_time,
    queued_provisioning_time,
    compilation_time,
    total_elapsed_time/1000 as total_seconds,
    rows_produced,
    bytes_scanned
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE total_elapsed_time > 30000 -- Queries taking more than 30 seconds
    AND start_time >= DATEADD('day', -7, CURRENT_TIMESTAMP())
ORDER BY total_elapsed_time DESC;
```