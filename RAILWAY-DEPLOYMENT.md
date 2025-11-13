# 🚂 Railway Production Deployment Guide

## Overview
Deploy the SCal Mobile RMA Portal to Railway for production use with zero-downtime, automatic SSL, and professional infrastructure.

**Repository**: https://github.com/brandon687/RMA-DASHBOARD.git

---

## Why Railway?

✅ **Professional Infrastructure** - Built for production applications
✅ **Automatic SSL/HTTPS** - Free SSL certificates
✅ **Zero-Downtime Deployments** - Seamless updates
✅ **Custom Domains** - Add your own domain (rma.scalmob.com)
✅ **Environment Variables** - Secure secret management
✅ **PostgreSQL Integration** - Direct Supabase connection
✅ **Auto-Scaling** - Handles traffic spikes
✅ **$5/month** - Affordable production hosting

---

## Prerequisites

- ✅ GitHub repository pushed: https://github.com/brandon687/RMA-DASHBOARD.git
- ✅ Railway account (sign up at https://railway.app)
- ✅ Supabase database configured
- ✅ Environment variables from your `.env` file

---

## 🚀 Step 1: Deploy to Railway (2 minutes)

### 1.1 Create New Project from GitHub

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select repository: **`brandon687/RMA-DASHBOARD`**
6. Click **"Deploy Now"**

Railway will automatically:
- Detect Node.js project
- Install dependencies from `package.json`
- Use `nixpacks.toml` configuration
- Start the server with `npm start`

### 1.2 Wait for Initial Deploy
- Initial deployment takes 2-3 minutes
- Watch the build logs in Railway dashboard
- Status will change from "Building" → "Deploying" → "Active"

---

## 🔐 Step 2: Configure Environment Variables (3 minutes)

### 2.1 Add Environment Variables

In your Railway project dashboard:

1. Click on your service (should say "RMA-DASHBOARD")
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"** for each entry below

### Required Environment Variables:

#### Server Configuration
```bash
PORT=3000
NODE_ENV=production
```

#### Supabase Database (REQUIRED)
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**
- Supabase Dashboard → Settings → API
- Copy `Project URL` → `SUPABASE_URL`
- Copy `anon public` key → `SUPABASE_ANON_KEY`
- Copy `service_role secret` key → `SUPABASE_SERVICE_KEY`

#### Authentication (REQUIRED)
```bash
JWT_SECRET=your-random-32-character-secret
SESSION_SECRET=another-random-secret
ADMIN_EMAIL=admin@scalmob.com
ENABLE_AUTH=true
```

**Generate secure secrets:**
```bash
# Run this locally to generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run again for SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Security & CORS
```bash
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=https://your-railway-domain.railway.app,https://scalmob.com,https://tuveinc.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Note:** Replace `your-railway-domain.railway.app` with your actual Railway domain (see next step).

#### Optional - Google Sheets Integration
```bash
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

#### Optional - Email Notifications
```bash
EMAIL_SERVICE=smtp.gmail.com
EMAIL_USER=rma@scalmob.com
EMAIL_PASS=your-email-app-password
```

### 2.2 Upload Google Credentials (if using)

If using Google Sheets integration:

1. In Railway dashboard, go to your service
2. Click the **"Settings"** tab
3. Scroll to **"Service Tokens"** or use Railway CLI
4. Upload via CLI (see Railway CLI section below)

**Alternative:** Use Railway Volumes for file storage

---

## 🌐 Step 3: Get Your Deployment URL

### 3.1 Find Your Railway Domain

1. In Railway dashboard, click on your service
2. Go to the **"Settings"** tab
3. Look for **"Domains"** section
4. Your default URL will be: `https://your-app-name.up.railway.app`

### 3.2 Update ALLOWED_ORIGINS

1. Copy your Railway domain
2. Go back to **"Variables"** tab
3. Update the `ALLOWED_ORIGINS` variable to include your Railway domain
4. Click **"Save"** (Railway will redeploy automatically)

Example:
```bash
ALLOWED_ORIGINS=https://scal-rma-dashboard.up.railway.app,https://scalmob.com,https://tuveinc.com
```

---

## 🎯 Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain to Railway

1. In Railway dashboard, go to **"Settings"** → **"Domains"**
2. Click **"+ Add Domain"**
3. Enter your domain: `rma.scalmob.com`
4. Railway will provide DNS records

### 4.2 Configure DNS

Add these DNS records in your domain provider (e.g., GoDaddy, Cloudflare):

**For root domain (scalmob.com):**
```
Type: A
Name: @
Value: [Railway IP provided]
```

**For subdomain (rma.scalmob.com):**
```
Type: CNAME
Name: rma
Value: your-app-name.up.railway.app
```

### 4.3 Wait for SSL Certificate
- Railway automatically provisions SSL certificates
- Takes 5-15 minutes for DNS propagation
- Your site will be accessible via HTTPS

### 4.4 Update Environment Variables
Update `ALLOWED_ORIGINS` to include your custom domain:
```bash
ALLOWED_ORIGINS=https://rma.scalmob.com,https://scalmob.com,https://tuveinc.com
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Your Deployment

Visit your URLs:

- **Customer Portal**: `https://your-app.up.railway.app/`
- **Admin Portal**: `https://your-app.up.railway.app/admin.html`
- **Health Check**: `https://your-app.up.railway.app/api/health`

### 5.2 Health Check Response
Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T...",
  "service": "SCal Mobile RMA Portal"
}
```

### 5.3 Test Functionality Checklist

- [ ] Customer portal loads
- [ ] Admin portal loads
- [ ] File upload works
- [ ] Supabase connection successful (check Railway logs)
- [ ] Form submission creates database entry
- [ ] IMEI extraction from Excel files works
- [ ] Admin can view submissions
- [ ] Admin can download files

### 5.4 Check Railway Logs

1. In Railway dashboard, click on your service
2. Go to the **"Deployments"** tab
3. Click on the active deployment
4. View logs in real-time

You should see:
```
✓ Supabase client initialized

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         SCAL MOBILE RMA PORTAL - SERVER RUNNING           ║
║                                                            ║
║  Server:  http://localhost:3000                         ║
║  Status:  Ready to accept RMA submissions                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🔄 Step 6: Continuous Deployment (Already Setup!)

### 6.1 Automatic Deployments

Railway is now watching your GitHub repository:

1. **Make changes** locally
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. **Railway automatically deploys** - Zero manual intervention!

### 6.2 Monitor Deployments

- Go to Railway dashboard → "Deployments" tab
- See real-time build logs
- Track deployment status
- Rollback if needed

---

## 🛠️ Railway CLI (Optional but Recommended)

### Install Railway CLI

```bash
# macOS
brew install railway

# npm
npm i -g @railway/cli

# Verify
railway --version
```

### Login and Link Project

```bash
# Login to Railway
railway login

# Link to your project
cd "/Users/brandonin/scal rma dashboard"
railway link
```

### Useful CLI Commands

```bash
# View logs in real-time
railway logs

# Run commands in Railway environment
railway run node script.js

# Open Railway dashboard
railway open

# Deploy manually
railway up

# Add environment variable
railway variables set KEY=value

# View all variables
railway variables
```

### Upload Google Credentials via CLI

```bash
# Copy file to Railway
railway run --service=your-service cp ./google-credentials.json /app/google-credentials.json
```

---

## 📊 Monitoring & Maintenance

### View Application Metrics

Railway provides:
- **CPU usage** - Monitor server load
- **Memory usage** - Track memory consumption
- **Network traffic** - Bandwidth usage
- **Deployment history** - All past deployments
- **Build logs** - Complete build output

Access: Railway Dashboard → Your Service → "Metrics" tab

### Database Monitoring

Use Supabase Dashboard:
- **Database → Logs** - Query logs
- **Database → Usage** - Storage and connection stats
- **Database → Backups** - Automatic backups

### Set Up Alerts (Optional)

Railway can notify you via:
- Email
- Slack
- Discord
- Webhooks

Configure: Railway Dashboard → Project Settings → Notifications

---

## 🔒 Security Best Practices

### Production Checklist

- [x] `NODE_ENV=production` set in Railway
- [x] `ENABLE_AUTH=true` for admin access
- [x] Secure `JWT_SECRET` and `SESSION_SECRET` generated
- [x] CORS `ALLOWED_ORIGINS` configured for production domains only
- [x] Rate limiting enabled (already in code)
- [x] File upload size limits set (`MAX_FILE_SIZE`)
- [x] HTTPS only (Railway provides automatically)
- [ ] Regular dependency updates (`npm audit` and `npm update`)
- [ ] Monitor Railway logs for suspicious activity
- [ ] Rotate secrets every 90 days

### Environment Variables Security

✅ **DO:**
- Use Railway Variables (encrypted at rest)
- Generate strong random secrets
- Rotate secrets regularly
- Use different secrets for dev/prod

❌ **DON'T:**
- Commit `.env` to git (already in `.gitignore`)
- Share secrets via email/chat
- Use weak or simple secrets
- Reuse secrets across projects

---

## 💰 Railway Pricing

### Free Trial
- $5 free credits
- Good for testing

### Hobby Plan ($5/month)
- Perfect for production
- Includes:
  - 512MB RAM
  - Shared CPU
  - Custom domains
  - Automatic SSL
  - 100GB outbound bandwidth

### Pro Plan ($20/month)
- For higher traffic
- Includes:
  - 8GB RAM
  - Dedicated CPU
  - Priority support
  - Advanced metrics

**Recommended:** Start with Hobby, upgrade if needed.

---

## 🐛 Troubleshooting

### Issue: "Application failed to start"

**Check Railway logs for:**
```
Error: listen EADDRINUSE: address already in use
```

**Solution:**
- Verify `PORT` environment variable is set correctly
- Railway automatically assigns `PORT` - your app reads from `process.env.PORT`
- Check `server.js` line 16: `const PORT = process.env.PORT || 3000;`

---

### Issue: "Cannot connect to Supabase"

**Check:**
1. `SUPABASE_URL` is correct (no trailing slash)
2. `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` are correct
3. No extra spaces in Railway variables
4. Supabase project is active

**Verify in Railway logs:**
```
✓ Supabase client initialized
```

If you see error, check Supabase Dashboard → Settings → API

---

### Issue: "CORS errors in browser"

**Solution:**
1. Check Railway logs for actual domain
2. Update `ALLOWED_ORIGINS` in Railway Variables to include:
   - Your Railway domain
   - Your custom domain (if configured)
   - Any other allowed origins

Example:
```bash
ALLOWED_ORIGINS=https://scal-rma.up.railway.app,https://rma.scalmob.com,https://scalmob.com
```

---

### Issue: "Files not uploading"

**Check:**
1. `MAX_FILE_SIZE` is set (default: 10MB)
2. Railway has enough disk space (check metrics)
3. File size doesn't exceed limit
4. File type is supported

**Railway Logs will show:**
```
Error: File size exceeds maximum allowed size
```

---

### Issue: "Build fails on Railway"

**Common causes:**
1. Missing dependencies in `package.json`
2. Node version incompatibility
3. Build script errors

**Solution:**
- Check Railway build logs
- Verify `nixpacks.toml` specifies `nodejs-20_x`
- Ensure all dependencies in `package.json`
- Test locally: `npm ci && npm start`

---

### Issue: "Google Sheets integration not working"

**Check:**
1. `google-credentials.json` uploaded to Railway
2. `GOOGLE_CREDENTIALS_PATH=./google-credentials.json` in variables
3. Service account has editor access to Google Sheet
4. `GOOGLE_SHEET_ID` is correct

**Railway logs should show:**
```
📊 Google Sheets Integration: ACTIVE
```

If not working:
```
📁 Running in LOCAL MODE
```

---

## 📱 Access Your Production App

After successful deployment:

### Customer Portal
Share this URL with customers:
```
https://your-app.up.railway.app/
```
Or with custom domain:
```
https://rma.scalmob.com/
```

### Admin Dashboard
Internal use only:
```
https://your-app.up.railway.app/admin.html
```

### API Health Check
Monitor uptime:
```
https://your-app.up.railway.app/api/health
```

---

## 🎉 Post-Deployment Checklist

- [ ] Railway deployment successful
- [ ] Environment variables configured
- [ ] Supabase connection verified
- [ ] Customer portal tested
- [ ] Admin portal tested
- [ ] File uploads working
- [ ] IMEI extraction working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] CORS properly configured
- [ ] Team has access to Railway project
- [ ] Monitoring/alerts setup (optional)
- [ ] Documentation shared with team
- [ ] Local server stopped (or kept for development)

---

## 🔗 Important URLs

- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Repository**: https://github.com/brandon687/RMA-DASHBOARD
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Your Production App**: `https://[your-railway-domain].up.railway.app`

---

## 📞 Support & Resources

### Railway Documentation
- Main Docs: https://docs.railway.app
- Deploy Node.js: https://docs.railway.app/guides/nodejs
- Environment Variables: https://docs.railway.app/develop/variables
- Custom Domains: https://docs.railway.app/deploy/exposing-your-app

### Your Project Documentation
- `README.md` - Project overview
- `QUICK_START.md` - Local setup guide
- `SUPABASE_SETUP.md` - Database configuration
- `SECURITY.md` - Security guidelines

---

## 🚀 Next Steps

1. **Test thoroughly** - Run through all workflows
2. **Train your team** - Share admin dashboard access
3. **Monitor closely** - Watch Railway metrics for first 24 hours
4. **Backup plan** - Document rollback procedure
5. **Scale as needed** - Upgrade Railway plan if traffic increases

---

**🎊 Congratulations! Your SCal Mobile RMA Portal is now live on Railway!**

**Production URL**: `https://your-app.up.railway.app`

---

*Last Updated: 2025-11-13*
*Railway Deployment Guide v1.0*
