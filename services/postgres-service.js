/**
 * PostgreSQL Service for SCal Mobile RMA Platform
 * Handles all database operations for the staging/review layer
 */

const { Pool } = require('pg');

class PostgresService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            },
            max: 20, // Maximum pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle PostgreSQL client', err);
        });
    }

    /**
     * Test database connection
     */
    async testConnection() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT NOW()');
            console.log('✓ PostgreSQL connected successfully at:', result.rows[0].now);
            return true;
        } catch (error) {
            console.error('✗ PostgreSQL connection failed:', error.message);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Create a new RMA submission
     * @param {Object} submission - Submission data
     * @returns {Promise<Object>} Created submission with ID
     */
    async createSubmission(submission) {
        const {
            referenceNumber,
            companyName,
            companyEmail,
            orderNumber,
            customerType
        } = submission;

        const query = `
            INSERT INTO rma_submissions (
                reference_number,
                company_name,
                company_email,
                order_number,
                customer_type,
                overall_status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            referenceNumber,
            companyName,
            companyEmail,
            orderNumber,
            customerType,
            'SUBMITTED'
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating submission:', error);
            throw error;
        }
    }

    /**
     * Add devices to a submission
     * @param {string} referenceNumber - RMA reference number
     * @param {Array} devices - Array of device objects
     * @returns {Promise<Array>} Created devices
     */
    async addDevices(referenceNumber, devices) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Get submission ID
            const submissionResult = await client.query(
                'SELECT id, submission_id FROM rma_submissions WHERE reference_number = $1',
                [referenceNumber]
            );

            if (submissionResult.rows.length === 0) {
                throw new Error(`Submission ${referenceNumber} not found`);
            }

            const submissionId = submissionResult.rows[0].id;
            const createdDevices = [];

            // Insert each device
            for (const device of devices) {
                const deviceQuery = `
                    INSERT INTO rma_devices (
                        submission_id,
                        reference_number,
                        imei,
                        model,
                        storage,
                        device_status,
                        inv,
                        issue_description,
                        issue_category,
                        action_type,
                        unit_price,
                        repair_cost,
                        condition,
                        requested_action,
                        approval_status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    RETURNING *
                `;

                const values = [
                    submissionId,
                    referenceNumber,
                    device.imei || device.IMEI,
                    device.model || device['Device Model'],
                    device.storage,
                    device.device_status || device['Device Status'],
                    device.inv,
                    device.issue_description || device['Issue Description'],
                    device.issue_category,
                    device.action_type,
                    device.unit_price,
                    device.repair_cost,
                    device.condition || device['Condition'],
                    device.requested_action || device['Requested Action'],
                    'PENDING'
                ];

                const result = await client.query(deviceQuery, values);
                createdDevices.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return createdDevices;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error adding devices:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Add file record
     * @param {Object} fileData - File metadata
     * @returns {Promise<Object>} Created file record
     */
    async addFile(fileData) {
        const query = `
            INSERT INTO rma_files (
                submission_id,
                original_filename,
                file_type,
                file_size_bytes,
                mime_type,
                local_path,
                drive_url,
                drive_file_id,
                processing_status,
                extracted_data,
                devices_extracted
            ) VALUES (
                (SELECT id FROM rma_submissions WHERE reference_number = $1),
                $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
            RETURNING *
        `;

        const values = [
            fileData.referenceNumber,
            fileData.originalFilename,
            fileData.fileType,
            fileData.fileSizeBytes,
            fileData.mimeType,
            fileData.localPath,
            fileData.driveUrl,
            fileData.driveFileId,
            fileData.processingStatus || 'PROCESSED',
            JSON.stringify(fileData.extractedData || {}),
            fileData.devicesExtracted || 0
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding file:', error);
            throw error;
        }
    }

    /**
     * Get all submissions with filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of submissions
     */
    async getSubmissions(filters = {}) {
        let query = `
            SELECT
                s.*,
                COUNT(d.id) AS device_count,
                STRING_AGG(DISTINCT d.model, ', ') AS models
            FROM rma_submissions s
            LEFT JOIN rma_devices d ON d.submission_id = s.id
            WHERE 1=1
        `;

        const values = [];
        let paramIndex = 1;

        if (filters.status) {
            query += ` AND s.overall_status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        if (filters.assignedTo) {
            query += ` AND s.assigned_to = $${paramIndex}`;
            values.push(filters.assignedTo);
            paramIndex++;
        }

        if (filters.fromDate) {
            query += ` AND s.submission_date >= $${paramIndex}`;
            values.push(filters.fromDate);
            paramIndex++;
        }

        if (filters.toDate) {
            query += ` AND s.submission_date <= $${paramIndex}`;
            values.push(filters.toDate);
            paramIndex++;
        }

        query += ` GROUP BY s.id ORDER BY s.submission_date DESC`;

        if (filters.limit) {
            query += ` LIMIT $${paramIndex}`;
            values.push(filters.limit);
            paramIndex++;
        }

        if (filters.offset) {
            query += ` OFFSET $${paramIndex}`;
            values.push(filters.offset);
        }

        try {
            const result = await this.pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error getting submissions:', error);
            throw error;
        }
    }

    /**
     * Get submission by reference number with all related data
     * @param {string} referenceNumber - RMA reference number
     * @returns {Promise<Object>} Submission with devices and files
     */
    async getSubmissionByReference(referenceNumber) {
        const client = await this.pool.connect();

        try {
            // Get submission
            const submissionResult = await client.query(
                'SELECT * FROM rma_submissions WHERE reference_number = $1',
                [referenceNumber]
            );

            if (submissionResult.rows.length === 0) {
                return null;
            }

            const submission = submissionResult.rows[0];

            // Get devices
            const devicesResult = await client.query(
                'SELECT * FROM rma_devices WHERE reference_number = $1 ORDER BY created_at ASC',
                [referenceNumber]
            );

            // Get files
            const filesResult = await client.query(
                'SELECT * FROM rma_files WHERE submission_id = $1 ORDER BY uploaded_at ASC',
                [submission.id]
            );

            return {
                submission,
                devices: devicesResult.rows,
                files: filesResult.rows
            };

        } catch (error) {
            console.error('Error getting submission:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get pending devices for review
     * @param {number} limit - Number of devices to return
     * @returns {Promise<Array>} Pending devices with submission info
     */
    async getPendingDevices(limit = 50) {
        const query = `
            SELECT * FROM v_devices_pending_review
            LIMIT $1
        `;

        try {
            const result = await this.pool.query(query, [limit]);
            return result.rows;
        } catch (error) {
            console.error('Error getting pending devices:', error);
            throw error;
        }
    }

    /**
     * Approve a device
     * @param {number} deviceId - Device ID
     * @param {Object} reviewData - Review information
     * @returns {Promise<Object>} Updated device
     */
    async approveDevice(deviceId, reviewData) {
        const { reviewedBy, notes, ipAddress, userAgent } = reviewData;

        const query = `
            UPDATE rma_devices
            SET
                approval_status = 'APPROVED',
                reviewed_by = $1,
                reviewed_at = NOW(),
                admin_notes = $2
            WHERE id = $3
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [reviewedBy, notes, deviceId]);

            if (result.rows.length === 0) {
                throw new Error(`Device ${deviceId} not found`);
            }

            // Log to status history (handled by trigger)
            return result.rows[0];

        } catch (error) {
            console.error('Error approving device:', error);
            throw error;
        }
    }

    /**
     * Deny a device
     * @param {number} deviceId - Device ID
     * @param {Object} reviewData - Review information including denial reason
     * @returns {Promise<Object>} Updated device
     */
    async denyDevice(deviceId, reviewData) {
        const { reviewedBy, denialReason, notes } = reviewData;

        const query = `
            UPDATE rma_devices
            SET
                approval_status = 'DENIED',
                reviewed_by = $1,
                reviewed_at = NOW(),
                denial_reason = $2,
                admin_notes = $3
            WHERE id = $4
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [
                reviewedBy,
                denialReason,
                notes,
                deviceId
            ]);

            if (result.rows.length === 0) {
                throw new Error(`Device ${deviceId} not found`);
            }

            return result.rows[0];

        } catch (error) {
            console.error('Error denying device:', error);
            throw error;
        }
    }

    /**
     * Bulk approve devices
     * @param {Array} deviceIds - Array of device IDs
     * @param {Object} reviewData - Review information
     * @returns {Promise<Array>} Updated devices
     */
    async bulkApproveDevices(deviceIds, reviewData) {
        const { reviewedBy, notes } = reviewData;

        const query = `
            UPDATE rma_devices
            SET
                approval_status = 'APPROVED',
                reviewed_by = $1,
                reviewed_at = NOW(),
                admin_notes = $2
            WHERE id = ANY($3::int[])
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [reviewedBy, notes, deviceIds]);
            return result.rows;
        } catch (error) {
            console.error('Error bulk approving devices:', error);
            throw error;
        }
    }

    /**
     * Bulk deny devices
     * @param {Array} deviceIds - Array of device IDs
     * @param {Object} reviewData - Review information
     * @returns {Promise<Array>} Updated devices
     */
    async bulkDenyDevices(deviceIds, reviewData) {
        const { reviewedBy, denialReason, notes } = reviewData;

        const query = `
            UPDATE rma_devices
            SET
                approval_status = 'DENIED',
                reviewed_by = $1,
                reviewed_at = NOW(),
                denial_reason = $2,
                admin_notes = $3
            WHERE id = ANY($4::int[])
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [
                reviewedBy,
                denialReason,
                notes,
                deviceIds
            ]);
            return result.rows;
        } catch (error) {
            console.error('Error bulk denying devices:', error);
            throw error;
        }
    }

    /**
     * Check for duplicate IMEI
     * @param {string} imei - IMEI to check
     * @param {number} excludeDeviceId - Device ID to exclude from check (optional)
     * @returns {Promise<Object>} Duplicate check result
     */
    async checkDuplicateIMEI(imei, excludeDeviceId = null) {
        const query = `SELECT * FROM check_duplicate_imei($1, $2)`;

        try {
            const result = await this.pool.query(query, [imei, excludeDeviceId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error checking duplicate IMEI:', error);
            throw error;
        }
    }

    /**
     * Mark device as synced to Snowflake
     * @param {number} deviceId - Device ID
     * @returns {Promise<Object>} Updated device
     */
    async markDeviceAsSynced(deviceId) {
        const query = `
            UPDATE rma_devices
            SET
                snowflake_synced = TRUE,
                snowflake_synced_at = NOW(),
                approval_status = 'SYNCED_TO_SNOWFLAKE'
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [deviceId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error marking device as synced:', error);
            throw error;
        }
    }

    /**
     * Add device to retry queue after failed sync
     * @param {number} deviceId - Device ID
     * @param {string} errorMessage - Error message from Snowflake
     * @returns {Promise<Object>} Queue entry
     */
    async addToRetryQueue(deviceId, errorMessage) {
        const query = `
            INSERT INTO sync_retry_queue (
                device_id,
                submission_id,
                error_message,
                next_retry_at,
                payload
            )
            SELECT
                $1,
                submission_id,
                $2,
                NOW() + INTERVAL '5 minutes',
                row_to_json(rma_devices.*)
            FROM rma_devices
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await this.pool.query(query, [deviceId, errorMessage]);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding to retry queue:', error);
            throw error;
        }
    }

    /**
     * Get dashboard analytics
     * @returns {Promise<Object>} Dashboard metrics
     */
    async getDashboardAnalytics() {
        try {
            const result = await this.pool.query('SELECT * FROM v_admin_dashboard');
            return result.rows[0];
        } catch (error) {
            console.error('Error getting dashboard analytics:', error);
            throw error;
        }
    }

    /**
     * Get devices ready for Snowflake sync
     * @returns {Promise<Array>} Approved devices not yet synced
     */
    async getDevicesForSync() {
        const query = `
            SELECT * FROM rma_devices
            WHERE approval_status = 'APPROVED'
              AND snowflake_synced = FALSE
            ORDER BY reviewed_at ASC
            LIMIT 100
        `;

        try {
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting devices for sync:', error);
            throw error;
        }
    }

    /**
     * Close database pool
     */
    async close() {
        await this.pool.end();
        console.log('PostgreSQL connection pool closed');
    }
}

// Export singleton instance
module.exports = new PostgresService();

// Test connection on require (only if not in test environment)
if (process.env.NODE_ENV !== 'test' && require.main === module) {
    const service = new PostgresService();
    service.testConnection().then(() => {
        console.log('\n✓ PostgreSQL service ready');
        process.exit(0);
    }).catch((error) => {
        console.error('\n✗ PostgreSQL service failed:', error.message);
        process.exit(1);
    });
}
