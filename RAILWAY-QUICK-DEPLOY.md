# 🚂 Railway Quick Deploy - 5 Minutes to Production

## Step 1: Deploy from GitHub (1 minute)

1. Go to: https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: **`brandon687/RMA-DASHBOARD`**
5. Click **"Deploy Now"**

✅ Railway automatically builds and deploys!

---

## Step 2: Add Environment Variables (3 minutes)

Click on your service → **"Variables"** tab → **"+ New Variable"**

### Copy these from your local `.env` file:

**Required:**
```bash
# From Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-secret-here
SESSION_SECRET=another-generated-secret-here

# Standard settings
NODE_ENV=production
PORT=3000
ENABLE_AUTH=true
ADMIN_EMAIL=admin@scalmob.com
```

**Security (update after Step 3):**
```bash
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Optional (if using Google Sheets):**
```bash
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

---

## Step 3: Get Your URL (30 seconds)

1. In Railway, go to **"Settings"** → **"Domains"**
2. Copy your URL: `https://your-app.up.railway.app`
3. Go back to **"Variables"** tab
4. Add one more variable:

```bash
ALLOWED_ORIGINS=https://your-app.up.railway.app,https://scalmob.com,https://tuveinc.com
```

Replace `your-app.up.railway.app` with your actual domain!

Railway will auto-redeploy with new variables.

---

## Step 4: Test! (1 minute)

Visit your URLs:

- **Customer Portal**: `https://your-app.up.railway.app/`
- **Admin Dashboard**: `https://your-app.up.railway.app/admin.html`
- **Health Check**: `https://your-app.up.railway.app/api/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T...",
  "service": "SCal Mobile RMA Portal"
}
```

---

## ✅ Done! Your app is live!

**Next:** See `RAILWAY-DEPLOYMENT.md` for:
- Custom domain setup (rma.scalmob.com)
- Monitoring & alerts
- Troubleshooting
- CLI setup

---

## Quick Troubleshooting

**Can't connect to Supabase?**
- Check variables have no extra spaces
- Verify keys in Supabase Dashboard → Settings → API

**CORS errors?**
- Update `ALLOWED_ORIGINS` with your Railway domain
- Check Railway logs: Service → Deployments → View logs

**Build failed?**
- Check Railway build logs
- Verify all variables are set
- Contact support if needed

---

**Need help?** Check the complete guide: `RAILWAY-DEPLOYMENT.md`
