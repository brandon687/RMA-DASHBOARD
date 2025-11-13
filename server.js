require('dotenv').config();

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');
const rateLimit = require('express-rate-limit');
const googleSheetsService = require('./google-sheets-service');
const db = require('./services/supabase-client');
const ExcelIMEIExtractor = require('./services/excel-imei-extractor-v2');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Security headers middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data:; " +
        "connect-src 'self';"
    );

    next();
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const submissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 submissions per hour
    message: 'Too many submission attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || !IS_PRODUCTION) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parsers with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// File upload with enhanced security
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
app.use(fileUpload({
    limits: { fileSize: maxFileSize },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
    debug: !IS_PRODUCTION
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// File Processing Agent
class FileProcessor {
    constructor() {
        this.supportedFormats = {
            spreadsheet: ['.xlsx', '.xls', '.csv'],
            document: ['.pdf', '.doc', '.docx', '.txt'],
            image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
            video: ['.mp4', '.mov', '.webm', '.avi']
        };
    }

    getFileExtension(filename) {
        return path.extname(filename).toLowerCase();
    }

    getFileType(filename) {
        const ext = this.getFileExtension(filename);
        for (const [type, extensions] of Object.entries(this.supportedFormats)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }
        return 'other';
    }

    async processFile(file) {
        const ext = this.getFileExtension(file.name);
        const fileType = this.getFileType(file.name);

        const processedFile = {
            originalName: file.name,
            mimeType: file.mimetype,
            size: file.size,
            extension: ext,
            type: fileType,
            path: file.tempFilePath,
            processedData: null,
            conversionStatus: 'original'
        };

        try {
            // Process based on file type
            switch (fileType) {
                case 'spreadsheet':
                    processedFile.processedData = await this.processSpreadsheet(file);
                    break;
                case 'document':
                    if (ext === '.pdf') {
                        processedFile.processedData = await this.processPDF(file);
                    } else if (ext === '.txt') {
                        processedFile.processedData = await this.processText(file);
                    }
                    break;
                case 'image':
                    processedFile.processedData = await this.processImage(file);
                    break;
                case 'video':
                    processedFile.processedData = await this.processVideo(file);
                    break;
                default:
                    processedFile.processedData = { message: 'File stored for manual review' };
            }

            processedFile.conversionStatus = 'processed';
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            processedFile.conversionStatus = 'error';
            processedFile.error = error.message;
        }

        return processedFile;
    }

    async processSpreadsheet(file) {
        try {
            // Use Excel IMEI Extractor to preserve full IMEI values
            // This prevents Excel's scientific notation from corrupting IMEIs
            const devices = ExcelIMEIExtractor.extractFromFile(file.tempFilePath);

            // Also get traditional JSON format for backwards compatibility
            const workbook = XLSX.readFile(file.tempFilePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            const csvData = XLSX.utils.sheet_to_csv(worksheet);

            console.log(`  Extracted ${devices.length} devices with preserved IMEIs`);

            return {
                format: 'spreadsheet',
                sheets: workbook.SheetNames,
                rowCount: jsonData.length,
                data: devices, // Use devices from IMEI extractor (preserves full IMEIs)
                dataRaw: jsonData, // Keep raw data for reference
                csv: csvData,
                preview: devices.slice(0, 10) // First 10 rows for preview
            };
        } catch (error) {
            throw new Error(`Spreadsheet processing failed: ${error.message}`);
        }
    }

    async processPDF(file) {
        try {
            const dataBuffer = await fs.readFile(file.tempFilePath);
            const pdfData = await pdfParse(dataBuffer);

            return {
                format: 'pdf',
                pages: pdfData.numpages,
                text: pdfData.text,
                textLength: pdfData.text.length,
                preview: pdfData.text.substring(0, 500) // First 500 chars
            };
        } catch (error) {
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }

    async processText(file) {
        try {
            const content = await fs.readFile(file.tempFilePath, 'utf8');

            return {
                format: 'text',
                content: content,
                length: content.length,
                lines: content.split('\n').length,
                preview: content.substring(0, 500)
            };
        } catch (error) {
            throw new Error(`Text processing failed: ${error.message}`);
        }
    }

    async processImage(file) {
        return {
            format: 'image',
            message: 'Image stored successfully',
            dimensions: 'Available on request',
            note: 'Image files are preserved in original format for review'
        };
    }

    async processVideo(file) {
        return {
            format: 'video',
            message: 'Video stored successfully',
            note: 'Video files are preserved in original format for review'
        };
    }

    async convertToStandardFormat(file) {
        // This method attempts to convert any file to a standardized format
        const ext = this.getFileExtension(file.name);

        // For spreadsheets, always provide CSV output
        if (['.xlsx', '.xls'].includes(ext)) {
            const workbook = XLSX.readFile(file.tempFilePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);

            const csvPath = file.tempFilePath.replace(ext, '.csv');
            await fs.writeFile(csvPath, csv);

            return {
                converted: true,
                originalFormat: ext,
                newFormat: '.csv',
                path: csvPath
            };
        }

        return {
            converted: false,
            message: 'File format is already in a standard format or does not require conversion'
        };
    }
}

// Initialize file processor
const fileProcessor = new FileProcessor();

// Generate unique reference number
function generateReferenceNumber() {
    const prefix = 'RMA';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Input validation helper
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    // Remove potentially dangerous characters
    return input.replace(/[<>\"']/g, '').trim();
}

// API Endpoints
app.post('/api/submit-rma', submissionLimiter, async (req, res) => {
    try {
        let { companyName, companyEmail, orderNumber, quantity, customerType } = req.body;

        // Validate required fields
        if (!companyName || !companyEmail || !orderNumber || !quantity || !customerType) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please fill in all required fields'
            });
        }

        // Validate email format
        if (!validateEmail(companyEmail)) {
            return res.status(400).json({
                error: 'Invalid email',
                message: 'Please provide a valid email address'
            });
        }

        // Sanitize inputs
        companyName = sanitizeInput(companyName);
        orderNumber = sanitizeInput(orderNumber);
        customerType = sanitizeInput(customerType);

        // Validate quantity
        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10000) {
            return res.status(400).json({
                error: 'Invalid quantity',
                message: 'Quantity must be between 1 and 10,000'
            });
        }

        // Validate customer type
        if (!['us', 'international'].includes(customerType)) {
            return res.status(400).json({
                error: 'Invalid customer type',
                message: 'Customer type must be either "us" or "international"'
            });
        }

        // Process uploaded files
        const processedFiles = [];
        const files = req.files;

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({
                error: 'No files uploaded',
                message: 'Please upload at least one file'
            });
        }

        // Process each file
        for (const key in files) {
            const file = Array.isArray(files[key]) ? files[key] : [files[key]];

            for (const f of file) {
                try {
                    const processed = await fileProcessor.processFile(f);
                    processedFiles.push(processed);

                    // Save file to uploads directory
                    const timestamp = Date.now();
                    const safeFilename = f.name.replace(/[^a-z0-9.-]/gi, '_');
                    const savePath = path.join(uploadsDir, `${timestamp}_${safeFilename}`);
                    await f.mv(savePath);

                    processed.savedPath = savePath;
                } catch (error) {
                    console.error(`Error processing file ${f.name}:`, error);
                    processedFiles.push({
                        originalName: f.name,
                        error: error.message,
                        conversionStatus: 'failed'
                    });
                }
            }
        }

        // Generate reference number
        const referenceNumber = generateReferenceNumber();

        // Create submission record
        const submission = {
            referenceNumber,
            timestamp: new Date().toISOString(),
            companyName,
            companyEmail,
            orderNumber,
            quantity: parseInt(quantity),
            customerType,
            files: processedFiles.map(f => ({
                name: f.originalName,
                type: f.type,
                size: f.size,
                status: f.conversionStatus
            })),
            status: 'submitted'
        };

        // Save submission to Supabase database
        let dbSaved = false;
        let dbSubmission = null;

        try {
            console.log('Saving to Supabase...');
            dbSubmission = await db.createSubmission({
                referenceNumber,
                companyName,
                companyEmail,
                orderNumber,
                customerType
            });
            console.log('✓ Submission saved to database:', dbSubmission.id);

            // Extract and save devices from spreadsheet files
            for (const file of processedFiles) {
                if (file.type === 'spreadsheet' && file.processedData && file.processedData.data) {
                    const devices = file.processedData.data;
                    console.log(`Saving ${devices.length} devices to database...`);
                    await db.addDevices(referenceNumber, devices);
                    console.log('✓ Devices saved to database');
                }
            }

            // Save file metadata to database
            for (const file of processedFiles) {
                await db.addFile({
                    referenceNumber,
                    originalFilename: file.originalName,
                    fileType: file.type,
                    fileSizeBytes: file.size,
                    mimeType: file.mimeType,
                    localPath: file.savedPath,
                    processingStatus: file.conversionStatus === 'processed' ? 'PROCESSED' : 'FAILED',
                    extractedData: file.processedData,
                    devicesExtracted: file.type === 'spreadsheet' && file.processedData?.data ? file.processedData.data.length : 0
                });
            }
            console.log('✓ Files saved to database');
            dbSaved = true;
        } catch (dbError) {
            console.error('⚠️  Database save failed:', dbError.message);
            console.log('📁 Continuing with local storage only...');
        }

        // Also save to JSON for backup
        const submissionsFile = path.join(uploadsDir, 'submissions.json');
        let submissions = [];
        try {
            const existingData = await fs.readFile(submissionsFile, 'utf8');
            submissions = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist yet
        }
        submissions.push(submission);
        await fs.writeFile(submissionsFile, JSON.stringify(submissions, null, 2));

        // Add to Google Sheets Master Database
        const sheetsResult = await googleSheetsService.addSubmission(submission);

        // If spreadsheet files exist, add device details to sheet
        for (const file of processedFiles) {
            if (file.type === 'spreadsheet' && file.processedData && file.processedData.data) {
                await googleSheetsService.addDeviceDetails(
                    referenceNumber,
                    file.processedData.data
                );
            }
        }

        // Upload files to Google Drive (if configured)
        const driveResult = await googleSheetsService.uploadFilesToDrive(
            processedFiles.map(f => ({
                originalName: f.originalName,
                mimeType: f.mimeType,
                savedPath: f.savedPath
            })),
            referenceNumber
        );

        // Log action
        await googleSheetsService.logAction(
            'New Submission',
            referenceNumber,
            `Company: ${companyName}, Quantity: ${quantity}, Files: ${processedFiles.length}`
        );

        console.log('RMA Submission Received:', {
            referenceNumber,
            companyName,
            companyEmail,
            filesCount: processedFiles.length,
            googleSheets: sheetsResult.success ? 'Added' : 'Local only',
            googleDrive: driveResult.success ? 'Uploaded' : 'Local only'
        });

        res.json({
            success: true,
            referenceNumber,
            message: 'RMA request submitted successfully',
            filesProcessed: processedFiles.length,
            googleSheets: sheetsResult.success,
            googleDrive: driveResult.success
        });

    } catch (error) {
        console.error('Error processing RMA submission:', error);
        res.status(500).json({
            error: 'Submission failed',
            message: 'An error occurred while processing your request. Please try again or contact rma@scalmob.com'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'SCal Mobile RMA Portal'
    });
});

// Admin API Endpoints

// Get all submissions with stats
app.get('/api/admin/submissions', async (req, res) => {
    try {
        const result = await db.getSubmissions(1, 100);

        // Calculate stats
        const stats = {
            total: result.total || 0,
            totalDevices: result.submissions.reduce((sum, sub) => sum + (sub.total_devices || 0), 0),
            pending: result.submissions.filter(s => s.overall_status === 'SUBMITTED' || s.overall_status === 'PENDING').length,
            approved: result.submissions.filter(s => s.overall_status === 'APPROVED').length,
            denied: result.submissions.filter(s => s.overall_status === 'DENIED').length
        };

        res.json({
            submissions: result.submissions,
            stats,
            page: result.page,
            totalPages: result.totalPages
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            error: 'Failed to fetch submissions',
            message: error.message
        });
    }
});

// Get single submission with all details
app.get('/api/admin/submission/:referenceNumber', async (req, res) => {
    try {
        const { referenceNumber } = req.params;

        // Get submission details
        const submissionQuery = await db.client
            .from('rma_submissions')
            .select('*')
            .eq('reference_number', referenceNumber)
            .single();

        if (submissionQuery.error) {
            throw submissionQuery.error;
        }

        // Get devices
        const devicesQuery = await db.client
            .from('rma_devices')
            .select('*')
            .eq('reference_number', referenceNumber)
            .order('id', { ascending: true });

        // Get files
        const filesQuery = await db.client
            .from('rma_files')
            .select('*')
            .eq('submission_id', submissionQuery.data.id);

        res.json({
            submission: submissionQuery.data,
            devices: devicesQuery.data || [],
            files: filesQuery.data || []
        });
    } catch (error) {
        console.error('Error fetching submission details:', error);
        res.status(500).json({
            error: 'Failed to fetch submission details',
            message: error.message
        });
    }
});

// Download file endpoint
app.get('/api/admin/download/:referenceNumber/:fileId', async (req, res) => {
    try {
        const { referenceNumber, fileId } = req.params;

        // Get file metadata
        const fileQuery = await db.client
            .from('rma_files')
            .select('*')
            .eq('id', fileId)
            .single();

        if (fileQuery.error || !fileQuery.data) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = fileQuery.data;

        // Use the local_path as-is if it's absolute, otherwise join with __dirname
        const filePath = path.isAbsolute(file.local_path)
            ? file.local_path
            : path.join(__dirname, file.local_path);

        console.log('Attempting to download file:', filePath);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (err) {
            console.error('File not found on disk:', filePath);
            return res.status(404).json({
                error: 'File not found on disk',
                path: filePath
            });
        }

        // Send file
        res.download(filePath, file.original_filename);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            error: 'Failed to download file',
            message: error.message
        });
    }
});

// Update submission status endpoint
app.post('/api/admin/submission/:referenceNumber/status', async (req, res) => {
    try {
        const { referenceNumber } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['submitted', 'pending', 'approved', 'denied'];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                error: 'Invalid status',
                message: 'Status must be one of: submitted, pending, approved, denied'
            });
        }

        // Update status in database
        const updateQuery = await db.client
            .from('rma_submissions')
            .update({
                overall_status: status.toUpperCase(),
                updated_at: new Date().toISOString()
            })
            .eq('reference_number', referenceNumber)
            .select()
            .single();

        if (updateQuery.error) {
            throw updateQuery.error;
        }

        if (!updateQuery.data) {
            return res.status(404).json({
                error: 'Submission not found',
                message: `No submission found with reference number: ${referenceNumber}`
            });
        }

        console.log(`Status updated: ${referenceNumber} -> ${status.toUpperCase()}`);

        res.json({
            success: true,
            message: 'Status updated successfully',
            submission: updateQuery.data
        });
    } catch (error) {
        console.error('Error updating submission status:', error);
        res.status(500).json({
            error: 'Failed to update status',
            message: error.message
        });
    }
});

// Get all submissions (admin endpoint - should be protected in production)
app.get('/api/submissions', async (req, res) => {
    try {
        const submissionsFile = path.join(uploadsDir, 'submissions.json');
        const data = await fs.readFile(submissionsFile, 'utf8');
        const submissions = JSON.parse(data);

        res.json({
            success: true,
            count: submissions.length,
            submissions
        });
    } catch (error) {
        res.json({
            success: true,
            count: 0,
            submissions: []
        });
    }
});

// Serve main page for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         SCAL MOBILE RMA PORTAL - SERVER RUNNING           ║
║                                                            ║
║  Server:  http://localhost:${PORT}                         ║
║  Status:  Ready to accept RMA submissions                 ║
║                                                            ║
║  Features:                                                 ║
║  ✓ Universal file upload and processing                   ║
║  ✓ Automatic format conversion                            ║
║  ✓ CSV, Excel, PDF, Image support                         ║
║  ✓ US & International customer workflows                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Initialize Google Sheets integration
    const sheetsInitialized = await googleSheetsService.initialize();

    if (sheetsInitialized) {
        console.log('');
        console.log('📊 Google Sheets Integration: ACTIVE');
        console.log('   All submissions will sync to your Master Database');
        console.log('');
    } else {
        console.log('');
        console.log('📁 Running in LOCAL MODE');
        console.log('   Data stored in: uploads/submissions.json');
        console.log('   To enable Google Sheets, see: GOOGLE-SHEETS-INTEGRATION.md');
        console.log('');
    }
});

module.exports = app;
