# Development Guide

**SCal Mobile RMA Portal - Developer Documentation**

Technical guide for developers working on the RMA Portal codebase.

---

## Quick Start

```bash
# Clone repository
cd "scal rma dashboard"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Set up database
npm run setup-db

# Start development server
npm start

# Access
# Customer Portal: http://localhost:3000
# Admin Dashboard: http://localhost:3000/admin.html
```

---

## Architecture

### Tech Stack

**Frontend**: Vanilla JavaScript (no frameworks)
- HTML5, CSS3
- Fetch API for HTTP requests
- FormData for file uploads

**Backend**: Node.js + Express.js
- Express 4.18.2
- File upload: express-fileupload
- Rate limiting: express-rate-limit
- CORS enabled

**Database**: Supabase (PostgreSQL)
- @supabase/supabase-js client
- REST API access
- Row Level Security (RLS) disabled for simplicity

**File Processing**:
- xlsx: Excel parsing
- pdf-parse: PDF text extraction
- Custom IMEI extraction (handles Excel scientific notation)

**Deployment**: Railway
- Nixpacks buildpack
- Node.js 20
- Auto-deploy from Git

### Directory Structure

```
/
├── index.html              # Customer portal
├── admin.html              # Admin dashboard
├── script.js               # Customer portal logic
├── admin.js                # Admin dashboard logic
├── styles.css              # Global styles
├── server.js               # Express API server (MAIN FILE)
├── package.json            # Dependencies
├── nixpacks.toml           # Railway build config
│
├── services/               # Backend services
│   ├── supabase-client.js         # Database client (PRIMARY)
│   ├── excel-imei-extractor-v2.js # Smart Excel parser
│   ├── imei-validator.js          # IMEI validation
│   └── postgres-service.js        # Legacy (unused)
│
├── uploads/                # Local file storage
│   └── submissions.json   # Backup storage
│
├── scripts/                # Utility scripts
│   └── setup-database.js  # DB initialization
│
└── *.md                    # Documentation
```

---

## Key Files

### server.js (Lines 1-782)

**Main API server**. Key sections:

**Lines 20-40**: Security headers and CSP
**Lines 43-57**: Rate limiting configuration
**Lines 62-80**: CORS configuration
**Lines 107-285**: FileProcessor class (file handling)
**Lines 311-525**: POST /api/submit-rma (main submission endpoint)
**Lines 539-565**: GET /api/admin/submissions
**Lines 568-608**: GET /api/admin/submission/:refNum
**Lines 611-655**: GET /api/admin/download/:refNum/:fileId
**Lines 658-708**: POST /api/admin/submission/:refNum/status

### services/supabase-client.js

**Database client**. Key methods:

- `createSubmission(submission)`: Insert submission
- `addDevices(referenceNumber, devices)`: Insert devices with IMEI validation
- `addFile(fileData)`: Insert file metadata
- `getSubmissions(page, limit)`: Get paginated submissions
- `getDevicesBySubmission(referenceNumber)`: Get devices for submission

### services/excel-imei-extractor-v2.js

**Smart Excel parser**. Handles:

- Intelligent header detection (finds "IMEI" column)
- Column mapping (maps varying header names)
- Scientific notation conversion (3.57069E+14 → 357069403525410)
- Flexible row structure (adapts to different Excel layouts)

### services/imei-validator.js

**IMEI validation logic**. Rules:

- Exactly 15 digits
- Must start with 35
- Sanitizes scientific notation
- Flags invalid IMEIs for review

---

## Core Concepts

### Reference Number Generation

**Format**: `RMA-{TIMESTAMP}-{RANDOM}`

```javascript
function generateReferenceNumber() {
    const prefix = 'RMA';
    const timestamp = Date.now().toString(36).toUpperCase();  // Base-36 timestamp
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;  // e.g., "RMA-1M8X9C2-A3F5"
}
```

**Properties**:
- Unique (timestamp + random)
- Sortable (chronological)
- Human-readable
- 20 characters max

### File Processing Pipeline

```
Upload → Detect Type → Process → Extract Data → Validate → Store
```

**FileProcessor class** (server.js, lines 107-285):

1. **getFileType()**: Determine type by extension
2. **processFile()**: Route to appropriate processor
3. **processSpreadsheet()**: Extract devices using IMEI extractor
4. **processPDF()**: Extract text
5. **processImage/Video()**: Store metadata
6. **Return**: Processed file object

### IMEI Extraction Flow

```
Excel Upload → Read Raw Cells → Detect Headers → Map Columns →
Extract IMEIs → Handle Scientific Notation → Validate → Store
```

**ExcelIMEIExtractorV2** (services/excel-imei-extractor-v2.js):

1. **findHeaderRow()**: Locate row with "IMEI" column
2. **extractDevices()**: Parse all rows after header
3. **extractIMEI()**: Handle cell types (string/number)
4. **convertScientificNotation()**: Fix Excel formatting
5. **cleanIMEI()**: Sanitize and pad to 15 digits

**IMEIValidator** (services/imei-validator.js):

1. **sanitizeIMEI()**: Clean input
2. **validate()**: Check length and prefix
3. **Return**: Validation object with errors/warnings

---

## Adding New Features

### Add New API Endpoint

1. **Define route** in server.js:

```javascript
app.get('/api/new-endpoint', async (req, res) => {
    try {
        // Your logic here
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: 'Error message' });
    }
});
```

2. **Update API-DOCUMENTATION.md** with endpoint details

3. **Test** with curl or Postman

4. **Deploy** to Railway

### Add New Database Table

1. **Create migration** in scripts/:

```javascript
const { data, error } = await supabase
    .from('new_table')
    .insert([{ field: 'value' }]);
```

2. **Update DATABASE-SCHEMA.md**

3. **Add methods** to supabase-client.js:

```javascript
async createNewRecord(data) {
    const { data, error } = await this.client
        .from('new_table')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return data;
}
```

### Add New File Type Support

1. **Update FileProcessor** in server.js:

```javascript
this.supportedFormats = {
    newType: ['.ext1', '.ext2']
};
```

2. **Add processor method**:

```javascript
async processNewType(file) {
    // Processing logic
    return { format: 'newType', ...data };
}
```

3. **Update switch** in processFile():

```javascript
case 'newType':
    processedFile.processedData = await this.processNewType(file);
    break;
```

---

## Testing

### Manual Testing

**Test Submission Flow**:

1. Start server: `npm start`
2. Open http://localhost:3000
3. Select customer type
4. Fill form with test data
5. Upload test files (see /test-files/)
6. Submit and verify reference number
7. Check admin dashboard

**Test Admin Dashboard**:

1. Open http://localhost:3000/admin.html
2. Verify submissions appear
3. Click VIEW on submission
4. Test status change
5. Test file download
6. Test filters

### API Testing with curl

**Submit RMA**:

```bash
curl -X POST http://localhost:3000/api/submit-rma \
  -F "companyName=Test Company" \
  -F "companyEmail=test@example.com" \
  -F "orderNumber=SO-TEST-001" \
  -F "quantity=10" \
  -F "customerType=us" \
  -F "file_0=@test.xlsx"
```

**Get Submissions**:

```bash
curl http://localhost:3000/api/admin/submissions
```

**Change Status**:

```bash
curl -X POST http://localhost:3000/api/admin/submission/RMA-TEST/status \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

### Database Testing

```bash
# Test database connection
npm run test-db

# Preview database data
node preview-database-data.js
```

---

## Debugging

### Server Logs

**Local**:
- Console output shows all requests
- Errors printed with stack traces

**Railway**:
- Dashboard → Deployments → Logs
- Filter by error level

### Database Queries

**Supabase Dashboard**:
1. Go to https://supabase.com/dashboard
2. Select project
3. SQL Editor
4. Run queries manually

**Common Debug Queries**:

```sql
-- Check recent submissions
SELECT * FROM rma_submissions ORDER BY created_at DESC LIMIT 10;

-- Check devices for submission
SELECT * FROM rma_devices WHERE reference_number = 'RMA-XXX';

-- Check invalid IMEIs
SELECT * FROM rma_devices WHERE imei_valid = false;
```

### Browser Console

**Customer Portal** (script.js):
- Check for JavaScript errors (F12 → Console)
- Verify form data with `console.log(formData)`
- Monitor fetch requests (Network tab)

**Admin Dashboard** (admin.js):
- Check submissions array: `console.log(submissions)`
- Verify API responses: `console.log(data)`
- Monitor status changes

---

## Deployment

### Railway Deployment

**Auto-Deploy** on git push to main:

```bash
git add .
git commit -m "Your message"
git push origin main
```

Railway automatically:
1. Detects push
2. Builds using nixpacks.toml
3. Runs `npm ci --omit=dev`
4. Starts with `npm start`
5. Deploys to production URL

### Manual Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Environment Variables

**Set in Railway Dashboard**:

1. Go to project
2. Variables tab
3. Add/edit variables
4. Redeploy if necessary

**Required**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NODE_ENV=production`

---

## Code Style

### JavaScript

- Use `async/await` over callbacks
- Use `const` for constants, `let` for variables
- Use template literals for strings
- Comment complex logic
- Handle errors with try/catch

### HTML

- Semantic tags (header, main, section, footer)
- Accessible forms (labels, ARIA)
- Mobile-first responsive design

### CSS

- Custom properties (CSS variables)
- BEM-like naming for classes
- Responsive breakpoints
- No inline styles

---

## Performance

### Optimization Tips

1. **Minimize Database Queries**:
   - Use joins instead of multiple queries
   - Cache frequently accessed data
   - Use pagination

2. **File Upload**:
   - Validate file size client-side
   - Stream large files
   - Process asynchronously if possible

3. **Frontend**:
   - Lazy load images
   - Debounce search/filter inputs
   - Minimize DOM manipulations

---

## Security

### Input Validation

**Always validate**:
- Email format
- File sizes
- Required fields
- SQL injection (use parameterized queries)
- XSS (sanitize input)

**Current Implementation**:

```javascript
// Email validation
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Input sanitization
function sanitizeInput(input) {
    return input.replace(/[<>\"']/g, '').trim();
}
```

### Rate Limiting

**Configured** (server.js, lines 43-57):
- API: 100 requests / 15 minutes
- Submissions: 10 / hour

### CORS

**Configured** (server.js, lines 62-80):
- Development: Allow all origins
- Production: Whitelist specific domains

### Security Headers

**Configured** (server.js, lines 20-40):
- CSP, X-Frame-Options, X-XSS-Protection
- HTTPS-only in production

---

## Common Tasks

### Update Dependencies

```bash
npm update
npm audit fix
```

### Add New Dependency

```bash
npm install package-name
# Commit package.json and package-lock.json
```

### Database Migration

```bash
# Create backup first
node scripts/backup-database.js

# Run migration
node scripts/migrate-xyz.js

# Verify
npm run test-db
```

---

## Troubleshooting Dev Issues

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 [PID]

# Or use different port
PORT=3001 npm start
```

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Error

1. Check .env has correct credentials
2. Verify Supabase project is active
3. Check API keys in Supabase dashboard
4. Test connection: `npm run test-db`

---

## Resources

**Documentation**:
- Express.js: https://expressjs.com
- Supabase: https://supabase.com/docs
- xlsx: https://docs.sheetjs.com
- Railway: https://docs.railway.app

**Tools**:
- Postman: API testing
- Supabase Dashboard: Database management
- Railway Dashboard: Deployment monitoring
- Chrome DevTools: Frontend debugging

---

**Last Updated**: November 2025
**Codebase Version**: 1.2.0
**Node Version**: 18+
