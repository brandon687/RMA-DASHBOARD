# Google Sheets Integration Guide

## Overview

All RMA submissions flow directly into your **Google Sheets Master Database** for:
- ✓ Real-time tracking across your organization
- ✓ Testing and validation workflows
- ✓ Centralized data reference for all teams
- ✓ Automatic updates across departments

## Data Flow Architecture

```
Customer Submits RMA Form
         ↓
Portal Processes Files
         ↓
Google Sheets API
         ↓
Master RMA Database (Google Sheet)
         ↓
┌────────┬────────┬────────┬────────┐
│ Sales  │ Ops    │ Finance│ Support│
└────────┴────────┴────────┴────────┘
```

## Current File Storage

### Where Files Are Stored

**Location**: `/Users/brandonin/scal rma dashboard/uploads/`

**Files Created:**
1. **submissions.json** - All submission metadata
2. **[timestamp]_[filename]** - Uploaded files (CSV, PDF, images, etc.)

**Example:**
```
uploads/
├── submissions.json
├── 1731360420000_device-list.csv
├── 1731360420001_invoice.pdf
├── 1731360420002_photo1.jpg
└── 1731360420003_photo2.jpg
```

### Submissions JSON Structure

```json
{
  "referenceNumber": "RMA-ABC123-XYZ",
  "timestamp": "2025-11-11T22:30:00.000Z",
  "companyName": "ABC Electronics",
  "companyEmail": "returns@abc.com",
  "orderNumber": "ORD-12345",
  "quantity": 50,
  "customerType": "us",
  "files": [
    {
      "name": "device-list.csv",
      "type": "spreadsheet",
      "size": 2548,
      "status": "processed"
    }
  ],
  "status": "submitted"
}
```

## Google Sheets Integration Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "SCal Mobile RMA Portal"
3. Enable Google Sheets API
4. Enable Google Drive API (for file uploads)

### Step 2: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name: "RMA Portal Service"
4. Click **Create and Continue**
5. Grant role: **Editor**
6. Click **Done**

### Step 3: Generate Credentials

1. Click on the service account email
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Choose **JSON**
5. Download and save as `google-credentials.json` in project root

### Step 4: Create Master Database Sheet

1. Create new Google Sheet: "SCal Mobile RMA Master Database"
2. Set up columns (see structure below)
3. Share sheet with service account email (Editor access)
4. Copy the Sheet ID from URL

**Sheet URL Format:**
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
                                        ^^^^^^^^
                                      Copy this
```

### Step 5: Install Dependencies

```bash
cd "scal rma dashboard"
npm install googleapis @google-cloud/storage dotenv
```

### Step 6: Configure Environment Variables

Create `.env` file:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# Google Drive (for file uploads)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Server Configuration
PORT=3000
NODE_ENV=production
```

## Master Database Sheet Structure

### Sheet 1: RMA Submissions

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| A | Text | Timestamp | 2025-11-11 14:30:00 |
| B | Text | Reference Number | RMA-ABC123-XYZ |
| C | Text | Company Name | ABC Electronics |
| D | Email | Company Email | returns@abc.com |
| E | Text | Order Number | ORD-12345 |
| F | Number | Quantity | 50 |
| G | Text | Customer Type | US / International |
| H | Text | Status | Submitted / Approved / Shipped / Credited |
| I | Text | Files Uploaded | device-list.csv, invoice.pdf |
| J | URL | Drive Folder Link | https://drive.google.com/... |
| K | Date | Submitted Date | 11/11/2025 |
| L | Date | Approval Date | 11/13/2025 |
| M | Date | Received Date | 11/20/2025 |
| N | Date | Credit Date | 11/26/2025 |
| O | Text | Notes | Additional info |
| P | Text | Assigned To | Team member |

### Sheet 2: Device Details (from CSV uploads)

| Column | Type | Description |
|--------|------|-------------|
| A | Text | RMA Reference |
| B | Text | IMEI |
| C | Text | Device Model |
| D | Text | Issue Description |
| E | Text | Condition |
| F | Text | Requested Action |
| G | Text | Status |

### Sheet 3: Audit Log

| Column | Type | Description |
|--------|------|-------------|
| A | Timestamp | Action Time |
| B | Text | Action Type |
| C | Text | RMA Reference |
| D | Text | User/System |
| E | Text | Details |

## Integration Code

The integration is handled in `server.js` with these key functions:

### 1. Append to Master Sheet

```javascript
async function addRMAToSheet(submissionData) {
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[
        new Date().toISOString(),
        submissionData.referenceNumber,
        submissionData.companyName,
        submissionData.companyEmail,
        submissionData.orderNumber,
        submissionData.quantity,
        submissionData.customerType,
        'Submitted',
        submissionData.files.map(f => f.name).join(', '),
        '', // Drive folder link (populated after upload)
        new Date().toLocaleDateString(),
        '', '', '', '', '' // Empty date fields
    ]];

    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'RMA Submissions!A:P',
        valueInputOption: 'USER_ENTERED',
        resource: { values }
    });
}
```

### 2. Upload Files to Google Drive

```javascript
async function uploadFilesToDrive(files, referenceNumber) {
    const drive = google.drive({ version: 'v3', auth });

    // Create folder for this RMA
    const folder = await drive.files.create({
        resource: {
            name: referenceNumber,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        }
    });

    // Upload each file
    for (const file of files) {
        await drive.files.create({
            resource: {
                name: file.originalName,
                parents: [folder.data.id]
            },
            media: {
                mimeType: file.mimeType,
                body: fs.createReadStream(file.path)
            }
        });
    }

    return `https://drive.google.com/drive/folders/${folder.data.id}`;
}
```

### 3. Process CSV and Add Device Details

```javascript
async function addDeviceDetails(csvData, referenceNumber) {
    const sheets = google.sheets({ version: 'v4', auth });

    const values = csvData.data.map(row => [
        referenceNumber,
        row.IMEI,
        row['Device Model'],
        row['Issue Description'],
        row.Condition,
        row['Requested Action'],
        'Pending Review'
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Device Details!A:G',
        valueInputOption: 'USER_ENTERED',
        resource: { values }
    });
}
```

## Real-Time Updates

### Automatic Updates

Every submission triggers:
1. New row in "RMA Submissions" sheet
2. Device details parsed from CSV → "Device Details" sheet
3. Files uploaded to Google Drive folder
4. Drive folder link added to sheet
5. Audit log entry created

### Status Updates

Update status in sheet, and it reflects across org:

```javascript
async function updateRMAStatus(referenceNumber, newStatus) {
    // Find row by reference number
    // Update status column
    // Log change in audit sheet
}
```

## Team Access & Workflows

### Sales Team
- View: All submissions
- Update: Notes, assigned to
- Filters: By company, date range

### Operations Team
- View: All submissions + device details
- Update: Status, received date
- Actions: Mark as received, validate devices

### Finance Team
- View: All submissions
- Update: Credit date, amount
- Filters: Credit pending, by date

### Support Team
- View: All submissions
- Update: Notes, status
- Actions: Customer communication

## Benefits of This System

### 1. Single Source of Truth
- All teams reference same sheet
- No duplicate data entry
- Real-time updates

### 2. Easy Testing
- Submissions instantly visible
- Can test workflows immediately
- Quick validation

### 3. Flexible Reporting
- Google Sheets pivot tables
- Custom formulas
- Export to any format

### 4. Audit Trail
- Every change logged
- Who, what, when tracked
- Compliance-ready

### 5. Integration Ready
- Connect to other tools via Zapier
- API access for custom tools
- Webhook notifications possible

## Dashboard Views (Google Sheets)

### Summary Tab
```
Total RMAs This Month:     156
Pending Approval:          23
Approved Awaiting Ship:    12
Received This Week:        45
Credits Issued:            98
Average Processing Time:   4.2 days
```

### Formulas
```
=COUNTIF(Status,"Submitted")
=AVERAGE(Credit Date - Submitted Date)
=SUMIF(Status,"Credited",Quantity)
```

## Monitoring & Alerts

### Set Up Alerts

1. **New Submissions**
   - Trigger: New row added
   - Action: Email to team

2. **Approval Needed**
   - Trigger: Status = "Submitted" for > 48 hours
   - Action: Slack notification

3. **Overdue Credits**
   - Trigger: Received > 7 days ago, no credit
   - Action: Email finance team

### Google Apps Script

```javascript
function onNewSubmission(e) {
  var range = e.range;
  var values = range.getValues();

  // Send email to team
  MailApp.sendEmail({
    to: 'rma-team@scalmob.com',
    subject: 'New RMA Submitted: ' + values[0][1],
    body: 'Company: ' + values[0][2] + '\nQuantity: ' + values[0][5]
  });
}
```

## Security & Permissions

### Service Account
- Only has access to specific sheet
- Cannot access other Google Workspace data
- Credentials stored securely in .env

### Sheet Permissions
- Service account: Editor
- Team members: Editor (with view-only columns)
- External: No access

### File Storage
- Google Drive folder: Team access only
- Files organized by RMA reference
- Automatic retention policies

## Backup Strategy

### Automatic Backups
1. Google Sheets auto-saves (built-in)
2. Version history (30 days)
3. Weekly exports to cloud storage

### Manual Backups
```bash
# Export sheet as CSV
curl "https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv" > backup.csv
```

## Next Steps

1. **Set up Google Cloud Project** (15 min)
2. **Create service account & credentials** (10 min)
3. **Create Master Database sheet** (15 min)
4. **Configure .env file** (5 min)
5. **Install dependencies** (2 min)
6. **Test with sample submission** (10 min)
7. **Train team on sheet access** (30 min)

**Total Setup Time**: ~90 minutes

---

**Your RMA data will flow seamlessly into Google Sheets, becoming your organization's single source of truth for returns management.**
