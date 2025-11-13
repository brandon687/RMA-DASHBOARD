# Supabase Database - Data Preview

## What Will Be in Your Supabase Database

Once you unpause your Supabase project and run the migration, here's exactly what data will appear in your tables:

---

## 📊 Table: rma_submissions

| id | reference_number | company_name | company_email | order_number | customer_type | submission_date | total_devices | overall_status |
|----|------------------|--------------|---------------|--------------|---------------|-----------------|---------------|----------------|
| 1 | RMA-MHWEMV0G-70FO | BRAND | BRAN@SCAL.COM | 1234 | us | 2025-11-12 19:40:08 | 24 | SUBMITTED |
| 2 | RMA-MHWEQJ87-F8BJ | TESTCOMPANY | test@test.com | 9999 | us | 2025-11-12 19:43:00 | 24 | SUBMITTED |

**Total Records**: 2

---

## 📱 Table: rma_devices

### Submission: RMA-MHWEMV0G-70FO (24 devices)

Sample devices extracted from `test_rma.xlsx`:

| device_id | imei | model | storage | device_status | issue_description | action_type | unit_price | approval_status |
|-----------|------|-------|---------|---------------|-------------------|-------------|------------|-----------------|
| 1 | 354047773241800 | 15 PRO MAX | 256GB | AB GRADE | C GRADE SCRATCHED SCREEN | RETURN | 595.00 | PENDING |
| 2 | 350278023088808 | 15 PRO MAX | 256GB | AB GRADE | BACK CAMERA LENS BROKEN | RETURN | 595.00 | PENDING |
| 3 | 354773164170528 | 15 PRO MAX | 256GB | AB GRADE | C GRADE SCRATCHED SCREEN | RETURN | 595.00 | PENDING |
| 4 | 354379777385204 | 15 PRO MAX | 256GB | AB GRADE | VOLUMEN UP BUTTON DEFECTIVE | RETURN | 595.00 | PENDING |
| 5 | 359711533623095 | 15 PRO MAX | 256GB | AB GRADE | C GRADE SCRATCHED SCREEN AND FRAME | RETURN | 595.00 | PENDING |
| 6 | 355706420189527 | 16 PRO MAX | 256GB | AB GRADE | C GRADE SCRATCHED SCREEN | RETURN | 810.00 | PENDING |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

### Submission: RMA-MHWEQJ87-F8BJ (24 devices)

Same device structure from `RMA_110725_AMERICATECH.xlsx`

**Total Device Records**: 48 devices across 2 submissions

---

## 📄 Table: rma_files

| file_id | submission_id | original_filename | file_type | file_size_bytes | processing_status | devices_extracted | uploaded_at |
|---------|---------------|-------------------|-----------|-----------------|-------------------|-------------------|-------------|
| 1 | 1 | test_rma.xlsx | spreadsheet | 21,477 | PROCESSED | 24 | 2025-11-12 19:40:08 |
| 2 | 2 | RMA_110725_AMERICATECH.xlsx | spreadsheet | 21,477 | PROCESSED | 24 | 2025-11-12 19:43:00 |

**Total File Records**: 2

---

## 🔍 Query Examples

Once data is in Supabase, you can run these SQL queries:

### Get all submissions with device counts
```sql
SELECT
    reference_number,
    company_name,
    company_email,
    total_devices,
    pending_count,
    approved_count,
    denied_count,
    overall_status,
    submission_date
FROM rma_submissions
ORDER BY submission_date DESC;
```

### Get all pending devices for review
```sql
SELECT
    d.imei,
    d.model,
    d.storage,
    d.device_status,
    d.issue_description,
    d.action_type,
    d.unit_price,
    s.reference_number,
    s.company_name
FROM rma_devices d
JOIN rma_submissions s ON s.id = d.submission_id
WHERE d.approval_status = 'PENDING'
ORDER BY d.created_at ASC;
```

### Get submission details with all devices
```sql
SELECT
    s.reference_number,
    s.company_name,
    s.company_email,
    s.order_number,
    COUNT(d.id) as device_count,
    SUM(d.unit_price) as total_value
FROM rma_submissions s
LEFT JOIN rma_devices d ON d.submission_id = s.id
WHERE s.reference_number = 'RMA-MHWEMV0G-70FO'
GROUP BY s.id;
```

---

## 📈 Dashboard Metrics

Once migrated, your admin dashboard view (`v_admin_dashboard`) will show:

```
┌──────────────────────────────────────────────────────┐
│ RMA Admin Dashboard                                  │
├──────────────────────────────────────────────────────┤
│ Pending Reviews:           48                        │
│ Approved Today:            0                         │
│ Denied Today:              0                         │
│ Failed Syncs:              0                         │
│ Avg Review Time:           N/A                       │
│ Duplicates This Week:      0                         │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Data Integrity

All data includes:

✅ **Referential Integrity**: All foreign keys properly linked
✅ **Timestamps**: Automatic created_at and updated_at
✅ **Audit Trail**: status_history table tracks all changes
✅ **Duplicate Detection**: IMEI duplicate checking enabled
✅ **Device Extraction**: 100% of devices extracted from Excel
✅ **File Metadata**: All uploaded files tracked

---

## 🚀 Access Your Data

### Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb
2. Click "Table Editor" in sidebar
3. Select table: `rma_submissions`, `rma_devices`, or `rma_files`
4. View, filter, and export data

### Via SQL Editor
1. Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/sql
2. Write custom queries
3. Execute and export results

### Via API
```javascript
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Get all submissions
const { data } = await supabase
  .from('rma_submissions')
  .select('*')
  .order('submission_date', { ascending: false })
```

---

## 📝 Next Steps After Migration

1. **Review Devices**: Use the admin portal to approve/deny devices
2. **Check for Duplicates**: System will flag duplicate IMEIs
3. **Sync to Snowflake**: Approved devices can be synced to Snowflake
4. **Generate Reports**: Export data for analysis
5. **Monitor Status**: Track approval workflow progress

---

## ⚠️ Important Notes

- All 48 devices will start with `approval_status = 'PENDING'`
- No data will be synced to Snowflake until devices are approved
- The system maintains a complete audit trail of all status changes
- Duplicate IMEI detection is automatic but can be overridden by admins

---

**Data Ready For Migration**: Yes ✅
**Migration Script**: `migrate-local-to-supabase.js`
**Test Script**: `test-database-connection.js`
**Preview Script**: `preview-database-data.js`
