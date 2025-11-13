# 🚀 Quick Deploy Guide - Execute These Commands

## Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Name: `scal-rma-portal`
3. Privacy: **Private**
4. Click "Create repository"

## Step 2: Push to GitHub

Copy your GitHub username and run these commands:

```bash
cd "/Users/brandonin/scal rma dashboard"

# Replace YOUR_GITHUB_USERNAME with your actual username
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/scal-rma-portal.git

git branch -M main
git push -u origin main
```

## Step 3: Deploy to Replit

1. Go to: https://replit.com
2. Click **"+ Create Repl"**
3. Select **"Import from GitHub"**
4. Paste: `https://github.com/YOUR_GITHUB_USERNAME/scal-rma-portal`
5. Click **"Import from GitHub"**

## Step 4: Add Secrets in Replit

Click Tools (🔧) → Secrets (🔐) and add:

### Required (from your .env file):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `NODE_ENV` = `production`
- `PORT` = `3000`

### Optional (if using Google Sheets):
- `GOOGLE_SHEET_ID`
- `GOOGLE_DRIVE_FOLDER_ID`

## Step 5: Run!

Click the **Run** button in Replit. Done! 🎉

---

**For detailed instructions, see `REPLIT-DEPLOYMENT.md`**
