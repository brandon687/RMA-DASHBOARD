# Quick Start Guide

Get your SCal Mobile RMA Portal running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org))
- Basic terminal/command line knowledge

## Installation Steps

### 1. Navigate to Directory
```bash
cd "scal rma dashboard"
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- Express.js (web server)
- File upload handling
- Excel/CSV processing
- PDF text extraction
- CORS support

### 3. Start the Server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         SCAL MOBILE RMA PORTAL - SERVER RUNNING           ║
║                                                            ║
║  Server:  http://localhost:3000                           ║
║  Status:  Ready to accept RMA submissions                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 4. Open in Browser
Navigate to: **http://localhost:3000**

## Test the Portal

### Landing Page Test
1. You should see "SCAL MOBILE RETURNS" with animation
2. Click "CONTINUE" button

### Customer Type Test
3. Choose "US Customer" or "International Customer"
4. Read through the guidelines
5. Click "Proceed to RMA Form"

### Form Submission Test
6. Fill in all required fields:
   - Company Name: "Test Company"
   - Company Email: "test@company.com"
   - Order Number: "ORD-12345"
   - Quantity: "10"

7. Upload test files:
   - Drag and drop `test-data/sample-rma.csv`
   - Or browse and select `test-data/sample-invoice.txt`

8. Click "Submit RMA Request"

9. You should see success screen with reference number

### Verify Submission
Check that files were processed:
```bash
# View submissions
cat uploads/submissions.json

# List uploaded files
ls -lh uploads/
```

## Common Issues

### Port Already in Use
If port 3000 is busy:
```bash
# Change port
PORT=3001 npm start
```

### Cannot Find Module Error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### File Upload Fails
```bash
# Check temp directory
ls -la /tmp

# On Windows, files are saved to Windows temp
```

## Next Steps

### Deploy to Production
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Replit deployment (easiest)
- Vercel deployment (free + fast)
- Heroku deployment (traditional)
- Custom domain setup

### Configure Email Notifications
1. Copy `.env.example` to `.env`
2. Add your SMTP credentials
3. Install nodemailer: `npm install nodemailer`
4. Uncomment email code in `server.js`

### Add Database
Instead of JSON file storage:
1. Choose MongoDB or PostgreSQL
2. Install appropriate package
3. Update storage logic in `server.js`

### Customize Branding
- Update logo text in `index.html` (line 15-18)
- Change colors in `styles.css` (:root variables)
- Modify content in `script.js` (guidelines sections)

## Development Tips

### Watch Files (Auto-restart)
```bash
# Install nodemon
npm install -g nodemon

# Run with auto-restart
nodemon server.js
```

### Debug Mode
```bash
# Enable detailed logging
DEBUG=* npm start
```

### Test Different File Types
Upload these to test file processing:
- Excel: `.xlsx`, `.xls`
- CSV: `.csv`
- PDF: `.pdf`
- Images: `.jpg`, `.png`
- Documents: `.txt`, `.doc`

## File Processing Examples

### CSV/Excel Processing
Files are automatically converted to JSON:
```javascript
{
  "format": "spreadsheet",
  "rowCount": 8,
  "data": [
    { "IMEI": "356938035643809", "Device": "iPhone 13" },
    ...
  ]
}
```

### PDF Processing
Text is extracted automatically:
```javascript
{
  "format": "pdf",
  "pages": 1,
  "text": "SCAL MOBILE\nInvoice...",
  "preview": "First 500 characters..."
}
```

## API Testing

### Using curl
```bash
# Health check
curl http://localhost:3000/api/health

# View submissions
curl http://localhost:3000/api/submissions
```

### Using Postman
1. Import as POST request: `http://localhost:3000/api/submit-rma`
2. Set Body type: form-data
3. Add fields: companyName, companyEmail, orderNumber, quantity, customerType
4. Add files: Select files to upload
5. Send request

## Support

Having issues? Check:
1. [README.md](README.md) - Full documentation
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guides
3. Console logs for error messages
4. GitHub Issues (if applicable)

---

**You're ready to go!** The portal is now running and ready to accept RMA submissions.
