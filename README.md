# SCal Mobile RMA Portal

**Production-Ready Returns Management Authorization System**

Professional web portal for managing returns and repairs of mobile devices. Built for SCal Mobile's finance and operations teams to efficiently process RMA submissions from US and international customers.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Support](#support)

---

## Overview

The SCal Mobile RMA Portal is a complete system for handling device returns and repairs:

- **Customer Portal** (`index.html`) - Submit RMA requests with file uploads
- **Admin Dashboard** (`admin.html`) - Review submissions, manage status, download files
- **API Server** (`server.js`) - REST API with file processing and database integration
- **Database** - Supabase PostgreSQL with complete schema
- **Integrations** - Google Sheets sync and Google Drive storage (optional)

**Live URL**: Deploy to Railway at [https://scal-rma-portal.railway.app](https://scal-rma-portal.railway.app)

---

## Features

### Customer-Facing Portal

- Animated landing page with SCal Mobile branding
- Customer type selection (US vs International)
- Interactive guidelines with step-by-step process
- Smart form with validation
- Universal file upload (drag-and-drop)
- Supports all file types: Excel, PDF, images, videos
- Real-time file processing
- Unique reference number generation
- Mobile-responsive design

### Admin Dashboard

- Real-time submission tracking
- Status management (Submitted, Pending, Approved, Denied)
- Device details with IMEI validation
- File downloads
- Statistics and metrics
- Return vs Repair breakdown
- Filterable submission list
- Detailed submission modal view

### Backend System

- **Automatic File Processing**:
  - Excel/CSV: Extracts device data, preserves IMEIs
  - PDF: Text extraction
  - Images/Videos: Metadata preservation

- **IMEI Validation**:
  - Handles Excel scientific notation
  - 15-digit validation
  - Starts with 35 requirement
  - Automatic sanitization

- **Security**:
  - Rate limiting (100 requests/15 min)
  - Submission limits (10/hour)
  - Input sanitization
  - Security headers
  - File size limits (10MB)

- **Database**:
  - Supabase PostgreSQL
  - Three core tables: submissions, devices, files
  - IMEI validation tracking
  - Status management

---

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with Gotham/Poppins fonts
- **JavaScript** - Vanilla JS (no frameworks)

### Backend
- **Node.js** (v18+)
- **Express.js** - Web server
- **express-fileupload** - File handling
- **express-rate-limit** - API protection

### File Processing
- **xlsx** - Excel/spreadsheet parsing
- **pdf-parse** - PDF text extraction
- Custom IMEI extraction with scientific notation handling

### Database
- **Supabase** - PostgreSQL database
- **@supabase/supabase-js** - Client library

### Integrations (Optional)
- **Google Sheets API** - Master database sync
- **Google Drive API** - File storage
- **googleapis** - Google API client

### Deployment
- **Railway** - Primary hosting
- **nixpacks.toml** - Build configuration
- **Node.js 20**

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   cd "scal rma dashboard"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development

   # Supabase (Required)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here

   # Security (Optional)
   MAX_FILE_SIZE=10485760
   ALLOWED_ORIGINS=http://localhost:3000

   # Google Sheets (Optional)
   GOOGLE_SHEET_ID=your-sheet-id
   GOOGLE_DRIVE_FOLDER_ID=your-folder-id
   GOOGLE_CREDENTIALS_PATH=./google-credentials.json
   ```

4. **Set up Supabase**

   Run the database setup:
   ```bash
   npm run setup-db
   ```

   This creates three tables:
   - `rma_submissions` - Main submission records
   - `rma_devices` - Device details with IMEIs
   - `rma_files` - Uploaded file metadata

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the portal**
   - Customer Portal: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin.html
   - Health Check: http://localhost:3000/api/health

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` (10MB) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |
| `GOOGLE_SHEET_ID` | Google Sheets master database | - |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder | - |
| `GOOGLE_CREDENTIALS_PATH` | Service account JSON | `./google-credentials.json` |

---

## Project Structure

```
scal-rma-dashboard/
├── index.html                    # Customer portal
├── admin.html                    # Admin dashboard
├── script.js                     # Customer portal JS
├── admin.js                      # Admin dashboard JS
├── styles.css                    # Global styles
├── server.js                     # Express API server
├── package.json                  # Dependencies
├── nixpacks.toml                 # Railway build config
│
├── services/                     # Backend services
│   ├── supabase-client.js       # Database client
│   ├── excel-imei-extractor-v2.js # Smart Excel parser
│   ├── imei-validator.js        # IMEI validation logic
│   └── postgres-service.js      # Legacy DB service
│
├── uploads/                      # File storage (local)
│   └── submissions.json         # Backup storage
│
├── scripts/                      # Utility scripts
│   └── setup-database.js        # Database initialization
│
└── docs/                         # Documentation
    ├── README.md                # This file
    ├── API-DOCUMENTATION.md     # API reference
    ├── ADMIN-GUIDE.md          # Admin user manual
    ├── CUSTOMER-GUIDE.md       # Customer instructions
    ├── DATABASE-SCHEMA.md      # Database structure
    ├── OPERATIONS-MANUAL.md    # SOPs for operations
    ├── DEVELOPMENT-GUIDE.md    # Developer guide
    └── DEPLOYMENT.md           # Deployment instructions
```

---

## Key Components

### 1. Customer Portal Flow

```
Landing Page → Customer Type Selection → Guidelines → Form → Success
```

**File**: `index.html` + `script.js`

**Process**:
1. User selects US or International
2. Reviews customer-specific guidelines
3. Fills out form with company info
4. Uploads supporting files (Excel, PDF, images)
5. Receives unique reference number

### 2. File Processing Pipeline

```
Upload → Detect Type → Process → Extract Data → Validate → Store
```

**File**: `server.js` (FileProcessor class, lines 107-285)

**Supported Formats**:
- **Spreadsheets**: `.xlsx`, `.xls`, `.csv` (device extraction)
- **Documents**: `.pdf`, `.txt` (text extraction)
- **Images**: `.jpg`, `.png`, `.gif`, `.webp`, `.heic`
- **Videos**: `.mp4`, `.mov`, `.webm`, `.avi`
- **Other**: All types accepted for manual review

### 3. IMEI Extraction & Validation

**Files**:
- `services/excel-imei-extractor-v2.js` - Smart extraction
- `services/imei-validator.js` - Validation logic

**Features**:
- Handles Excel scientific notation (3.57069E+14)
- Intelligent header detection
- Maps varying column names
- Validates 15-digit format
- Ensures starts with 35
- Flags invalid IMEIs for review

### 4. Admin Dashboard

**File**: `admin.html` + `admin.js`

**Features**:
- Real-time submission list
- Status dropdown (Submitted, Pending, Approved, Denied)
- Click to view full details
- Device table with IMEI, model, storage, condition
- File download capability
- Statistics cards
- Pacific Time formatting

### 5. Database Architecture

**Tables**:

1. **rma_submissions**
   - reference_number (PK)
   - company_name, company_email, order_number
   - customer_type (US/INTERNATIONAL)
   - overall_status (SUBMITTED/PENDING/APPROVED/DENIED)
   - total_devices, approved_count, denied_count
   - timestamps

2. **rma_devices**
   - Device details with IMEI
   - IMEI validation fields
   - Model, storage, condition, issue
   - Requested action (Return/Repair)
   - Pricing information
   - Status tracking

3. **rma_files**
   - File metadata
   - Local file path
   - Processing status
   - Devices extracted count

---

## Documentation

Complete documentation suite:

- **[API-DOCUMENTATION.md](./API-DOCUMENTATION.md)** - Complete REST API reference with examples
- **[ADMIN-GUIDE.md](./ADMIN-GUIDE.md)** - Step-by-step admin dashboard guide
- **[CUSTOMER-GUIDE.md](./CUSTOMER-GUIDE.md)** - Customer-facing instructions
- **[DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md)** - Complete database structure
- **[OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md)** - SOPs for daily operations
- **[DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)** - Developer setup and architecture
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway deployment instructions

---

## Deployment

### Railway (Recommended)

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repository

2. **Configure Environment**
   - Add Supabase credentials
   - Railway auto-detects Node.js
   - Uses `nixpacks.toml` for build

3. **Deploy**
   - Push to main branch
   - Automatic deployment
   - Get production URL

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions**

---

## API Endpoints

### Customer API

```
POST /api/submit-rma           Submit new RMA
GET  /api/health              Health check
```

### Admin API

```
GET  /api/admin/submissions                     Get all submissions
GET  /api/admin/submission/:referenceNumber     Get submission details
GET  /api/admin/download/:refNum/:fileId        Download file
POST /api/admin/submission/:refNum/status       Update status
```

**See [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for complete reference**

---

## Support

### For Customers
- **Email**: rma@scalmob.com
- **Guide**: [CUSTOMER-GUIDE.md](./CUSTOMER-GUIDE.md)

### For Admin Users
- **Guide**: [ADMIN-GUIDE.md](./ADMIN-GUIDE.md)
- **Operations**: [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md)

### For Developers
- **Guide**: [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)
- **API Docs**: [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)
- **Database**: [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md)

### Technical Issues
- Check logs: `heroku logs --tail` or Railway logs
- Database: Supabase dashboard
- Test connection: `npm run test-db`

---

## Version History

### Version 1.2.0 (Current)
- Admin dashboard with status management
- Supabase PostgreSQL integration
- IMEI validation and extraction
- File download capability
- Statistics and metrics

### Version 1.1.0
- Google Sheets integration
- Google Drive file storage
- Enhanced file processing

### Version 1.0.0
- Initial release
- Customer portal
- Basic file upload
- Reference number generation

---

## License

Copyright 2025 SCal Mobile. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, or distribution is strictly prohibited.

---

## Company Information

**SCal Mobile**
8583 Irvine Center Dr., #214
Irvine, CA 92618

**Website**: https://www.scalmob.com
**RMA Email**: rma@scalmob.com

---

**Built with care for the SCal Mobile finance and operations teams.**
