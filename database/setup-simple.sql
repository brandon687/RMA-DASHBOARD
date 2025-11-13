-- ============================================
-- SCAL RMA DATABASE - SIMPLE SETUP
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- Create rma_submissions table
CREATE TABLE IF NOT EXISTS rma_submissions (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    order_number VARCHAR(100),
    customer_type VARCHAR(20) CHECK (customer_type IN ('us', 'international')),
    submission_date TIMESTAMP DEFAULT NOW(),
    total_devices INTEGER DEFAULT 0,
    overall_status VARCHAR(50) DEFAULT 'SUBMITTED',
    assigned_to VARCHAR(100),
    review_deadline TIMESTAMP,
    approved_count INTEGER DEFAULT 0,
    denied_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create rma_devices table
CREATE TABLE IF NOT EXISTS rma_devices (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES rma_submissions(id) ON DELETE CASCADE,
    reference_number VARCHAR(50) NOT NULL,
    imei VARCHAR(15) NOT NULL,
    model VARCHAR(100),
    storage VARCHAR(20),
    device_status VARCHAR(50),
    inv VARCHAR(50),
    issue_description TEXT,
    issue_category VARCHAR(100),
    action_type VARCHAR(20),
    unit_price DECIMAL(10,2),
    repair_cost DECIMAL(10,2),
    condition VARCHAR(50),
    requested_action VARCHAR(50),
    approval_status VARCHAR(50) DEFAULT 'PENDING' CHECK (approval_status IN (
        'PENDING', 'UNDER_REVIEW', 'INFO_REQUESTED', 'APPROVED', 'DENIED', 'SYNCED_TO_SNOWFLAKE'
    )),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    denial_reason TEXT,
    admin_notes TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_override BOOLEAN DEFAULT FALSE,
    duplicate_override_reason TEXT,
    snowflake_synced BOOLEAN DEFAULT FALSE,
    snowflake_synced_at TIMESTAMP,
    snowflake_sync_error TEXT,
    sync_retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create rma_files table
CREATE TABLE IF NOT EXISTS rma_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES rma_submissions(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    local_path VARCHAR(1000),
    drive_url VARCHAR(1000),
    drive_file_id VARCHAR(100),
    processing_status VARCHAR(50) DEFAULT 'PENDING',
    extracted_data JSONB,
    processing_error TEXT,
    devices_extracted INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Create status_history table
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES rma_devices(id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES rma_submissions(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(100) NOT NULL,
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Create duplicate_checks table
CREATE TABLE IF NOT EXISTS duplicate_checks (
    id SERIAL PRIMARY KEY,
    imei VARCHAR(15) NOT NULL,
    submission_id INTEGER REFERENCES rma_submissions(id),
    device_id INTEGER REFERENCES rma_devices(id),
    is_duplicate BOOLEAN DEFAULT FALSE,
    existing_submission_id INTEGER,
    existing_device_id INTEGER,
    admin_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    override_by VARCHAR(100),
    checked_at TIMESTAMP DEFAULT NOW()
);

-- Create sync_retry_queue table
CREATE TABLE IF NOT EXISTS sync_retry_queue (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES rma_devices(id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES rma_submissions(id) ON DELETE CASCADE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    next_retry_at TIMESTAMP,
    error_message TEXT,
    last_error_at TIMESTAMP,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RETRYING', 'FAILED', 'SUCCESS')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('admin', 'reviewer', 'readonly')),
    can_approve BOOLEAN DEFAULT TRUE,
    can_deny BOOLEAN DEFAULT TRUE,
    can_override_duplicates BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_reference ON rma_submissions(reference_number);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON rma_submissions(overall_status);
CREATE INDEX IF NOT EXISTS idx_submissions_date ON rma_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON rma_submissions(company_email);
CREATE INDEX IF NOT EXISTS idx_devices_submission ON rma_devices(submission_id);
CREATE INDEX IF NOT EXISTS idx_devices_imei ON rma_devices(imei);
CREATE INDEX IF NOT EXISTS idx_devices_status ON rma_devices(approval_status);
CREATE INDEX IF NOT EXISTS idx_devices_reference ON rma_devices(reference_number);
CREATE INDEX IF NOT EXISTS idx_devices_snowflake_sync ON rma_devices(snowflake_synced);
CREATE INDEX IF NOT EXISTS idx_files_submission ON rma_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_files_processing_status ON rma_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_history_device ON status_history(device_id);
CREATE INDEX IF NOT EXISTS idx_history_changed_at ON status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_duplicates_imei ON duplicate_checks(imei);
CREATE INDEX IF NOT EXISTS idx_retry_status ON sync_retry_queue(status);

-- Create admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (email, password_hash, full_name, role, can_override_duplicates)
VALUES (
    'admin@scalmob.com',
    '$2b$10$rBV2kC0h9v.fFWjLGR6yVu5JqGhLGJo7cQz8sN8P5LGQXwZvZqK6m',
    'System Administrator',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Database setup complete!';
    RAISE NOTICE '✓ 7 tables created';
    RAISE NOTICE '✓ 15 indexes created';
    RAISE NOTICE '✓ Admin user created: admin@scalmob.com';
    RAISE NOTICE '✓ Default password: admin123 (CHANGE THIS!)';
END $$;
