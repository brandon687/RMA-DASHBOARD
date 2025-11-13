/**
 * Supabase Client Service for SCal Mobile RMA Platform
 * Uses Supabase JS client for database operations via REST API
 */

const { createClient } = require('@supabase/supabase-js');
const IMEIValidator = require('./imei-validator');

class SupabaseService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!this.supabaseUrl || !this.supabaseKey || this.supabaseKey === 'YOUR_ANON_KEY_HERE') {
            console.warn('⚠️  Supabase credentials not configured. Run this to get your keys:');
            console.warn('   1. Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/settings/api');
            console.warn('   2. Copy the "anon public" key');
            console.warn('   3. Update SUPABASE_ANON_KEY in .env file');
            this.client = null;
        } else {
            this.client = createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✓ Supabase client initialized');
        }
    }

    isConfigured() {
        return this.client !== null;
    }

    /**
     * Create a new RMA submission
     */
    async createSubmission(submission) {
        if (!this.isConfigured()) {
            throw new Error('Supabase not configured');
        }

        const { data, error } = await this.client
            .from('rma_submissions')
            .insert([{
                reference_number: submission.referenceNumber,
                company_name: submission.companyName,
                company_email: submission.companyEmail,
                order_number: submission.orderNumber,
                customer_type: submission.customerType,
                overall_status: 'SUBMITTED'
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Supabase insert failed: ${error.message}`);
        }

        return data;
    }

    /**
     * Add devices to an RMA submission
     */
    async addDevices(referenceNumber, devices) {
        if (!this.isConfigured()) {
            throw new Error('Supabase not configured');
        }

        // First get the submission ID
        const { data: submission, error: submissionError } = await this.client
            .from('rma_submissions')
            .select('id')
            .eq('reference_number', referenceNumber)
            .single();

        if (submissionError) {
            throw new Error(`Could not find submission: ${submissionError.message}`);
        }

        // Insert devices with IMEI validation
        const deviceRecords = devices.map(device => {
            // Extract raw IMEI from various possible fields
            const rawIMEI = device.imei || device.IMEI || device['Return Request Form']?.toString();

            // Validate and sanitize IMEI
            const validation = IMEIValidator.validate(rawIMEI);

            return {
                submission_id: submission.id,
                reference_number: referenceNumber,
                imei: validation.sanitized || rawIMEI, // Use sanitized IMEI
                imei_original: String(rawIMEI), // Store original for reference
                imei_valid: validation.isValid,
                imei_validation_errors: validation.errors.length > 0 ? JSON.stringify(validation.errors) : null,
                imei_validation_warnings: validation.warnings.length > 0 ? JSON.stringify(validation.warnings) : null,
                requires_imei_review: !validation.isValid || validation.warnings.length > 0,
                // Map fields from V2 extractor (new) OR legacy JSON format (old)
                model: device.model || device.Model || device.__EMPTY || 'Unknown',
                storage: device.storage || device.Storage || null,
                condition: device.condition || device.Condition || device.Grade || null,
                issue_description: device.issue_description || device.reason || device.Reason || device.Issue || device.__EMPTY_4 || '',
                issue_category: device.issue_category || device['Issue Category'] || null,
                requested_action: device.requested_action || device['Repair/Return'] || device.status || device.Status || device.__EMPTY_6 || 'PENDING',
                unit_price: device.unit_price || device['Unit Price'] || device.value || device.__EMPTY_8 || 0,
                repair_cost: device.repair_cost || device['Repair Cost'] || device['Repair Cost (If Applicable)'] || null,
                approval_status: validation.isValid ? 'PENDING' : 'INFO_REQUESTED' // Auto-flag invalid IMEIs
            };
        });

        // Log validation summary
        const validCount = deviceRecords.filter(d => d.imei_valid).length;
        const invalidCount = deviceRecords.filter(d => !d.imei_valid).length;
        console.log(`  IMEI Validation: ${validCount} valid, ${invalidCount} invalid out of ${deviceRecords.length} devices`);

        const { data, error } = await this.client
            .from('rma_devices')
            .insert(deviceRecords)
            .select();

        if (error) {
            throw new Error(`Failed to insert devices: ${error.message}`);
        }

        // Update device counts
        await this.client
            .from('rma_submissions')
            .update({
                total_devices: devices.length,
                pending_count: devices.length
            })
            .eq('id', submission.id);

        return data;
    }

    /**
     * Add file metadata
     */
    async addFile(fileData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase not configured');
        }

        // Get submission ID
        const { data: submission, error: submissionError } = await this.client
            .from('rma_submissions')
            .select('id')
            .eq('reference_number', fileData.referenceNumber)
            .single();

        if (submissionError) {
            throw new Error(`Could not find submission: ${submissionError.message}`);
        }

        const { data, error } = await this.client
            .from('rma_files')
            .insert([{
                submission_id: submission.id,
                original_filename: fileData.originalFilename,
                file_type: fileData.fileType,
                file_size_bytes: fileData.fileSizeBytes,
                mime_type: fileData.mimeType,
                local_path: fileData.localPath,
                processing_status: fileData.processingStatus || 'PROCESSED',
                devices_extracted: fileData.devicesExtracted || 0
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to save file metadata: ${error.message}`);
        }

        return data;
    }

    /**
     * Get all submissions with pagination
     */
    async getSubmissions(page = 1, limit = 50) {
        if (!this.isConfigured()) {
            throw new Error('Supabase not configured');
        }

        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, error, count } = await this.client
            .from('rma_submissions')
            .select('*, rma_devices(count)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) {
            throw new Error(`Failed to fetch submissions: ${error.message}`);
        }

        return {
            submissions: data,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Get devices for a specific submission
     */
    async getDevicesBySubmission(referenceNumber) {
        if (!this.isConfigured()) {
            throw new Error('Supabase not configured');
        }

        const { data, error } = await this.client
            .from('rma_devices')
            .select('*, rma_submissions!inner(reference_number)')
            .eq('rma_submissions.reference_number', referenceNumber);

        if (error) {
            throw new Error(`Failed to fetch devices: ${error.message}`);
        }

        return data;
    }

    /**
     * Test connection
     */
    async testConnection() {
        if (!this.isConfigured()) {
            console.error('✗ Supabase not configured - missing API key');
            return false;
        }

        try {
            const { data, error } = await this.client
                .from('rma_submissions')
                .select('count')
                .limit(1);

            if (error) {
                console.error('✗ Supabase connection failed:', error.message);
                return false;
            }

            console.log('✓ Supabase connected successfully');
            return true;
        } catch (error) {
            console.error('✗ Supabase connection error:', error.message);
            return false;
        }
    }
}

// Export singleton instance
const supabaseService = new SupabaseService();
module.exports = supabaseService;
