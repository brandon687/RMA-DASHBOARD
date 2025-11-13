# Supabase Setup Guide - Complete Automation

## 🎯 Overview

Supabase is a free, hosted PostgreSQL database with a generous free tier:
- ✅ **500 MB database storage** (enough for ~50K RMAs)
- ✅ **5 GB bandwidth/month**
- ✅ **Automatic backups** (7 days retention)
- ✅ **Built-in API** (if we need it later)
- ✅ **No credit card required for free tier**
- ✅ **Web dashboard** to view data
- ✅ **Connection pooling included**

---

## 📋 Step 1: Create Supabase Account (2 minutes)

### 1.1 Sign Up
1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with:
   - GitHub account (recommended - fastest)
   - Or email/password

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Organization**: Create new (or use existing)
   - **Name**: `scal-rma-production` (or `scal-rma-dev`)
   - **Database Password**: Generate strong password (click generate button)
     - ⚠️ **SAVE THIS PASSWORD!** You'll need it in Step 2
   - **Region**: Choose closest to you:
     - `us-east-1` (Virginia) - USA East Coast
     - `us-west-1` (California) - USA West Coast
     - `eu-west-1` (Ireland) - Europe
3. Click **"Create new project"**
4. Wait 2 minutes for provisioning...

---

## 📋 Step 2: Get Connection Details

### 2.1 Find Your Connection String

Once your project is ready:

1. Click **"Settings"** (gear icon in left sidebar)
2. Click **"Database"**
3. Scroll to **"Connection string"** section
4. Copy the **"URI"** format (it looks like this):

```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres
```

5. Replace `[YOUR-PASSWORD]` with the password you saved in Step 1.2

**Example:**
```
postgresql://postgres:MySecurePass123!@db.xyzprojectref.supabase.co:5432/postgres
```

### 2.2 Update Your .env File

Open `/Users/brandonin/scal rma dashboard/.env` and add:

```bash
# ========================================
# SUPABASE DATABASE
# ========================================
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Example:
# DATABASE_URL=postgresql://postgres:MySecurePass123!@db.xyzprojectref.supabase.co:5432/postgres
```

---

## 📋 Step 3: Run Automated Setup Script

I've created an automation script that will:
1. ✅ Test connection to Supabase
2. ✅ Create all database tables
3. ✅ Create indexes
4. ✅ Create functions and triggers
5. ✅ Create admin user
6. ✅ Verify everything works

### 3.1 Install Dependencies

```bash
cd "/Users/brandonin/scal rma dashboard"

# Install required packages
npm install pg bcrypt jsonwebtoken dotenv
```

### 3.2 Run Setup Script

```bash
# Run the automated setup
node scripts/setup-database.js
```

**Expected Output:**
```
🚀 SCal RMA Database Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Connected to Supabase successfully
✓ Created rma_submissions table
✓ Created rma_devices table
✓ Created rma_files table
✓ Created status_history table
✓ Created duplicate_checks table
✓ Created sync_retry_queue table
✓ Created admin_users table
✓ Created indexes (15 indexes)
✓ Created functions (4 functions)
✓ Created triggers (6 triggers)
✓ Created views (4 views)
✓ Created admin user: admin@scalmob.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Setup complete! Your database is ready.

📊 Database Summary:
   • Tables: 7
   • Indexes: 15
   • Views: 4
   • Functions: 4
   • Triggers: 6

🔐 Admin Credentials:
   Email: admin@scalmob.com
   Password: admin123

⚠️  IMPORTANT: Change the admin password immediately!

🌐 View your database:
   https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]

Next steps:
1. Change admin password (see CHANGE_ADMIN_PASSWORD.md)
2. Test the connection: npm run test-db
3. Start the server: npm start
```

---

## 📋 Step 4: Verify Setup in Supabase Dashboard

### 4.1 View Tables

1. Go to Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"Table Editor"** in left sidebar
4. You should see 7 tables:
   - ✅ admin_users
   - ✅ rma_submissions
   - ✅ rma_devices
   - ✅ rma_files
   - ✅ status_history
   - ✅ duplicate_checks
   - ✅ sync_retry_queue

### 4.2 Check Admin User

1. Click on **"admin_users"** table
2. You should see 1 row:
   - Email: `admin@scalmob.com`
   - Full Name: `System Administrator`
   - Role: `admin`

---

## 📋 Step 5: Change Admin Password

### Option A: Use Web Interface (Recommended)

1. We'll build an admin password change form
2. After login, go to Settings → Change Password

### Option B: Use Supabase SQL Editor

1. In Supabase dashboard, click **"SQL Editor"**
2. Click **"New query"**
3. Run this to generate a new password hash:

```javascript
// On your local machine, run:
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_NEW_PASSWORD', 10).then(console.log)"

// Copy the output hash (starts with $2b$10$...)
```

4. In Supabase SQL Editor, run:

```sql
UPDATE admin_users
SET password_hash = '$2b$10$YOUR_HASH_HERE',
    updated_at = NOW()
WHERE email = 'admin@scalmob.com';
```

### Option C: Use Our Script

```bash
# Run password change script
node scripts/change-admin-password.js

# Follow prompts:
# Enter email: admin@scalmob.com
# Enter new password: [your secure password]
# Confirm password: [your secure password]
```

---

## 🔍 Testing Your Setup

### Test 1: Connection Test

```bash
node services/postgres-service.js
```

**Expected:**
```
✓ PostgreSQL connected successfully at: 2024-11-12T...
✓ PostgreSQL service ready
```

### Test 2: Query Test

```bash
# Run test query
node -e "
const db = require('./services/postgres-service');
db.pool.query('SELECT COUNT(*) FROM admin_users').then(r => {
  console.log('Admin users:', r.rows[0].count);
  process.exit(0);
});
"
```

**Expected:**
```
Admin users: 1
```

### Test 3: Full Integration Test

```bash
npm run test-db
```

This will test:
- ✅ Database connection
- ✅ Create test submission
- ✅ Add test devices
- ✅ Check duplicates
- ✅ Approve device
- ✅ Deny device
- ✅ Clean up test data

---

## 📊 Monitoring Your Database

### View in Supabase Dashboard

1. **Database Size**:
   - Settings → Database → Storage
   - Free tier: 500 MB

2. **Active Connections**:
   - Settings → Database → Connection pooling
   - Max: 20 connections (free tier)

3. **Recent Queries**:
   - Logs → Postgres Logs
   - See all queries in real-time

4. **Backups**:
   - Settings → Database → Backups
   - Automatic daily backups (7 days retention)

---

## 🚨 Troubleshooting

### Error: "Connection refused"

```bash
# Check your DATABASE_URL format
echo $DATABASE_URL

# Should be:
# postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:5432/postgres
```

**Fix:**
1. Copy connection string from Supabase dashboard again
2. Make sure you replaced `[YOUR-PASSWORD]` with actual password
3. No spaces or special characters in URL

### Error: "password authentication failed"

**Causes:**
1. Wrong password in DATABASE_URL
2. Special characters not URL-encoded

**Fix:**
1. Get password from Supabase: Settings → Database → Reset Database Password
2. URL-encode special characters:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `&` → `%26`

**Example:**
```bash
# If password is: MyPass@123#
# URL-encoded: MyPass%40123%23

DATABASE_URL=postgresql://postgres:MyPass%40123%23@db.xyz.supabase.co:5432/postgres
```

### Error: "relation does not exist"

**Cause:** Tables not created yet

**Fix:**
```bash
# Run setup script again
node scripts/setup-database.js
```

### Error: "too many connections"

**Cause:** Connection leak in code

**Fix:**
1. Restart your Node.js server
2. Check Supabase dashboard: Settings → Database → Connection pooling
3. Click "Reset connection pool"

---

## 💰 Cost & Limits

### Free Tier Limits

| Resource | Free Tier | Our Usage (10K RMAs/month) | Status |
|----------|-----------|---------------------------|---------|
| **Database Storage** | 500 MB | ~100 MB | ✅ Safe |
| **Bandwidth** | 5 GB/month | ~2 GB/month | ✅ Safe |
| **Active Connections** | 20 max | ~5 active | ✅ Safe |
| **API Requests** | Unlimited | N/A | ✅ Safe |
| **Backups** | 7 days | Automatic | ✅ Included |

### When to Upgrade to Pro ($25/month)

Upgrade when you reach:
- 10 GB database size (after ~100K RMAs)
- 50 GB bandwidth/month (unlikely)
- Need more than 7 days backup retention
- Need priority support

**For now**: Free tier is perfect! ✅

---

## 🔐 Security Best Practices

### 1. Use Environment Variables

✅ Never commit DATABASE_URL to git
✅ Use .env file (already in .gitignore)

### 2. Row Level Security (RLS)

Supabase has RLS enabled by default. We'll configure:
- Admins can see all data
- Customers can only see their own submissions

```sql
-- We'll set this up in admin dashboard later
ALTER TABLE rma_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see all" ON rma_submissions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

### 3. Regular Backups

Supabase free tier includes:
- Automatic daily backups
- 7 days retention
- One-click restore

To manually backup:
```bash
# Export entire database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore if needed
psql $DATABASE_URL < backup-20241112.sql
```

---

## 📚 Additional Resources

### Supabase Documentation
- **Dashboard**: https://supabase.com/dashboard
- **Docs**: https://supabase.com/docs
- **PostgreSQL Guide**: https://supabase.com/docs/guides/database

### Connection String Format
```
postgresql://[user]:[password]@[host]:[port]/[database]

Example:
postgresql://postgres:MyPass123@db.xyzabc.supabase.co:5432/postgres

Parts:
- user: postgres (always postgres for Supabase)
- password: YOUR_PASSWORD (from Step 1.2)
- host: db.[project-ref].supabase.co
- port: 5432 (default PostgreSQL port)
- database: postgres (always postgres for Supabase)
```

### Useful SQL Queries

```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Count records in all tables
SELECT
    'rma_submissions' AS table_name,
    COUNT(*) AS row_count
FROM rma_submissions
UNION ALL
SELECT 'rma_devices', COUNT(*) FROM rma_devices
UNION ALL
SELECT 'rma_files', COUNT(*) FROM rma_files;

-- Recent submissions
SELECT
    reference_number,
    company_name,
    total_devices,
    overall_status,
    submission_date
FROM rma_submissions
ORDER BY submission_date DESC
LIMIT 10;
```

---

## ✅ Setup Checklist

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Saved database password
- [ ] Copied connection string
- [ ] Updated .env with DATABASE_URL
- [ ] Ran `npm install pg bcrypt jsonwebtoken`
- [ ] Ran `node scripts/setup-database.js`
- [ ] Verified tables in Supabase dashboard
- [ ] Tested connection: `node services/postgres-service.js`
- [ ] Changed admin password
- [ ] Tested full integration: `npm run test-db`
- [ ] Bookmarked Supabase dashboard

---

## 🎉 Next Steps

Once Supabase is set up:

1. **Build Admin Dashboard** (admin.html)
   - Login page
   - Pending submissions list
   - Device approval interface
   - Snowflake sync button

2. **Create API Endpoints** (routes/admin-routes.js)
   - POST /api/admin/login
   - GET /api/admin/submissions
   - PATCH /api/admin/devices/:id/approve
   - POST /api/admin/snowflake/sync-now

3. **Update Server** (server.js)
   - Connect customer submissions to PostgreSQL
   - Add admin authentication
   - Integrate Snowflake sync

4. **Test Complete Flow**
   - Submit RMA → Review → Approve → Snowflake

---

**Last Updated**: 2024-11-12
**Estimated Setup Time**: 10 minutes
**Difficulty**: Easy (fully automated)
