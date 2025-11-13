/**
 * Google Sheets Integration Service
 * Handles all interactions with Google Sheets Master Database
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleSheetsService {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.drive = null;
        this.initialized = false;
    }

    /**
     * Initialize Google Sheets API with service account credentials
     */
    async initialize() {
        try {
            // Check if credentials file exists
            const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';

            try {
                await fs.access(credentialsPath);
            } catch (error) {
                console.log('⚠️  Google Sheets integration not configured (credentials file missing)');
                console.log('   RMA data will be stored locally in uploads/submissions.json');
                console.log('   See GOOGLE-SHEETS-INTEGRATION.md for setup instructions');
                return false;
            }

            // Load service account credentials
            const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

            // Create JWT auth client
            this.auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive.file'
                ]
            );

            await this.auth.authorize();

            // Initialize API clients
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });

            this.initialized = true;
            console.log('✓ Google Sheets integration initialized');
            return true;

        } catch (error) {
            console.error('⚠️  Failed to initialize Google Sheets:', error.message);
            console.log('   RMA data will be stored locally only');
            return false;
        }
    }

    /**
     * Add RMA submission to Master Database
     */
    async addSubmission(submissionData) {
        if (!this.initialized) {
            return { success: false, message: 'Google Sheets not configured' };
        }

        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;
            if (!sheetId) {
                throw new Error('GOOGLE_SHEET_ID not configured in .env');
            }

            // Prepare row data
            const values = [[
                new Date().toISOString(),                           // A: Timestamp
                submissionData.referenceNumber,                     // B: Reference Number
                submissionData.companyName,                         // C: Company Name
                submissionData.companyEmail,                        // D: Company Email
                submissionData.orderNumber,                         // E: Order Number
                submissionData.quantity,                            // F: Quantity
                submissionData.customerType === 'us' ? 'US' : 'International', // G: Customer Type
                'Submitted',                                        // H: Status
                submissionData.files.map(f => f.name).join(', '),  // I: Files Uploaded
                '',                                                 // J: Drive Folder Link (populated later)
                new Date().toLocaleDateString('en-US'),            // K: Submitted Date
                '',                                                 // L: Approval Date
                '',                                                 // M: Received Date
                '',                                                 // N: Credit Date
                '',                                                 // O: Notes
                ''                                                  // P: Assigned To
            ]];

            // Append to sheet
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'RMA Submissions!A:P',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });

            console.log(`✓ Added RMA ${submissionData.referenceNumber} to Google Sheets`);

            return {
                success: true,
                range: response.data.updates.updatedRange,
                message: 'Submission added to Google Sheets'
            };

        } catch (error) {
            console.error('Error adding to Google Sheets:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Add device details from CSV to Device Details sheet
     */
    async addDeviceDetails(referenceNumber, deviceData) {
        if (!this.initialized) {
            return { success: false };
        }

        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;

            // Prepare device rows
            const values = deviceData.map(device => [
                referenceNumber,
                device.IMEI || '',
                device['Device Model'] || device.Model || '',
                device['Issue Description'] || device.Issue || '',
                device.Condition || '',
                device['Requested Action'] || device.Action || '',
                'Pending Review'
            ]);

            // Append to Device Details sheet
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'Device Details!A:G',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });

            console.log(`✓ Added ${deviceData.length} device details for ${referenceNumber}`);

            return { success: true, count: deviceData.length };

        } catch (error) {
            console.error('Error adding device details:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Upload files to Google Drive
     */
    async uploadFilesToDrive(files, referenceNumber) {
        if (!this.initialized) {
            return { success: false };
        }

        try {
            const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
            if (!parentFolderId) {
                console.log('⚠️  GOOGLE_DRIVE_FOLDER_ID not configured, skipping Drive upload');
                return { success: false, message: 'Drive not configured' };
            }

            // Create folder for this RMA
            const folderMetadata = {
                name: referenceNumber,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId]
            };

            const folder = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id, webViewLink'
            });

            const folderId = folder.data.id;
            const folderLink = folder.data.webViewLink;

            // Upload each file
            for (const file of files) {
                const fileMetadata = {
                    name: file.originalName,
                    parents: [folderId]
                };

                const media = {
                    mimeType: file.mimeType,
                    body: require('fs').createReadStream(file.savedPath)
                };

                await this.drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id, name'
                });
            }

            console.log(`✓ Uploaded ${files.length} files to Drive for ${referenceNumber}`);

            // Update sheet with Drive folder link
            await this.updateDriveFolderLink(referenceNumber, folderLink);

            return {
                success: true,
                folderId: folderId,
                folderLink: folderLink,
                fileCount: files.length
            };

        } catch (error) {
            console.error('Error uploading to Drive:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update Drive folder link in sheet
     */
    async updateDriveFolderLink(referenceNumber, folderLink) {
        if (!this.initialized) return;

        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;

            // Find the row with this reference number
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'RMA Submissions!B:J'
            });

            const rows = response.data.values || [];
            const rowIndex = rows.findIndex(row => row[0] === referenceNumber);

            if (rowIndex >= 0) {
                // Update column J (Drive Folder Link) - row index + 2 (1 for 0-index, 1 for header)
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: `RMA Submissions!J${rowIndex + 2}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[folderLink]]
                    }
                });

                console.log(`✓ Updated Drive link for ${referenceNumber}`);
            }

        } catch (error) {
            console.error('Error updating Drive link:', error.message);
        }
    }

    /**
     * Log action to audit sheet
     */
    async logAction(actionType, referenceNumber, details, user = 'System') {
        if (!this.initialized) return;

        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;

            const values = [[
                new Date().toISOString(),
                actionType,
                referenceNumber,
                user,
                details
            ]];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'Audit Log!A:E',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });

        } catch (error) {
            console.error('Error logging to audit sheet:', error.message);
        }
    }

    /**
     * Update RMA status
     */
    async updateStatus(referenceNumber, newStatus, user = 'System') {
        if (!this.initialized) return { success: false };

        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;

            // Find the row
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'RMA Submissions!B:H'
            });

            const rows = response.data.values || [];
            const rowIndex = rows.findIndex(row => row[0] === referenceNumber);

            if (rowIndex >= 0) {
                // Update status column (H)
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: `RMA Submissions!H${rowIndex + 2}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[newStatus]]
                    }
                });

                // Log the status change
                await this.logAction(
                    'Status Update',
                    referenceNumber,
                    `Status changed to: ${newStatus}`,
                    user
                );

                console.log(`✓ Updated status for ${referenceNumber} to ${newStatus}`);

                return { success: true };
            }

            return { success: false, message: 'RMA not found' };

        } catch (error) {
            console.error('Error updating status:', error.message);
            return { success: false, message: error.message };
        }
    }
}

module.exports = new GoogleSheetsService();
