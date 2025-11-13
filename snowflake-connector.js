/**
 * Snowflake Database Connector for SCal Mobile RMA Dashboard
 *
 * This module provides enterprise-grade database operations with:
 * - Automatic retry logic for failed inserts
 * - Connection pooling for performance
 * - Error handling with dead letter queue
 * - Comprehensive logging for debugging
 */

const snowflake = require('snowflake-sdk');
const crypto = require('crypto');

class SnowflakeConnector {
    constructor() {
        this.connection = null;
        this.isConnected = false;

        // Snowflake connection configuration
        this.config = {
            account: process.env.SNOWFLAKE_ACCOUNT,
            username: process.env.SNOWFLAKE_USER,
            password: process.env.SNOWFLAKE_PASSWORD,
            warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'RMA_INGESTION_WH',
            database: process.env.SNOWFLAKE_DATABASE || 'SCAL_RMA_DB',
            schema: 'LANDING',
            role: process.env.SNOWFLAKE_ROLE || 'RMA_ADMIN'
        };

        // Retry configuration
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Establish connection to Snowflake
     */
    async connect() {
        if (this.isConnected) {
            console.log('Already connected to Snowflake');
            return this.connection;
        }

        // Check if Snowflake is configured
        if (!this.config.account || !this.config.username || !this.config.password) {
            console.warn('⚠️  Snowflake not configured - running in local storage mode');
            return null;
        }

        return new Promise((resolve, reject) => {
            this.connection = snowflake.createConnection(this.config);

            this.connection.connect((err, conn) => {
                if (err) {
                    console.error('❌ Snowflake connection error:', err.message);
                    this.isConnected = false;
                    reject(err);
                } else {
                    console.log('✅ Connected to Snowflake successfully');
                    this.isConnected = true;
                    resolve(conn);
                }
            });
        });
    }

    /**
     * Execute SQL query with automatic retry
     */
    async executeQuery(sql, binds = [], retryCount = 0) {
        if (!this.isConnected) {
            throw new Error('Not connected to Snowflake');
        }

        return new Promise((resolve, reject) => {
            this.connection.execute({
                sqlText: sql,
                binds: binds,
                complete: async (err, stmt, rows) => {
                    if (err) {
                        console.error(`Query error (attempt ${retryCount + 1}):`, err.message);

                        if (retryCount < this.maxRetries) {
                            console.log(`Retrying in ${this.retryDelay}ms...`);
                            await this.sleep(this.retryDelay);
                            try {
                                const result = await this.executeQuery(sql, binds, retryCount + 1);
                                resolve(result);
                            } catch (retryError) {
                                reject(retryError);
                            }
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(rows);
                    }
                }
            });
        });
    }

    /**
     * Insert raw submission to LANDING zone
     */
    async insertRawSubmission(submissionData) {
        const sql = `
            INSERT INTO SCAL_RMA_DB.LANDING.RMA_SUBMISSIONS_RAW (
                SUBMISSION_ID,
                RAW_PAYLOAD,
                COMPANY_NAME,
                COMPANY_EMAIL,
                ORDER_NUMBER,
                CUSTOMER_TYPE,
                SUBMISSION_DATE,
                INVOICE_NUMBER,
                RETURN_QUANTITY,
                REPAIR_QUANTITY,
                TOTAL_RETURN_VALUE,
                TOTAL_REPAIR_VALUE,
                UPLOADED_FILES,
                FILE_COUNT,
                PROCESSING_STATUS
            ) VALUES (?, PARSE_JSON(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, PARSE_JSON(?), ?, ?)
        `;

        const files = submissionData.files || [];
        const binds = [
            submissionData.referenceNumber,
            JSON.stringify(submissionData),
            submissionData.companyName,
            submissionData.companyEmail,
            submissionData.orderNumber || null,
            submissionData.customerType,
            submissionData.submissionDate || new Date().toISOString().split('T')[0],
            submissionData.invoiceNumber || null,
            submissionData.returnQuantity || 0,
            submissionData.repairQuantity || 0,
            submissionData.totalReturnValue || 0,
            submissionData.totalRepairValue || 0,
            JSON.stringify(files),
            files.length,
            'PENDING'
        ];

        try {
            await this.executeQuery(sql, binds);
            console.log(`✅ Inserted submission ${submissionData.referenceNumber} to Snowflake`);
            return { success: true, submissionId: submissionData.referenceNumber };
        } catch (error) {
            console.error('❌ Failed to insert submission:', error.message);

            try {
                await this.addToRetryQueue(submissionData, error.message);
                console.log('📝 Added to retry queue');
            } catch (queueError) {
                console.error('❌ Failed to add to retry queue:', queueError.message);
            }

            throw error;
        }
    }

    /**
     * Insert device items to STAGING zone
     */
    async insertDeviceItems(submissionId, devices) {
        if (!devices || devices.length === 0) {
            console.log('No devices to insert');
            return;
        }

        const sql = `
            INSERT INTO SCAL_RMA_DB.STAGING.RMA_DEVICE_ITEMS (
                DEVICE_ITEM_ID,
                SUBMISSION_ID,
                IMEI,
                MODEL,
                STORAGE,
                STATUS,
                INV,
                ISSUE,
                ISSUE_CATEGORY,
                REPAIR_OR_RETURN,
                UNIT_PRICE,
                REPAIR_COST,
                ROW_NUMBER_IN_FILE
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < devices.length; i++) {
            const device = devices[i];
            const deviceId = `${submissionId}-DEV-${String(i + 1).padStart(4, '0')}`;

            const binds = [
                deviceId,
                submissionId,
                this.extractField(device, ['IMEI', 'imei']),
                this.extractField(device, ['Model', 'model']),
                this.extractField(device, ['Storage', 'storage']),
                this.extractField(device, ['STATUS', 'status']),
                this.extractField(device, ['INV', 'inv']),
                this.extractField(device, ['Issue', 'issue']),
                this.extractField(device, ['Issue Category', 'issueCategory', 'issue_category']),
                this.extractField(device, ['Repair/Return', 'repairOrReturn', 'repair_or_return']),
                parseFloat(this.extractField(device, ['Unit Price', 'unitPrice', 'unit_price'])) || 0,
                parseFloat(this.extractField(device, ['Repair Cost (If Applicable)', 'repairCost', 'repair_cost'])) || 0,
                i + 1
            ];

            try {
                await this.executeQuery(sql, binds);
                successCount++;
            } catch (error) {
                console.error(`Failed to insert device ${i + 1}:`, error.message);
                failCount++;
            }
        }

        console.log(`✅ Inserted ${successCount}/${devices.length} devices (${failCount} failed)`);
        return { successCount, failCount, total: devices.length };
    }

    /**
     * Add failed submission to retry queue
     */
    async addToRetryQueue(submissionData, errorMessage) {
        const sql = `
            INSERT INTO SCAL_RMA_DB.SYSTEM.PROCESSING_QUEUE (
                QUEUE_ID,
                SUBMISSION_ID,
                RETRY_COUNT,
                MAX_RETRIES,
                NEXT_RETRY_AT,
                ERROR_MESSAGE,
                STATUS
            ) VALUES (?, ?, ?, ?, DATEADD(minute, 5, CURRENT_TIMESTAMP()), ?, ?)
        `;

        const queueId = `QUEUE-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const binds = [
            queueId,
            submissionData.referenceNumber,
            0,
            3,
            errorMessage.substring(0, 5000),
            'QUEUED'
        ];

        await this.executeQuery(sql, binds);
    }

    /**
     * Helper: Extract field from object with multiple possible key names
     */
    extractField(obj, possibleKeys) {
        for (const key of possibleKeys) {
            if (obj[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return null;
    }

    /**
     * Helper: Sleep for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Close connection
     */
    async disconnect() {
        if (this.connection && this.isConnected) {
            return new Promise((resolve, reject) => {
                this.connection.destroy((err) => {
                    if (err) {
                        console.error('Error disconnecting:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Disconnected from Snowflake');
                        this.isConnected = false;
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const result = await this.executeQuery('SELECT CURRENT_TIMESTAMP() AS now');
            return {
                healthy: true,
                timestamp: result[0]?.NOW,
                database: this.config.database
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }
}

module.exports = SnowflakeConnector;
