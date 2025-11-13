# 🚀 Quick Start Guide - Supabase Setup (10 Minutes)

## What You're Building

A complete RMA pipeline:
```
Customer → Upload Excel → PostgreSQL → Admin Review → Approve/Deny → Snowflake → Google Sheets
```

---

## Step 1: Create Supabase Account (2 minutes)

1. Open: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub (fastest) or email
4. Click **"New Project"**
5. Fill in:
   - Name: `scal-rma-production`
   - Password: Click **"Generate a secure password"**
   - **⚠️ COPY AND SAVE THIS PASSWORD!**
   - Region: `us-west-1` (California)
6. Click **"Create new project"**
7. Wait 2 minutes...

---

## Step 2: Get Connection String (1 minute)

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **Database**
3. Find **"Connection string"** section
4. Copy the **URI** format
5. It looks like this:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xyzabc123.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you saved in Step 1

---

## Step 3: Update .env File (1 minute)

1. Open `/Users/brandonin/scal rma dashboard/.env`
2. Add your connection string:

```bash
# Add this to your .env file:
DATABASE_URL=postgresql://postgres:YourPasswordHere@db.xyzabc123.supabase.co:5432/postgres
```

**Example:**
```bash
DATABASE_URL=postgresql://postgres:Kx7mQ9pL2nR@db.abcdefg.supabase.co:5432/postgres
```

---

## Step 4: Install Dependencies (2 minutes)

```bash
cd "/Users/brandonin/scal rma dashboard"

# Install all required packages
npm install

# This will install:
# - pg (PostgreSQL client)
# - bcrypt (password hashing)
# - jsonwebtoken (authentication)
# - express-rate-limit (security)
```

**Expected output:**
```
added 50 packages, and audited 250 packages in 15s
```

---

## Step 5: Run Automated Setup (2 minutes)

```bash
npm run setup-db
```

**This script will automatically:**
- ✅ Connect to Supabase
- ✅ Create 7 tables
- ✅ Create 15 indexes
- ✅ Create 4 functions
- ✅ Create 6 triggers
- ✅ Create 4 views
- ✅ Create admin user (admin@scalmob.com / admin123)

**Expected output:**
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
✓ Created 15 indexes
✓ Created function: update_modified_column
✓ Created function: update_submission_counts
✓ Created function: log_status_change
✓ Created function: check_duplicate_imei
✓ Created trigger: update_submissions_modtime
✓ Created trigger: update_devices_modtime
✓ Created trigger: update_retry_queue_modtime
✓ Created trigger: update_admin_users_modtime
✓ Created trigger: update_counts_on_device_change
✓ Created trigger: log_device_status_change
✓ Created view: v_pending_reviews
✓ Created view: v_devices_pending_review
✓ Created view: v_failed_syncs
✓ Created view: v_admin_dashboard
✓ All tables verified
✓ Admin user verified

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

Next steps:
1. Change admin password
2. Test connection: npm run test-db
3. Start server: npm start
```

---

## Step 6: Verify in Supabase Dashboard (1 minute)

1. Go back to Supabase dashboard
2. Click **"Table Editor"** in left sidebar
3. You should see 7 tables:

![Tables](https://i.imgur.com/example.png)

- ✅ admin_users
- ✅ rma_submissions
- ✅ rma_devices
- ✅ rma_files
- ✅ status_history
- ✅ duplicate_checks
- ✅ sync_retry_queue

4. Click **"admin_users"** table
5. You should see 1 row with email: `admin@scalmob.com`

---

## Step 7: Change Admin Password (1 minute)

```bash
npm run change-password
```

**Follow prompts:**
```
🔐 Change Admin Password

Enter admin email (default: admin@scalmob.com): [press Enter]
✓ Found user: System Administrator

Enter new password: YourSecurePassword123!
Confirm new password: YourSecurePassword123!

⏳ Hashing password...
✅ Password changed successfully!
```

---

## Step 8: Test Connection (30 seconds)

```bash
npm run test-db
```

**Expected output:**
```
✓ PostgreSQL connected successfully at: 2024-11-12T18:30:45.123Z

✓ PostgreSQL service ready
```

**If you see errors**, check:
- DATABASE_URL is correct in .env
- Password has no special characters (or they're URL-encoded)
- Supabase project is active (check dashboard)

---

## ✅ You're Done!

Your database is now ready. Here's what you have:

### 🗄️ Database Structure

| Table | Purpose | Status |
|-------|---------|--------|
| `rma_submissions` | Customer submissions | ✅ Ready |
| `rma_devices` | Individual devices | ✅ Ready |
| `rma_files` | Uploaded files | ✅ Ready |
| `status_history` | Audit trail | ✅ Ready |
| `duplicate_checks` | IMEI tracking | ✅ Ready |
| `sync_retry_queue` | Failed syncs | ✅ Ready |
| `admin_users` | Admin accounts | ✅ 1 user |

### 🔐 Admin Access

- **Email**: `admin@scalmob.com`
- **Password**: (the one you just set)
- **Dashboard**: Coming next!

### 📊 Monitor Your Database

View your data in Supabase:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor"
4. Browse tables and data

---

## What's Next?

Now that your database is ready, we need to build:

### 1. Admin Dashboard UI ✨
A web interface where you can:
- View pending RMA submissions
- See device lists with details
- Approve or deny individual devices
- Sync approved devices to Snowflake

### 2. Admin API Endpoints 🔌
Backend routes for:
- Login/authentication
- Get submissions list
- Approve/deny devices
- Sync to Snowflake

### 3. Update Customer Portal 📱
Connect the existing form to PostgreSQL instead of JSON files

### 4. Snowflake Integration ❄️
Activate the Snowflake connector to push approved devices

---

## Common Issues & Fixes

### Issue: "Connection refused"

**Fix:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Should start with: postgresql://postgres:...
# If not, update your .env file
```

### Issue: "password authentication failed"

**Fix:**
1. Go to Supabase: Settings → Database
2. Click "Reset Database Password"
3. Generate new password
4. Update DATABASE_URL in .env with new password

### Issue: "relation does not exist"

**Fix:**
```bash
# Run setup again
npm run setup-db
```

### Issue: Special characters in password

If your password has special characters, URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `&` | `%26` |
| `%` | `%25` |

**Example:**
```bash
# Password: MyPass@123#
# Encoded: MyPass%40123%23

DATABASE_URL=postgresql://postgres:MyPass%40123%23@db.xyz.supabase.co:5432/postgres
```

---

## View Your Data

### Option 1: Supabase Dashboard
1. https://supabase.com/dashboard
2. Click "Table Editor"
3. Browse tables visually

### Option 2: SQL Editor
1. In Supabase, click "SQL Editor"
2. Run queries:

```sql
-- See all admin users
SELECT * FROM admin_users;

-- Count records
SELECT
    'Submissions' AS table_name,
    COUNT(*) AS count
FROM rma_submissions
UNION ALL
SELECT 'Devices', COUNT(*) FROM rma_devices;

-- Dashboard summary
SELECT * FROM v_admin_dashboard;
```

### Option 3: Command Line
```bash
# Connect with psql (if installed)
psql $DATABASE_URL

# Run queries
SELECT * FROM admin_users;
```

---

## Free Tier Limits

Your Supabase free tier includes:

| Resource | Limit | Your Usage |
|----------|-------|------------|
| Database Storage | 500 MB | ~0 MB |
| Bandwidth | 5 GB/month | Minimal |
| Connections | 20 max | ~5 active |
| Backups | 7 days | Automatic |

**You're well within limits!** ✅

---

## Need Help?

1. **Check logs**: `npm start` shows all errors
2. **Test connection**: `npm run test-db`
3. **View Supabase logs**: Dashboard → Logs → Postgres Logs
4. **Read full guide**: `SUPABASE_SETUP.md`

---

## 🎉 Congratulations!

You now have:
- ✅ Supabase PostgreSQL database
- ✅ Complete schema with 7 tables
- ✅ Automatic triggers and functions
- ✅ Admin user account
- ✅ Secure password set
- ✅ Connection tested and verified

**Total time**: ~10 minutes
**Cost**: $0 (free tier)
**Status**: Ready for admin dashboard!

---

**Next Step**: Build the admin dashboard interface

Want me to continue building the admin UI now? Say "yes" or "continue"!
