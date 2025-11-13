# Replit Production Deployment Guide

## Overview
This guide will help you deploy the SCal Mobile RMA Portal to Replit for production use.

## Prerequisites
- GitHub account
- Replit account
- Supabase account with database already set up

---

## Step 1: Push to GitHub

### 1.1 Create a New GitHub Repository
1. Go to https://github.com/new
2. Repository name: `scal-rma-portal` (or your preferred name)
3. Description: "SCal Mobile RMA Returns Management Portal"
4. Choose **Private** (recommended for production code)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 1.2 Push Your Local Code to GitHub

Run these commands in your terminal:

```bash
cd "/Users/brandonin/scal rma dashboard"

# Add the GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/scal-rma-portal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Import to Replit

### 2.1 Create Replit from GitHub
1. Go to https://replit.com
2. Click **"+ Create Repl"**
3. Select **"Import from GitHub"**
4. Paste your repository URL: `https://github.com/YOUR_USERNAME/scal-rma-portal`
5. Click **"Import from GitHub"**
6. Replit will automatically detect the Node.js project

### 2.2 Configure Environment Variables (Secrets)
In your Replit project:

1. Click the **"Tools"** icon (🔧) in the left sidebar
2. Select **"Secrets"** (🔐)
3. Add the following secrets (click "+ New secret" for each):

#### Required Secrets:

| Key | Value | Where to Get It |
|-----|-------|----------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key | Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret` |
| `JWT_SECRET` | A random 32+ character string | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `production` | Set manually |
| `PORT` | `3000` | Set manually |

#### Optional Secrets (for Google Sheets integration):

| Key | Value |
|-----|-------|
| `GOOGLE_SHEET_ID` | Your Google Sheet ID from URL |
| `GOOGLE_DRIVE_FOLDER_ID` | Your Google Drive folder ID |
| `GOOGLE_CREDENTIALS_PATH` | `./google-credentials.json` |

**Note:** For Google Sheets, you'll need to upload the `google-credentials.json` file separately (see below).

### 2.3 Upload Google Credentials (Optional)
If using Google Sheets integration:

1. In Replit, use the file browser on the left
2. Click the three dots (⋮) menu
3. Select "Upload file"
4. Upload your `google-credentials.json` file
5. Ensure it's in the root directory

---

## Step 3: Test the Deployment

### 3.1 Run the Application
1. Click the **"Run"** button at the top of Replit
2. Wait for the server to start (you should see the banner)
3. The Webview should automatically open showing your RMA portal

### 3.2 Verify Functionality
Test the following:

- [ ] Customer portal loads correctly
- [ ] Admin portal is accessible at `/admin.html`
- [ ] File upload works
- [ ] Supabase connection is active (check console logs)
- [ ] Submissions save to database

### 3.3 Check Server Logs
In the Replit console, you should see:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         SCAL MOBILE RMA PORTAL - SERVER RUNNING           ║
║                                                            ║
║  Server:  http://localhost:3000                         ║
║  Status:  Ready to accept RMA submissions                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✓ Supabase client initialized
```

---

## Step 4: Deploy to Production

### 4.1 Enable Always-On (Recommended for Production)
Replit free tier turns off after inactivity. For production:

1. Upgrade to **Replit Core** or **Teams** plan
2. Enable **"Always On"** in deployment settings
3. This keeps your server running 24/7

### 4.2 Configure Custom Domain (Optional)
If you want a custom domain (e.g., `rma.scalmob.com`):

1. Go to your Repl's deployment settings
2. Click **"Deployments"** tab
3. Click **"Deploy"**
4. Once deployed, click **"Link domain"**
5. Follow instructions to configure DNS settings

---

## Step 5: Update Environment for Production

### 5.1 Update ALLOWED_ORIGINS
In Replit Secrets, add/update:

```
ALLOWED_ORIGINS=https://your-repl-name.your-username.repl.co,https://scalmob.com,https://tuveinc.com
```

Replace `your-repl-name.your-username.repl.co` with your actual Replit URL.

### 5.2 Enable Production Security
Ensure these are set in Replit Secrets:

```
NODE_ENV=production
ENABLE_AUTH=true
```

---

## Troubleshooting

### Issue: "Address already in use"
**Solution:** Restart the Repl (Stop and Run again)

### Issue: "Supabase connection failed"
**Solution:**
- Verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase Dashboard → Settings → API
- Ensure no extra spaces in the secret values

### Issue: "Cannot find module"
**Solution:**
- Open Shell in Replit
- Run: `npm install`
- Then click Run again

### Issue: Files not uploading
**Solution:**
- Replit has limited storage. Consider using Supabase Storage or S3 for production file storage
- Check file size limits in environment variables

### Issue: Google Sheets not working
**Solution:**
- Verify `google-credentials.json` is uploaded to root directory
- Check that the service account has editor access to the Google Sheet
- Verify `GOOGLE_SHEET_ID` is correct

---

## Monitoring and Maintenance

### Check Application Health
Visit: `https://your-repl-url/api/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T...",
  "service": "SCal Mobile RMA Portal"
}
```

### View Logs
- In Replit, check the Console tab for real-time logs
- Logs show all submissions, errors, and system events

### Database Backups
- Supabase automatically backs up your database
- View backups: Supabase Dashboard → Database → Backups

---

## Post-Deployment Checklist

- [ ] Server is running and accessible
- [ ] Environment variables configured
- [ ] Supabase connection working
- [ ] Customer portal tested
- [ ] Admin portal tested
- [ ] File uploads working
- [ ] Email notifications configured (if needed)
- [ ] Always-On enabled (for production)
- [ ] Custom domain configured (if needed)
- [ ] CORS origins updated for production URL
- [ ] Team members have access to Replit project

---

## URLs After Deployment

Replace `YOUR_USERNAME` and `YOUR_REPL_NAME` with your actual values:

- **Customer Portal:** `https://YOUR_REPL_NAME.YOUR_USERNAME.repl.co`
- **Admin Portal:** `https://YOUR_REPL_NAME.YOUR_USERNAME.repl.co/admin.html`
- **API Health Check:** `https://YOUR_REPL_NAME.YOUR_USERNAME.repl.co/api/health`

---

## Support

If you encounter issues:

1. Check the Replit console for error messages
2. Verify all environment variables are set correctly
3. Check Supabase logs in the Dashboard
4. Review the `TROUBLESHOOTING.md` file in this repository

---

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use Replit Secrets** for all sensitive data
3. **Enable authentication** in production (`ENABLE_AUTH=true`)
4. **Use HTTPS only** - Replit provides this automatically
5. **Regularly update dependencies** - Run `npm audit` and `npm update`
6. **Monitor rate limits** - Check if you need to adjust based on traffic
7. **Review access logs** - Check who's accessing your admin portal

---

## Next Steps

Once deployed and tested:

1. Share the customer portal URL with your team
2. Train staff on using the admin dashboard
3. Set up monitoring and alerts
4. Consider implementing automated backups
5. Document your specific workflows

---

**Deployment completed! Your RMA portal is now live on Replit.**
