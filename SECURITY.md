# Security Considerations

## Current Security Status

### Known Dependencies
The project uses `xlsx` library for spreadsheet processing, which has a known vulnerability (Prototype Pollution). This is acceptable for the current use case because:

1. **Controlled Environment**: Files are uploaded by authenticated business customers
2. **Internal Processing**: Files are processed server-side, not exposed to end users
3. **No Client Execution**: No code from uploaded files is executed
4. **Mitigation**: Files are validated and sanitized before processing

### Implemented Security Measures

1. **File Upload Limits**
   - Maximum file size: 10MB per file
   - Files stored in temporary directory
   - Automatic cleanup of processed files

2. **Input Validation**
   - All form fields are required and validated
   - Email format validation
   - Numeric quantity validation
   - File type checking

3. **CORS Configuration**
   - Cross-origin requests handled safely
   - Can be restricted to specific domains

4. **File Processing**
   - Files processed in isolated temp directory
   - No direct execution of uploaded content
   - Text extraction only from documents

## Production Security Recommendations

### Priority 1 (Critical)

1. **Enable HTTPS**
   ```javascript
   // Use hosting platform's HTTPS (Vercel, Heroku, etc.)
   // Or configure SSL certificate
   ```

2. **Add Authentication**
   ```bash
   npm install passport passport-local express-session
   ```

   Implement login system before allowing RMA submissions.

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

   ```javascript
   const rateLimit = require('express-rate-limit');

   const limiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 100 // limit each IP
   });

   app.use('/api/', limiter);
   ```

4. **Environment Variables**
   - Never commit `.env` file
   - Use secure secret keys
   - Rotate credentials regularly

### Priority 2 (Important)

5. **Security Headers**
   ```bash
   npm install helmet
   ```

   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

6. **File Scanning**
   ```bash
   npm install clamscan
   ```

   Scan uploaded files for malware before processing.

7. **SQL Injection Prevention**
   When adding database:
   - Use parameterized queries
   - ORM with built-in escaping (Sequelize, Mongoose)
   - Never concatenate user input into queries

8. **XSS Prevention**
   ```bash
   npm install xss
   ```

   ```javascript
   const xss = require('xss');
   const cleanInput = xss(userInput);
   ```

### Priority 3 (Recommended)

9. **Session Security**
   ```javascript
   app.use(session({
       secret: process.env.SESSION_SECRET,
       resave: false,
       saveUninitialized: false,
       cookie: {
           secure: true, // HTTPS only
           httpOnly: true,
           maxAge: 3600000 // 1 hour
       }
   }));
   ```

10. **CSRF Protection**
    ```bash
    npm install csurf
    ```

    ```javascript
    const csrf = require('csurf');
    app.use(csrf({ cookie: true }));
    ```

11. **Content Security Policy**
    ```javascript
    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
        }
    }));
    ```

12. **Logging & Monitoring**
    ```bash
    npm install winston
    ```

    Log all:
    - Failed login attempts
    - File upload events
    - API errors
    - Suspicious activity

## File Upload Security

### Current Implementation
```javascript
// File size limit
limits: { fileSize: 10 * 1024 * 1024 } // 10MB

// Temp file storage
useTempFiles: true,
tempFileDir: '/tmp/'
```

### Additional Measures

1. **File Type Validation**
   ```javascript
   const allowedTypes = [
       'application/pdf',
       'application/vnd.ms-excel',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'text/csv',
       'image/jpeg',
       'image/png'
   ];

   if (!allowedTypes.includes(file.mimetype)) {
       throw new Error('File type not allowed');
   }
   ```

2. **Filename Sanitization**
   ```javascript
   const sanitizeFilename = (filename) => {
       return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
   };
   ```

3. **File Content Validation**
   - Verify file headers match extensions
   - Check for executable content
   - Scan for malicious patterns

## Database Security

When implementing database storage:

### MongoDB
```javascript
// Use connection string from environment
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Enable authentication
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
});
```

### PostgreSQL
```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
```

## API Security

### Authentication Middleware
```javascript
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/submit-rma', requireAuth, async (req, res) => {
    // Protected endpoint
});
```

### Input Sanitization
```javascript
const sanitize = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

const companyName = sanitize(req.body.companyName);
```

## Compliance

### Data Privacy

**GDPR Compliance** (if serving EU customers):
- Add privacy policy
- Implement data deletion requests
- Get consent for data storage
- Encrypt sensitive data

**CCPA Compliance** (California):
- Privacy policy disclosure
- Data access requests
- Opt-out mechanisms

### PCI DSS

If handling payment information:
- Never store credit card numbers
- Use payment processor API
- Maintain secure network
- Regular security audits

## Incident Response Plan

### If Security Breach Occurs

1. **Immediate Actions**
   - Take affected systems offline
   - Preserve logs and evidence
   - Notify security team

2. **Investigation**
   - Identify breach scope
   - Determine data accessed
   - Find vulnerability source

3. **Remediation**
   - Patch vulnerabilities
   - Reset credentials
   - Update security measures

4. **Notification**
   - Notify affected customers
   - Report to authorities (if required)
   - Document incident

## Security Checklist

Before going to production:

- [ ] HTTPS enabled
- [ ] Authentication implemented
- [ ] Rate limiting active
- [ ] Environment variables secured
- [ ] Security headers configured
- [ ] File uploads validated
- [ ] Database connections encrypted
- [ ] Logging enabled
- [ ] Backups configured
- [ ] Incident response plan documented
- [ ] Security audit completed
- [ ] Dependencies updated
- [ ] Error messages sanitized (no sensitive info)
- [ ] CORS properly configured
- [ ] Session management secure
- [ ] Input validation on all fields

## Security Updates

Keep dependencies updated:
```bash
# Check for updates
npm outdated

# Update packages
npm update

# Audit security
npm audit

# Fix vulnerabilities
npm audit fix
```

## Contact

For security issues:
- **Email**: security@scalmob.com
- **Priority**: Critical vulnerabilities reported within 24 hours

---

**Security is an ongoing process.** Regularly review and update security measures.
