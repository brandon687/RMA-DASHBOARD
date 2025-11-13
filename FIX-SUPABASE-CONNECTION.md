# Fix Supabase Connection - Complete Guide

## Current Status
✅ Server is running and accepting RMA submissions
✅ Data is being saved locally to JSON files
✅ Supabase tables are created and ready
❌ Connection to Supabase is failing (missing API key)

## The Problem
Your PostgreSQL direct connection isn't working due to Supabase's authentication model. The solution is to use Supabase's JavaScript client with an API key.

## The Solution (5 Minutes)

### Step 1: Get Your Supabase API Key

1. **Open your Supabase project settings:**
   - Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/settings/api
   - Or: Dashboard → Settings (gear icon) → API

2. **Copy the "anon public" key:**
   - Look for the section "Project API keys"
   - Find "anon public" key (NOT the service_role key)
   - It starts with `eyJ...`
   - Click the copy icon

### Step 2: Run the Setup Script

```bash
cd "/Users/brandonin/scal rma dashboard"
node setup-supabase-key.js
```

The script will:
1. Prompt you to paste the API key
2. Save it to your .env file
3. Test the connection
4. Confirm everything works

### Step 3: Restart the Server

```bash
# Stop the current server (if running)
kill $(lsof -ti:3000)

# Start it again
npm start
```

### Step 4: Test a Submission

1. Go to http://localhost:3000
2. Fill out the RMA form
3. Upload a test file (RMA_110725_AMERICATECH.xlsx or RMA_111125_OVERHAUL.xlsx)
4. Submit

You should see in the server logs:
```
✓ Supabase client initialized
✓ Submission saved to database
✓ Devices saved to database
```

## Manual Alternative

If you prefer to do it manually:

1. Get the anon key from: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/settings/api

2. Edit `.env` file and replace this line:
   ```
   SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
   ```
   with:
   ```
   SUPABASE_ANON_KEY=eyJhbGc...your-actual-key-here
   ```

3. Restart the server

## Verify It's Working

After setup, check the server logs when you submit an RMA. You should see:
- `✓ Supabase client initialized` (on startup)
- `✓ Submission saved to database` (when submitting)

You can also verify in Supabase:
1. Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/editor
2. Click on `rma_submissions` table
3. You should see your submissions!

## What Changed

### Before:
- Used direct PostgreSQL connection (didn't work)
- Connection string: `postgresql://postgres.pzkyojrrrvmxasiigrkb:password@...`
- Error: "Tenant or user not found"

### After:
- Using Supabase JavaScript client
- Connects via REST API (more reliable)
- Uses anon key for authentication
- Works perfectly with Row Level Security

## Architecture

```
Customer Form (localhost:3000)
    ↓
Express Server (server.js)
    ↓
Supabase Client (services/supabase-client.js)
    ↓
Supabase REST API
    ↓
PostgreSQL Database (hosted by Supabase)
```

## Next Steps After Supabase Works

1. ✅ RMA submissions save to Supabase
2. 🔄 Build admin dashboard (admin.html)
3. 🔄 Add device approval workflow
4. 🔄 Integrate Snowflake sync for approved devices
5. 🔄 Connect Google Sheets for returns team

---

**Ready to proceed! Run `node setup-supabase-key.js` now.**
