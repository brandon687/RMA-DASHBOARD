# Deployment Guide - SCal Mobile RMA Portal

Complete guide for deploying the RMA portal to various hosting platforms.

## Quick Deploy Options

### Option 1: Replit (Recommended for Quick Start)

**Pros**: Zero configuration, instant deployment, free tier available, automatic HTTPS

**Steps**:

1. **Create Replit Account**
   - Go to https://replit.com
   - Sign up or log in

2. **Create New Repl**
   - Click "Create Repl"
   - Select "Import from GitHub" OR "Upload folder"
   - Choose Node.js template

3. **Upload Files**
   - If not using GitHub, upload all files from this directory
   - Replit will detect the `.replit` configuration file

4. **Install Dependencies**
   - Replit auto-installs from `package.json`
   - If needed, run in Shell: `npm install`

5. **Run the Application**
   - Click the "Run" button
   - Your app will be live at: `https://your-repl-name.your-username.repl.co`

6. **Configure Domain (Optional)**
   - Go to Repl settings
   - Add custom domain: `rma.scalmob.com`
   - Update DNS records as instructed

**Cost**: Free tier available, $7/month for always-on hosting

---

### Option 2: GitHub + Vercel

**Pros**: Free, automatic deploys, excellent performance, custom domains

**Steps**:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SCal Mobile RMA Portal"
   git branch -M main
   git remote add origin https://github.com/yourusername/scal-rma-portal.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Connect your GitHub repository
   - Configure:
     - Framework Preset: Other
     - Build Command: `npm install`
     - Output Directory: (leave empty)
     - Install Command: `npm install`

3. **Configure Environment**
   - Add environment variables in Vercel dashboard
   - Use `.env.example` as reference

4. **Deploy**
   - Vercel automatically deploys
   - Get URL: `https://your-project.vercel.app`

5. **Custom Domain**
   - Add `rma.scalmob.com` in Vercel settings
   - Update DNS records as shown

**Cost**: Free for personal/commercial use

---

### Option 3: Heroku

**Pros**: Established platform, good for production, add-ons available

**Steps**:

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Application**
   ```bash
   heroku create scal-rma-portal
   ```

4. **Add Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3000
   # Add other variables from .env.example
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Open Application**
   ```bash
   heroku open
   ```

8. **Custom Domain**
   ```bash
   heroku domains:add rma.scalmob.com
   # Follow DNS instructions
   ```

**Cost**: Free tier available (sleeps after 30 min), $7/month for hobby tier

---

### Option 4: Railway

**Pros**: Modern, easy to use, great developer experience

**Steps**:

1. **Connect GitHub**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure**
   - Select your repository
   - Railway auto-detects Node.js
   - Add environment variables

3. **Deploy**
   - Railway automatically builds and deploys
   - Get URL from dashboard

4. **Custom Domain**
   - Click "Settings" → "Domains"
   - Add `rma.scalmob.com`
   - Update DNS records

**Cost**: $5 free credit/month, then pay-as-you-go

---

### Option 5: DigitalOcean App Platform

**Pros**: Reliable, scalable, good documentation

**Steps**:

1. **Create Account**
   - Go to https://digitalocean.com
   - Sign up and add payment method

2. **Create App**
   - Go to "Apps" → "Create App"
   - Connect GitHub repository
   - Or upload code directly

3. **Configure**
   - Detected type: Node.js
   - Build Command: `npm install`
   - Run Command: `npm start`

4. **Add Environment Variables**
   - In app settings, add variables from `.env.example`

5. **Deploy**
   - Click "Create Resources"
   - Wait for deployment

6. **Custom Domain**
   - Settings → Domains
   - Add `rma.scalmob.com`

**Cost**: $5/month basic tier

---

## DNS Configuration

For custom domain `rma.scalmob.com`:

### A Record (if provider gives IP)
```
Type: A
Name: rma
Value: [IP Address from hosting provider]
TTL: 3600
```

### CNAME Record (most common)
```
Type: CNAME
Name: rma
Value: [provided by hosting platform]
TTL: 3600
```

### Verification
```bash
# Check DNS propagation
nslookup rma.scalmob.com

# Or use online tool
# https://dnschecker.org
```

---

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] All pages accessible
- [ ] File upload works
- [ ] Form submission succeeds
- [ ] Reference numbers generate
- [ ] No console errors
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain configured
- [ ] Environment variables set
- [ ] Email notifications working (if configured)
- [ ] Monitoring enabled
- [ ] Backups configured

---

## Production Optimizations

### 1. Enable Compression
Add to `server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

Install: `npm install compression`

### 2. Add Security Headers
```javascript
const helmet = require('helmet');
app.use(helmet());
```

Install: `npm install helmet`

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

Install: `npm install express-rate-limit`

### 4. Database Integration

**MongoDB**:
```bash
npm install mongodb mongoose
```

**PostgreSQL**:
```bash
npm install pg sequelize
```

Replace JSON file storage in `server.js` with database calls.

### 5. Email Notifications

```bash
npm install nodemailer
```

Add email service configuration in `.env`:
```env
EMAIL_SERVICE=smtp.gmail.com
EMAIL_USER=rma@scalmob.com
EMAIL_PASS=your-app-password
```

Update `server.js` to send confirmation emails.

---

## Monitoring & Analytics

### Application Monitoring

**Sentry** (Error Tracking):
```bash
npm install @sentry/node
```

**LogDNA** (Logging):
```bash
npm install @logdna/logger
```

### Analytics

Add to `index.html` before `</head>`:

**Google Analytics**:
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## Backup Strategy

### 1. Automated Backups

**Database**: Daily automated backups (if using hosted DB)

**Files**: Backup `uploads/` directory daily

```bash
# Example backup script
#!/bin/bash
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/
```

### 2. Version Control

Keep code in GitHub with tags for releases:
```bash
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0
```

---

## Scaling Considerations

### When to Scale

- More than 1000 submissions/day
- Upload directory exceeds 10GB
- Response times exceed 2 seconds
- Multiple concurrent users (100+)

### Scaling Options

1. **Vertical Scaling**: Upgrade server resources
2. **Horizontal Scaling**: Multiple server instances with load balancer
3. **CDN**: CloudFlare for static assets
4. **Object Storage**: AWS S3 or DigitalOcean Spaces for uploaded files
5. **Managed Database**: MongoDB Atlas or Amazon RDS

---

## Troubleshooting

### Application Won't Start

```bash
# Check Node version (should be 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :3000
```

### File Uploads Failing

- Check `/tmp` directory permissions
- Verify file size limits
- Check disk space
- Review server logs

### Database Connection Issues

- Verify connection string
- Check firewall rules
- Confirm IP whitelist (if applicable)
- Test connection with CLI

---

## Support Resources

- **Replit Docs**: https://docs.replit.com
- **Vercel Docs**: https://vercel.com/docs
- **Heroku Docs**: https://devcenter.heroku.com
- **Node.js Docs**: https://nodejs.org/docs
- **Express.js Docs**: https://expressjs.com

---

## Emergency Procedures

### Rollback Deployment

**Vercel/Railway**: Revert to previous deployment in dashboard

**Heroku**:
```bash
heroku rollback
```

**Manual**:
```bash
git revert HEAD
git push origin main
```

### Take Site Offline

Create `maintenance.html` and route all traffic to it in `server.js`.

---

**Deployment Complete!** Your SCal Mobile RMA Portal is ready to serve customers.
