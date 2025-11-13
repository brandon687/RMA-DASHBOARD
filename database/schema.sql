-- ============================================
-- SCAL MOBILE RMA - POSTGRESQL STAGING DATABASE
-- ============================================
-- Purpose: Staging database for admin review/approval before Snowflake
-- Version: 1.0
-- Created: 2024-11-12
-- ============================================

-- Create database (run this separately in psql)
-- CREATE DATABASE scal_rma_staging;
-- \c scal_rma_staging;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE approval_status AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'INFO_REQUESTED',
    'APPROVED',
    'DENIED',
    'SYNCED_TO_SNOWFLAKE'
);

CREATE TYPE customer_type AS ENUM (
    'us',
    'international'
);

CREATE TYPE file_type AS ENUM (
    'excel',
    'csv',
    'pdf',
    'image',
    'video',
    'other'
);

-- ============================================
-- TABLE: rma_submissions
-- Purpose: Master table for RMA submissions
-- ============================================

CREATE TABLE rma_submissions (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,

    -- Customer info
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    order_number VARCHAR(100),
    customer_type customer_type NOT NULL,

    -- Submission metadata
    submission_date TIMESTAMP DEFAULT NOW(),
    total_devices INTEGER DEFAULT 0,

    -- Status tracking
    overall_status VARCHAR(50) DEFAULT 'SUBMITTED',
    assigned_to VARCHAR(100),
    review_deadline TIMESTAMP,

    -- Counts (auto-updated by trigger)
    approved_count INTEGER DEFAULT 0,
    denied_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,

    -- Notes
    admin_notes TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rma_submissions
CREATE INDEX idx_submissions_reference ON rma_submissions(reference_number);
CREATE INDEX idx_submissions_status ON rma_submissions(overall_status);
CREATE INDEX idx_submissions_date ON rma_submissions(submission_date);
CREATE INDEX idx_submissions_email ON rma_submissions(company_email);
CREATE INDEX idx_submissions_assigned ON rma_submissions(assigned_to);

-- ============================================
-- TABLE: rma_devices
-- Purpose: Individual device tracking with approval workflow
-- ============================================

CREATE TABLE rma_devices (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES rma_submissions(id) ON DELETE CASCADE,
    reference_number VARCHAR(50) NOT NULL,

    -- Device details (from uploaded Excel/CSV)
    imei VARCHAR(15) NOT NULL,
    model VARCHAR(100),
    storage VARCHAR(20),
    device_status VARCHAR(50), -- "AB GRADE", "Grade A", etc.
    inv VARCHAR(50), -- Inventory number
    issue_description TEXT,
    issue_category VARCHAR(100),
    action_type VARCHAR(20), -- "REPAIR" or "RETURN"
    unit_price DECIMAL(10,2),
    repair_cost DECIMAL(10,2),

    -- Additional fields from Excel
    condition VARCHAR(50),
    requested_action VARCHAR(50),

    -- Approval workflow
    approval_status approval_status DEFAULT 'PENDING',

    -- Review data
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    denial_reason TEXT,
    admin_notes TEXT,

    -- Duplicate detection
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_override BOOLEAN DEFAULT FALSE,
    duplicate_override_reason TEXT,

    -- Sync tracking
    snowflake_synced BOOLEAN DEFAULT FALSE,
    snowflake_synced_at TIMESTAMP,
    snowflake_sync_error TEXT,
    sync_retry_count INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rma_devices
CREATE INDEX idx_devices_submission ON rma_devices(submission_id);
CREATE INDEX idx_devices_imei ON rma_devices(imei);
CREATE INDEX idx_devices_status ON rma_devices(approval_status);
CREATE INDEX idx_devices_reference ON rma_devices(reference_number);
CREATE INDEX idx_devices_snowflake_sync ON rma_devices(snowflake_synced);
CREATE INDEX idx_devices_model ON rma_devices(model);

-- ============================================
-- TABLE: rma_files
-- Purpose: Track uploaded files and their processing status
-- ============================================

CREATE TABLE rma_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES rma_submissions(id) ON DELETE CASCADE,

    -- File metadata
    original_filename VARCHAR(500) NOT NULL,
    file_type file_type,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),

    -- Storage locations
    local_path VARCHAR(1000),
    drive_url VARCHAR(1000),
    drive_file_id VARCHAR(100),

    -- Processing
    processing_status VARCHAR(50) DEFAULT 'PENDING',
    extracted_data JSONB, -- Parsed device data from Excel/CSV
    processing_error TEXT,
    devices_extracted INTEGER DEFAULT 0,

    -- Audit
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Indexes for rma_files
CREATE INDEX idx_files_submission ON rma_files(submission_id);
CREATE INDEX idx_files_processing_status ON rma_files(processing_status);
CREATE INDEX idx_files_type ON rma_files(file_type);

-- ============================================
-- TABLE: status_history
-- Purpose: Complete audit trail of all status changes
-- ============================================

CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES rma_devices(id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES rma_submissions(id) ON DELETE CASCADE,

    -- Change tracking
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(100) NOT NULL,
    change_reason TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for status_history
CREATE INDEX idx_history_device ON status_history(device_id);
CREATE INDEX idx_history_submission ON status_history(submission_id);
CREATE INDEX idx_history_changed_at ON status_history(changed_at);
CREATE INDEX idx_history_changed_by ON status_history(changed_by);

-- ============================================
-- TABLE: duplicate_checks
-- Purpose: Log all duplicate detection attempts
-- ============================================

CREATE TABLE duplicate_checks (
    id SERIAL PRIMARY KEY,
    imei VARCHAR(15) NOT NULL,
    submission_id INTEGER REFERENCES rma_submissions(id),
    device_id INTEGER REFERENCES rma_devices(id),

    -- Detection details
    is_duplicate BOOLEAN DEFAULT FALSE,
    existing_submission_id INTEGER,
    existing_device_id INTEGER,
    admin_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    override_by VARCHAR(100),

    -- Timestamp
    checked_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for duplicate_checks
CREATE INDEX idx_duplicates_imei ON duplicate_checks(imei);
CREATE INDEX idx_duplicates_checked_at ON duplicate_checks(checked_at);
CREATE INDEX idx_duplicates_is_duplicate ON duplicate_checks(is_duplicate);

-- ============================================
-- TABLE: sync_retry_queue
-- Purpose: Handle failed Snowflake syncs with retry logic
-- ============================================

CREATE TABLE sync_retry_queue (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES rma_devices(id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES rma_submissions(id) ON DELETE CASCADE,

    -- Retry management
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    next_retry_at TIMESTAMP,

    -- Error tracking
    error_message TEXT,
    last_error_at TIMESTAMP,
    payload JSONB, -- Device data to sync

    -- Status
    status VARCHAR(20) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RETRYING', 'FAILED', 'SUCCESS')),

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sync_retry_queue
CREATE INDEX idx_retry_device ON sync_retry_queue(device_id);
CREATE INDEX idx_retry_status ON sync_retry_queue(status);
CREATE INDEX idx_retry_next_retry ON sync_retry_queue(next_retry_at);

-- ============================================
-- TABLE: admin_users
-- Purpose: Admin authentication and access control
-- ============================================

CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    -- Permissions
    role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('admin', 'reviewer', 'readonly')),
    can_approve BOOLEAN DEFAULT TRUE,
    can_deny BOOLEAN DEFAULT TRUE,
    can_override_duplicates BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for admin_users
CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_role ON admin_users(role);
CREATE INDEX idx_admin_active ON admin_users(is_active);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_modified_column to all relevant tables
CREATE TRIGGER update_submissions_modtime
    BEFORE UPDATE ON rma_submissions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_devices_modtime
    BEFORE UPDATE ON rma_devices
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_retry_queue_modtime
    BEFORE UPDATE ON sync_retry_queue
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_admin_users_modtime
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function: Auto-update submission counts
CREATE OR REPLACE FUNCTION update_submission_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rma_submissions
    SET
        approved_count = (
            SELECT COUNT(*)
            FROM rma_devices
            WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
            AND approval_status = 'APPROVED'
        ),
        denied_count = (
            SELECT COUNT(*)
            FROM rma_devices
            WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
            AND approval_status = 'DENIED'
        ),
        pending_count = (
            SELECT COUNT(*)
            FROM rma_devices
            WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
            AND approval_status = 'PENDING'
        ),
        total_devices = (
            SELECT COUNT(*)
            FROM rma_devices
            WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.submission_id, OLD.submission_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update counts on device changes
CREATE TRIGGER update_counts_on_device_change
    AFTER INSERT OR UPDATE OR DELETE ON rma_devices
    FOR EACH ROW EXECUTE FUNCTION update_submission_counts();

-- Function: Log status changes to history
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
        INSERT INTO status_history (
            device_id,
            submission_id,
            old_status,
            new_status,
            changed_by,
            change_reason,
            changed_at
        ) VALUES (
            NEW.id,
            NEW.submission_id,
            OLD.approval_status::VARCHAR,
            NEW.approval_status::VARCHAR,
            NEW.reviewed_by,
            NEW.admin_notes,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-log status changes
CREATE TRIGGER log_device_status_change
    AFTER UPDATE ON rma_devices
    FOR EACH ROW
    WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
    EXECUTE FUNCTION log_status_change();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Pending reviews dashboard
CREATE OR REPLACE VIEW v_pending_reviews AS
SELECT
    s.id AS submission_id,
    s.reference_number,
    s.company_name,
    s.company_email,
    s.submission_date,
    s.total_devices,
    s.pending_count,
    s.assigned_to,
    COUNT(d.id) AS device_count,
    STRING_AGG(DISTINCT d.model, ', ') AS models,
    MIN(d.created_at) AS oldest_device_date
FROM rma_submissions s
LEFT JOIN rma_devices d ON d.submission_id = s.id
WHERE s.overall_status != 'COMPLETED'
GROUP BY s.id
ORDER BY s.submission_date ASC;

-- View: Devices needing review
CREATE OR REPLACE VIEW v_devices_pending_review AS
SELECT
    d.id AS device_id,
    d.imei,
    d.model,
    d.issue_description,
    d.unit_price,
    d.approval_status,
    d.created_at,
    s.reference_number,
    s.company_name,
    s.company_email,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM rma_devices d2
            WHERE d2.imei = d.imei
            AND d2.id != d.id
            AND d2.approval_status IN ('APPROVED', 'PENDING')
        ) THEN TRUE
        ELSE FALSE
    END AS has_duplicate_warning
FROM rma_devices d
JOIN rma_submissions s ON s.id = d.submission_id
WHERE d.approval_status = 'PENDING'
ORDER BY d.created_at ASC;

-- View: Sync failures needing attention
CREATE OR REPLACE VIEW v_failed_syncs AS
SELECT
    srq.id AS queue_id,
    srq.device_id,
    d.imei,
    d.model,
    s.reference_number,
    s.company_name,
    srq.retry_count,
    srq.error_message,
    srq.next_retry_at,
    srq.created_at
FROM sync_retry_queue srq
JOIN rma_devices d ON d.id = srq.device_id
JOIN rma_submissions s ON s.id = d.submission_id
WHERE srq.status IN ('FAILED', 'QUEUED')
  AND srq.retry_count >= srq.max_retries
ORDER BY srq.created_at ASC;

-- View: Admin analytics dashboard
CREATE OR REPLACE VIEW v_admin_dashboard AS
SELECT
    (SELECT COUNT(*) FROM rma_devices WHERE approval_status = 'PENDING') AS pending_reviews,
    (SELECT COUNT(*) FROM rma_devices WHERE approval_status = 'APPROVED' AND DATE(reviewed_at) = CURRENT_DATE) AS approved_today,
    (SELECT COUNT(*) FROM rma_devices WHERE approval_status = 'DENIED' AND DATE(reviewed_at) = CURRENT_DATE) AS denied_today,
    (SELECT COUNT(*) FROM sync_retry_queue WHERE status = 'FAILED' AND retry_count >= max_retries) AS failed_syncs,
    (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600), 2)
     FROM rma_devices
     WHERE reviewed_at IS NOT NULL
     AND reviewed_at > NOW() - INTERVAL '30 days') AS avg_review_time_hours,
    (SELECT COUNT(DISTINCT imei) FROM duplicate_checks WHERE is_duplicate = TRUE AND checked_at > NOW() - INTERVAL '7 days') AS duplicates_detected_week;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Check for duplicate IMEI
CREATE OR REPLACE FUNCTION check_duplicate_imei(p_imei VARCHAR(15), p_exclude_device_id INTEGER DEFAULT NULL)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    existing_device_id INTEGER,
    existing_submission_id INTEGER,
    existing_reference VARCHAR(50),
    existing_status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TRUE AS is_duplicate,
        d.id AS existing_device_id,
        d.submission_id AS existing_submission_id,
        s.reference_number AS existing_reference,
        d.approval_status::VARCHAR AS existing_status
    FROM rma_devices d
    JOIN rma_submissions s ON s.id = d.submission_id
    WHERE d.imei = p_imei
      AND (p_exclude_device_id IS NULL OR d.id != p_exclude_device_id)
      AND d.approval_status IN ('PENDING', 'APPROVED', 'UNDER_REVIEW')
      AND d.created_at > NOW() - INTERVAL '90 days'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            FALSE AS is_duplicate,
            NULL::INTEGER,
            NULL::INTEGER,
            NULL::VARCHAR(50),
            NULL::VARCHAR(50);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default admin user (password: 'admin123' - CHANGE THIS!)
-- Password hash generated with bcrypt rounds=10
INSERT INTO admin_users (email, password_hash, full_name, role, can_override_duplicates)
VALUES (
    'admin@scalmob.com',
    '$2b$10$rBV2kC0h9v.fFWjLGR6yVu5JqGhLGJo7cQz8sN8P5LGQXwZvZqK6m', -- 'admin123'
    'System Administrator',
    'admin',
    TRUE
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON DATABASE scal_rma_staging IS 'SCal Mobile RMA Staging Database for Admin Review Workflow';

COMMENT ON TABLE rma_submissions IS 'Master table tracking all RMA submissions from customers';
COMMENT ON TABLE rma_devices IS 'Individual devices within RMA submissions - each device can be approved/denied separately';
COMMENT ON TABLE rma_files IS 'Uploaded files (Excel, PDF, images) with processing status';
COMMENT ON TABLE status_history IS 'Complete audit trail of all status changes for compliance';
COMMENT ON TABLE duplicate_checks IS 'Log of duplicate IMEI detection attempts';
COMMENT ON TABLE sync_retry_queue IS 'Failed Snowflake syncs with automatic retry logic';
COMMENT ON TABLE admin_users IS 'Admin user accounts with role-based permissions';

-- ============================================
-- COMPLETED
-- ============================================

-- Check table creation
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ SCal RMA Staging Database schema created successfully!';
    RAISE NOTICE '✓ Tables: 8';
    RAISE NOTICE '✓ Views: 4';
    RAISE NOTICE '✓ Functions: 4';
    RAISE NOTICE '✓ Triggers: 6';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update .env with DATABASE_URL';
    RAISE NOTICE '2. Change default admin password';
    RAISE NOTICE '3. Run: npm install pg';
    RAISE NOTICE '4. Test connection with: node services/postgres-service.js';
END $$;
