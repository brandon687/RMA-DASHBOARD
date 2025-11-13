# SCal Mobile RMA Portal

Professional returns management system for SCal Mobile's used mobile device business. This portal streamlines the RMA (Returns Material Authorization) process for both US and international customers.

## Features

### Customer Experience
- **Animated Landing Page** - Professional branded entrance with SCal Mobile logo
- **Customer Type Selection** - Separate workflows for US and International customers
- **Interactive Guidelines** - Clear, comprehensive return instructions
- **Smart Form Validation** - Real-time validation to ensure complete submissions
- **Universal File Upload** - Drag-and-drop support for any file type
- **FAQ Section** - Comprehensive answers to common questions
- **Mobile Responsive** - Optimized for all device sizes

### Technical Capabilities
- **Automatic File Processing** - Converts and processes multiple file formats
- **Format Support**:
  - Spreadsheets: CSV, XLS, XLSX (auto-converted to standardized format)
  - Documents: PDF, TXT, DOC, DOCX (text extraction)
  - Images: JPEG, PNG, GIF, WebP, HEIC
  - Videos: MP4, MOV, WebM, AVI
  - Any other file type (stored for manual review)
- **Real-time Conversion Agent** - Automatically standardizes data formats
- **Reference Number Generation** - Unique tracking for every submission
- **Submission Tracking** - JSON-based storage (easily upgradable to database)

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **File Processing**:
  - `xlsx` - Excel/spreadsheet processing
  - `pdf-parse` - PDF text extraction
  - `express-fileupload` - File upload handling
- **Styling**: Custom CSS with SCal Mobile brand guidelines
- **Deployment Ready**: Replit, GitHub, or any Node.js hosting

## Installation & Setup

### Local Development

1. **Clone/Download the repository**
   ```bash
   cd "scal rma dashboard"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the portal**
   Open your browser to: `http://localhost:3000`

### Replit Deployment

1. **Import to Replit**
   - Create new Repl
   - Import from GitHub or upload files
   - Replit will auto-detect Node.js

2. **Auto-Configuration**
   - `.replit` file configures run command
   - `replit.nix` sets up environment
   - Click "Run" button

3. **Access your deployed site**
   - Replit provides automatic HTTPS URL
   - Share with customers

### GitHub Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SCal Mobile RMA Portal"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to hosting service**
   - Vercel: Connect GitHub repo, auto-deploy
   - Heroku: `git push heroku main`
   - Railway: Connect GitHub, configure Node.js
   - Render: Connect GitHub, set build command to `npm install`

## Configuration

### Environment Variables (Optional)

Create a `.env` file for production:

```env
PORT=3000
NODE_ENV=production
EMAIL_SERVICE=smtp.gmail.com
EMAIL_USER=rma@scalmob.com
EMAIL_PASS=your-password
ADMIN_EMAIL=admin@scalmob.com
```

### Email Notifications (Production)

To enable email notifications, install nodemailer:

```bash
npm install nodemailer
```

Add to `server.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send notification after submission
await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: companyEmail,
    cc: process.env.ADMIN_EMAIL,
    subject: `RMA Request Received - ${referenceNumber}`,
    html: `Your RMA request has been submitted...`
});
```

## File Structure

```
scal-rma-dashboard/
├── index.html              # Main application HTML
├── styles.css              # SCal Mobile branded styles
├── script.js               # Frontend JavaScript logic
├── server.js               # Backend API and file processing
├── package.json            # Dependencies and scripts
├── .replit                 # Replit configuration
├── replit.nix              # Replit environment
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── uploads/                # Generated: Uploaded files storage
    └── submissions.json    # Generated: Submission records
```

## API Endpoints

### POST /api/submit-rma
Submit a new RMA request

**Request Body:**
- `companyName` (string, required)
- `companyEmail` (email, required)
- `orderNumber` (string, required)
- `quantity` (number, required)
- `customerType` (string, required): "us" or "international"
- `files` (multipart/form-data, required): One or more files

**Response:**
```json
{
    "success": true,
    "referenceNumber": "RMA-ABC123-XYZ",
    "message": "RMA request submitted successfully",
    "filesProcessed": 3
}
```

### GET /api/health
Check server status

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2025-01-11T10:30:00.000Z",
    "service": "SCal Mobile RMA Portal"
}
```

### GET /api/submissions
Get all submissions (should be protected with authentication in production)

**Response:**
```json
{
    "success": true,
    "count": 15,
    "submissions": [...]
}
```

## Brand Alignment

This portal matches SCal Mobile's brand identity:

- **Colors**: Black (#000000) and White (#FFFFFF) with gray accents
- **Typography**: Inter font family, clean and professional
- **Design**: Minimalist, high-contrast B2B aesthetic
- **Spacing**: Generous padding and clean layouts
- **Trust Elements**: Professional presentation, clear guidelines

## Security Considerations

### Current Implementation
- 10MB file size limit
- File type validation
- Secure file storage
- Input sanitization

### Production Recommendations
1. **Add Authentication**
   ```bash
   npm install express-session passport
   ```

2. **Enable HTTPS**
   - Use Let's Encrypt certificates
   - Force HTTPS redirects

3. **Add Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

4. **Database Integration**
   ```bash
   npm install mongodb # or PostgreSQL
   ```

5. **File Scanning**
   ```bash
   npm install clamscan
   ```

## Testing

### Manual Testing Checklist

- [ ] Landing page animation displays correctly
- [ ] Continue button navigates to main portal
- [ ] Customer type selection shows appropriate guidelines
- [ ] Form validation catches empty fields
- [ ] File upload accepts multiple file types
- [ ] Drag and drop functionality works
- [ ] File removal works correctly
- [ ] Form submission completes successfully
- [ ] Reference number is generated
- [ ] Success screen displays
- [ ] FAQ accordion expands/collapses
- [ ] Mobile responsive design works
- [ ] All links function properly

### Test File Uploads

Test with various file types:
- CSV with device data
- Excel spreadsheet with IMEI numbers
- PDF invoice
- Image of damaged device
- Video of device issue

## Maintenance

### Regular Tasks
1. **Monitor submissions**: Check `uploads/submissions.json`
2. **Backup files**: Regular backup of `uploads/` directory
3. **Clear temp files**: Remove old files from `/tmp/`
4. **Update dependencies**: `npm audit fix`

### Logs
Server logs display in console. For production, add logging:
```bash
npm install winston
```

## Support

**Technical Issues**: Contact development team
**RMA Questions**: rma@scalmob.com
**Website**: https://www.scalmob.com

## Version History

### Version 1.0.0 (2025-01-11)
- Initial release
- Landing page with animation
- US/International customer workflows
- Universal file upload and processing
- Automatic file format conversion
- Complete RMA submission system
- Mobile responsive design
- FAQ and guidelines sections

## License

Copyright © 2025 SCal Mobile. All rights reserved.

---

**Built for SCal Mobile** - Premium used mobile device solutions
