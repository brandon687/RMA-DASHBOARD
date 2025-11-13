# SCAL MOBILE RMA - GOOGLE SHEETS INTEGRATION SETUP

## 🎯 OVERVIEW

This Google Apps Script automatically syncs RMA data from Supabase to Google Sheets, allowing return specialists to verify devices and push verification data back to Supabase.

**Google Sheet:** [WRMA-WEB-SUBMISSIONS](https://docs.google.com/spreadsheets/d/1Jvftddb-080chp8WSnrYzZCQGoR2xKble9Z4YM3M72o/edit?gid=0#gid=0)
**Sheet Tab Name:** `SUPABASE-IMPORT`

---

## 📋 SETUP STEPS

### Step 1: Open Your Google Sheet

1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1Jvftddb-080chp8WSnrYzZCQGoR2xKble9Z4YM3M72o/edit
2. Make sure you have a tab named **`SUPABASE-IMPORT`** (this is the sheet where data will sync)
3. If the tab doesn't exist, create it: Click the `+` button at the bottom to add a new sheet and rename it to `SUPABASE-IMPORT`

### Step 2: Open Apps Script Editor

1. In your Google Sheet, go to **Extensions → Apps Script**
2. This will open the Apps Script editor in a new tab
3. You should see a file named `Code.gs` (or `myFunction` placeholder)

### Step 3: Paste the Script

1. **Delete any existing code** in the `Code.gs` file
2. **Copy the ENTIRE contents** of the `Code.gs` file I created (see below)
3. **Paste it** into the Apps Script editor
4. Click **💾 Save** (or press `Ctrl+S` / `Cmd+S`)
5. Name the project: `SCAL RMA Supabase Sync`

### Step 4: Authorize the Script

1. Click **▶️ Run** button at the top
2. Select function: `syncFromSupabase`
3. Click **Run**
4. You'll see a permission dialog:
   - Click **Review Permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to SCAL RMA Supabase Sync (unsafe)**
   - Click **Allow**
5. The script will now have permission to:
   - Access your Google Sheets
   - Make external HTTP requests to Supabase
   - Create time-driven triggers

### Step 5: Test Manual Sync

1. Go back to your Google Sheet
2. Refresh the page (this loads the custom menu)
3. You should now see a new menu: **🔄 RMA Sync**
4. Click **🔄 RMA Sync → 🔽 Pull from Supabase**
5. Wait 5-10 seconds
6. The `SUPABASE-IMPORT` tab should now populate with data from Supabase!

### Step 6: Enable Auto-Sync

1. Click **🔄 RMA Sync → ⚙️ Setup Auto-Sync (1min pull / 5min push)**
2. You'll see a confirmation toast notification
3. The script will now:
   - **Pull from Supabase every 1 minute** (refresh data)
   - **Push to Supabase every 5 minutes** (sync verifications)

---

## 📊 SHEET COLUMNS EXPLAINED

The `SUPABASE-IMPORT` tab will have these columns:

| Column | Description | Editable? |
|--------|-------------|-----------|
| Device ID | Internal database ID | ❌ No |
| Ref # | RMA reference number (e.g., RMA-MHWJ5AFD-JAII) | ❌ No |
| Company Name | Customer company name | ❌ No |
| Company Email | Customer email | ❌ No |
| Order # | Sales order number | ❌ No |
| Customer Type | US or INTERNATIONAL | ❌ No |
| IMEI | Device IMEI (sanitized) | ❌ No |
| IMEI Original | Original IMEI from Excel | ❌ No |
| IMEI Valid? | Yes/No - IMEI validation status | ❌ No |
| Model | Device model (e.g., 13 PRO) | ❌ No |
| Storage | Storage capacity (e.g., 128GB) | ❌ No |
| Customer Condition | Condition stated by customer | ❌ No |
| Customer Issue | Issue stated by customer | ❌ No |
| Issue Category | Category of issue | ❌ No |
| Action Requested | RETURN or REPAIR | ❌ No |
| Unit Price | Price of device | ❌ No |
| Repair Cost | Cost to repair | ❌ No |
| Approval Status | PENDING/APPROVED/DENIED | ❌ No |
| Needs Review? | Yes if IMEI needs admin review | ❌ No |
| ✅ Issue Matches? | **VERIFY: Does received device match stated issue?** | ✅ YES (checkbox) |
| Actual Condition | **VERIFY: Actual condition of received device** | ✅ YES (dropdown) |
| Verification Notes | **VERIFY: Add any notes about the device** | ✅ YES (free text) |
| Verified By | **VERIFY: Your name** | ✅ YES (your name) |
| Verified At | Timestamp when verification was synced | ❌ No (auto-filled) |
| Submission Date | When customer submitted RMA | ❌ No |
| Created At | When device was added to database | ❌ No |
| Overall Status | Submission status | ❌ No |

---

## 👥 RETURN SPECIALIST WORKFLOW

### How to Verify Devices:

1. **Open the Google Sheet** (it auto-refreshes every 1 minute)
2. **Find unverified devices** (rows without "Verified By" filled in)
3. **Physical inspection:** Compare received device with customer's stated issue
4. **Fill in verification columns:**
   - ✅ **Issue Matches?**: Check "Yes" if customer's issue is accurate, leave blank or "No" if not
   - 🎨 **Actual Condition**: Select from dropdown (A Grade, B Grade, C Grade, D Grade, Damaged, DOA, Not As Described)
   - 📝 **Verification Notes**: Add any observations (e.g., "Screen has scratches not mentioned", "Battery health 85%")
   - 👤 **Verified By**: Type your name
5. **Save** (Google Sheets auto-saves)
6. **Data syncs to Supabase automatically every 5 minutes** (or click "🔼 Push to Supabase" for immediate sync)
7. **Verified rows turn GREEN** after successful sync to Supabase

### Tips:
- Rows that need IMEI review are highlighted in **light orange**
- Verified rows turn **light green** after syncing
- Failed syncs turn **light red** (contact admin if this happens)
- Use filters/sorting to organize your work

---

## 🔄 SYNC BEHAVIOR

### Pull from Supabase (Every 1 Minute):
- Fetches all RMA devices with submission info
- Updates the `SUPABASE-IMPORT` tab
- Preserves your edits (only updates from Supabase, doesn't overwrite pending changes)

### Push to Supabase (Every 5 Minutes):
- Scans for rows with "Verified By" filled in
- Pushes verification data back to Supabase
- Marks synced rows with green background
- Admin dashboard immediately sees verification status

---

## 🛠️ MENU OPTIONS

**🔄 RMA Sync Menu:**

- **🔽 Pull from Supabase** - Manually refresh data from Supabase (instant)
- **🔼 Push to Supabase** - Manually push verifications to Supabase (instant)
- **⚙️ Setup Auto-Sync** - Enable automatic syncing (1min pull / 5min push)
- **🗑️ Remove Auto-Sync** - Disable automatic syncing
- **📊 View Sync Status** - Show last sync time and trigger status

---

## 🐛 TROUBLESHOOTING

### Data Not Showing Up?

1. Check that sheet tab is named **exactly** `SUPABASE-IMPORT` (case-sensitive)
2. Click **🔄 RMA Sync → 🔽 Pull from Supabase** to manually refresh
3. Check Apps Script logs:
   - Go to **Extensions → Apps Script**
   - Click **Executions** (left sidebar)
   - Look for errors in recent runs

### Verification Not Syncing to Supabase?

1. Make sure **all 4 fields** are filled for the device:
   - ✅ Issue Matches?
   - Actual Condition
   - Verification Notes (can be empty but cell should exist)
   - **Verified By** (REQUIRED - this triggers the sync)
2. Click **🔄 RMA Sync → 🔼 Push to Supabase** to manually push
3. Check for red background (indicates sync error)

### Auto-Sync Not Working?

1. Click **🔄 RMA Sync → 📊 View Sync Status**
2. Check "Active Triggers" count (should be 2)
3. If 0, click **⚙️ Setup Auto-Sync** again
4. Check that you authorized the script (Step 4 above)

### Permission Errors?

1. Go to **Extensions → Apps Script → Executions**
2. Look for authorization errors
3. Re-run authorization (Step 4)
4. Make sure you clicked "Allow" for all permissions

---

## 📞 SUPPORT

**Issues or Questions?**
- Check Apps Script execution logs: **Extensions → Apps Script → Executions**
- Contact: Brandon (brandon@scal.com)
- Admin Dashboard: http://127.0.0.1:3000/admin.html (shows verification status)

---

## 🔒 SECURITY NOTES

- The Supabase API key is read-only (anon key)
- Script only updates verification fields (cannot delete or modify RMA submissions)
- All changes are logged in Supabase with timestamps
- Google Apps Script runs with your Google account permissions
- Data is transmitted over HTTPS (encrypted)

---

## ✅ READY TO USE!

Your Google Sheet is now connected to Supabase and will automatically sync RMA data for verification.

**Next Steps:**
1. ✅ Test manual sync
2. ✅ Enable auto-sync
3. ✅ Train return specialists on verification workflow
4. ✅ Monitor admin dashboard for verification status
