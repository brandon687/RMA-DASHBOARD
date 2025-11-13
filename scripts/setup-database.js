#!/usr/bin/env node

/**
 * Automated Database Setup Script for SCal RMA Platform
 *
 * This script will:
 * 1. Test connection to Supabase/PostgreSQL
 * 2. Create all required tables
 * 3. Create indexes for performance
 * 4. Create functions and triggers
 * 5. Create views
 * 6. Create default admin user
 * 7. Verify setup
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(message) {
    console.log(`${colors.cyan}▸${colors.reset} ${message}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠${colors.reset}  ${message}`);
}

class DatabaseSetup {
    constructor() {
        if (!process.env.DATABASE_URL) {
            logError('DATABASE_URL not found in .env file');
            log('\nPlease add DATABASE_URL to your .env file:', 'yellow');
            log('DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n', 'cyan');
            process.exit(1);
        }

        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        this.stats = {
            tables: 0,
            indexes: 0,
            functions: 0,
            triggers: 0,
            views: 0
        };
    }

    async run() {
        try {
            log('\n🚀 SCal RMA Database Setup', 'bright');
            log('━'.repeat(80), 'cyan');
            log('');

            // Step 1: Test connection
            await this.testConnection();

            // Step 2: Create tables
            await this.createTables();

            // Step 3: Create indexes
            await this.createIndexes();

            // Step 4: Create functions
            await this.createFunctions();

            // Step 5: Create triggers
            await this.createTriggers();

            // Step 6: Create views
            await this.createViews();

            // Step 7: Create admin user
            await this.createAdminUser();

            // Step 8: Verify setup
            await this.verifySetup();

            // Final summary
            this.printSummary();

            await this.pool.end();
            process.exit(0);

        } catch (error) {
            logError(`Setup failed: ${error.message}`);
            console.error(error);
            await this.pool.end();
            process.exit(1);
        }
    }

    async testConnection() {
        logStep('Testing database connection...');
        try {
            const result = await this.pool.query('SELECT NOW()');
            logSuccess(`Connected to Supabase successfully`);
            log(`   Current time: ${result.rows[0].now}`, 'cyan');
        } catch (error) {
            logError('Connection failed');
            throw error;
        }
    }

    async createTables() {
        log('\n📊 Creating tables...', 'bright');

        const tables = [
            {
                name: 'rma_submissions',
                sql: `
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
                    )
                `
            },
            {
                name: 'rma_devices',
                sql: `
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
                    )
                `
            },
            {
                name: 'rma_files',
                sql: `
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
                    )
                `
            },
            {
                name: 'status_history',
                sql: `
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
                    )
                `
            },
            {
                name: 'duplicate_checks',
                sql: `
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
                    )
                `
            },
            {
                name: 'sync_retry_queue',
                sql: `
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
                    )
                `
            },
            {
                name: 'admin_users',
                sql: `
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
                    )
                `
            }
        ];

        for (const table of tables) {
            try {
                await this.pool.query(table.sql);
                logSuccess(`Created ${table.name} table`);
                this.stats.tables++;
            } catch (error) {
                if (error.message.includes('already exists')) {
                    log(`   ${table.name} already exists`, 'yellow');
                } else {
                    throw error;
                }
            }
        }
    }

    async createIndexes() {
        log('\n🔍 Creating indexes...', 'bright');

        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_submissions_reference ON rma_submissions(reference_number)',
            'CREATE INDEX IF NOT EXISTS idx_submissions_status ON rma_submissions(overall_status)',
            'CREATE INDEX IF NOT EXISTS idx_submissions_date ON rma_submissions(submission_date)',
            'CREATE INDEX IF NOT EXISTS idx_submissions_email ON rma_submissions(company_email)',
            'CREATE INDEX IF NOT EXISTS idx_devices_submission ON rma_devices(submission_id)',
            'CREATE INDEX IF NOT EXISTS idx_devices_imei ON rma_devices(imei)',
            'CREATE INDEX IF NOT EXISTS idx_devices_status ON rma_devices(approval_status)',
            'CREATE INDEX IF NOT EXISTS idx_devices_reference ON rma_devices(reference_number)',
            'CREATE INDEX IF NOT EXISTS idx_devices_snowflake_sync ON rma_devices(snowflake_synced)',
            'CREATE INDEX IF NOT EXISTS idx_files_submission ON rma_files(submission_id)',
            'CREATE INDEX IF NOT EXISTS idx_files_processing_status ON rma_files(processing_status)',
            'CREATE INDEX IF NOT EXISTS idx_history_device ON status_history(device_id)',
            'CREATE INDEX IF NOT EXISTS idx_history_changed_at ON status_history(changed_at)',
            'CREATE INDEX IF NOT EXISTS idx_duplicates_imei ON duplicate_checks(imei)',
            'CREATE INDEX IF NOT EXISTS idx_retry_status ON sync_retry_queue(status)'
        ];

        for (const index of indexes) {
            try {
                await this.pool.query(index);
                this.stats.indexes++;
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
        }

        logSuccess(`Created ${this.stats.indexes} indexes`);
    }

    async createFunctions() {
        log('\n⚙️  Creating functions...', 'bright');

        const functions = [
            {
                name: 'update_modified_column',
                sql: `
                    CREATE OR REPLACE FUNCTION update_modified_column()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = NOW();
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql
                `
            },
            {
                name: 'update_submission_counts',
                sql: `
                    CREATE OR REPLACE FUNCTION update_submission_counts()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        UPDATE rma_submissions
                        SET
                            approved_count = (
                                SELECT COUNT(*) FROM rma_devices
                                WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
                                AND approval_status = 'APPROVED'
                            ),
                            denied_count = (
                                SELECT COUNT(*) FROM rma_devices
                                WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
                                AND approval_status = 'DENIED'
                            ),
                            pending_count = (
                                SELECT COUNT(*) FROM rma_devices
                                WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
                                AND approval_status = 'PENDING'
                            ),
                            total_devices = (
                                SELECT COUNT(*) FROM rma_devices
                                WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id)
                            ),
                            updated_at = NOW()
                        WHERE id = COALESCE(NEW.submission_id, OLD.submission_id);
                        RETURN COALESCE(NEW, OLD);
                    END;
                    $$ LANGUAGE plpgsql
                `
            },
            {
                name: 'log_status_change',
                sql: `
                    CREATE OR REPLACE FUNCTION log_status_change()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
                            INSERT INTO status_history (
                                device_id, submission_id, old_status, new_status,
                                changed_by, change_reason, changed_at
                            ) VALUES (
                                NEW.id, NEW.submission_id,
                                OLD.approval_status::VARCHAR, NEW.approval_status::VARCHAR,
                                NEW.reviewed_by, NEW.admin_notes, NOW()
                            );
                        END IF;
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql
                `
            },
            {
                name: 'check_duplicate_imei',
                sql: `
                    CREATE OR REPLACE FUNCTION check_duplicate_imei(
                        p_imei VARCHAR(15),
                        p_exclude_device_id INTEGER DEFAULT NULL
                    )
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
                    $$ LANGUAGE plpgsql
                `
            }
        ];

        for (const func of functions) {
            await this.pool.query(func.sql);
            logSuccess(`Created function: ${func.name}`);
            this.stats.functions++;
        }
    }

    async createTriggers() {
        log('\n⚡ Creating triggers...', 'bright');

        const triggers = [
            {
                name: 'update_submissions_modtime',
                sql: `
                    DROP TRIGGER IF EXISTS update_submissions_modtime ON rma_submissions;
                    CREATE TRIGGER update_submissions_modtime
                        BEFORE UPDATE ON rma_submissions
                        FOR EACH ROW EXECUTE FUNCTION update_modified_column()
                `
            },
            {
                name: 'update_devices_modtime',
                sql: `
                    DROP TRIGGER IF EXISTS update_devices_modtime ON rma_devices;
                    CREATE TRIGGER update_devices_modtime
                        BEFORE UPDATE ON rma_devices
                        FOR EACH ROW EXECUTE FUNCTION update_modified_column()
                `
            },
            {
                name: 'update_retry_queue_modtime',
                sql: `
                    DROP TRIGGER IF EXISTS update_retry_queue_modtime ON sync_retry_queue;
                    CREATE TRIGGER update_retry_queue_modtime
                        BEFORE UPDATE ON sync_retry_queue
                        FOR EACH ROW EXECUTE FUNCTION update_modified_column()
                `
            },
            {
                name: 'update_admin_users_modtime',
                sql: `
                    DROP TRIGGER IF EXISTS update_admin_users_modtime ON admin_users;
                    CREATE TRIGGER update_admin_users_modtime
                        BEFORE UPDATE ON admin_users
                        FOR EACH ROW EXECUTE FUNCTION update_modified_column()
                `
            },
            {
                name: 'update_counts_on_device_change',
                sql: `
                    DROP TRIGGER IF EXISTS update_counts_on_device_change ON rma_devices;
                    CREATE TRIGGER update_counts_on_device_change
                        AFTER INSERT OR UPDATE OR DELETE ON rma_devices
                        FOR EACH ROW EXECUTE FUNCTION update_submission_counts()
                `
            },
            {
                name: 'log_device_status_change',
                sql: `
                    DROP TRIGGER IF EXISTS log_device_status_change ON rma_devices;
                    CREATE TRIGGER log_device_status_change
                        AFTER UPDATE ON rma_devices
                        FOR EACH ROW
                        WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
                        EXECUTE FUNCTION log_status_change()
                `
            }
        ];

        for (const trigger of triggers) {
            await this.pool.query(trigger.sql);
            logSuccess(`Created trigger: ${trigger.name}`);
            this.stats.triggers++;
        }
    }

    async createViews() {
        log('\n👁️  Creating views...', 'bright');

        const views = [
            {
                name: 'v_pending_reviews',
                sql: `
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
                    ORDER BY s.submission_date ASC
                `
            },
            {
                name: 'v_devices_pending_review',
                sql: `
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
                    ORDER BY d.created_at ASC
                `
            },
            {
                name: 'v_failed_syncs',
                sql: `
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
                    ORDER BY srq.created_at ASC
                `
            },
            {
                name: 'v_admin_dashboard',
                sql: `
                    CREATE OR REPLACE VIEW v_admin_dashboard AS
                    SELECT
                        (SELECT COUNT(*) FROM rma_devices WHERE approval_status = 'PENDING') AS pending_reviews,
                        (SELECT COUNT(*) FROM rma_devices WHERE approval_status = 'APPROVED' AND DATE(reviewed_at) = CURRENT_DATE) AS approved_today,
                        (SELECT COUNT(*) FROM rma_devices WHERE approval_status = 'DENIED' AND DATE(reviewed_at) = CURRENT_DATE) AS denied_today,
                        (SELECT COUNT(*) FROM sync_retry_queue WHERE status = 'FAILED' AND retry_count >= max_retries) AS failed_syncs,
                        (SELECT ROUND(CAST(AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) AS NUMERIC), 2)
                         FROM rma_devices
                         WHERE reviewed_at IS NOT NULL
                         AND reviewed_at > NOW() - INTERVAL '30 days') AS avg_review_time_hours
                `
            }
        ];

        for (const view of views) {
            await this.pool.query(view.sql);
            logSuccess(`Created view: ${view.name}`);
            this.stats.views++;
        }
    }

    async createAdminUser() {
        log('\n👤 Creating admin user...', 'bright');

        // Check if admin user already exists
        const checkResult = await this.pool.query(
            'SELECT email FROM admin_users WHERE email = $1',
            ['admin@scalmob.com']
        );

        if (checkResult.rows.length > 0) {
            logWarning('Admin user already exists');
            return;
        }

        // Hash default password
        const passwordHash = await bcrypt.hash('admin123', 10);

        await this.pool.query(`
            INSERT INTO admin_users (
                email, password_hash, full_name, role, can_override_duplicates
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'admin@scalmob.com',
            passwordHash,
            'System Administrator',
            'admin',
            true
        ]);

        logSuccess('Created admin user: admin@scalmob.com');
        logWarning('Default password: admin123 (CHANGE THIS!)');
    }

    async verifySetup() {
        log('\n🔍 Verifying setup...', 'bright');

        // Check all tables exist
        const tablesResult = await this.pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const expectedTables = [
            'admin_users',
            'duplicate_checks',
            'rma_devices',
            'rma_files',
            'rma_submissions',
            'status_history',
            'sync_retry_queue'
        ];

        const foundTables = tablesResult.rows.map(r => r.table_name);
        const missingTables = expectedTables.filter(t => !foundTables.includes(t));

        if (missingTables.length > 0) {
            throw new Error(`Missing tables: ${missingTables.join(', ')}`);
        }

        logSuccess('All tables verified');

        // Check admin user exists
        const adminResult = await this.pool.query(
            'SELECT COUNT(*) FROM admin_users'
        );

        if (parseInt(adminResult.rows[0].count) === 0) {
            throw new Error('No admin users found');
        }

        logSuccess('Admin user verified');
    }

    printSummary() {
        log('\n━'.repeat(80), 'cyan');
        log('✅ Setup complete! Your database is ready.\n', 'green');

        log('📊 Database Summary:', 'bright');
        log(`   • Tables: ${this.stats.tables}`);
        log(`   • Indexes: ${this.stats.indexes}`);
        log(`   • Views: ${this.stats.views}`);
        log(`   • Functions: ${this.stats.functions}`);
        log(`   • Triggers: ${this.stats.triggers}\n`);

        log('🔐 Admin Credentials:', 'bright');
        log('   Email: admin@scalmob.com', 'cyan');
        log('   Password: admin123', 'cyan');
        log('');
        logWarning('IMPORTANT: Change the admin password immediately!');
        log('');

        log('🌐 View your database:', 'bright');
        log('   https://supabase.com/dashboard\n', 'cyan');

        log('Next steps:', 'bright');
        log('1. Change admin password (see SUPABASE_SETUP.md)');
        log('2. Test the connection: node services/postgres-service.js');
        log('3. Start the server: npm start\n');
    }
}

// Run setup
const setup = new DatabaseSetup();
setup.run();
