# Run This SQL in Supabase - IMEI Validation Setup

## What This Does
Adds smart IMEI validation to your RMA system:
- Automatically sanitizes IMEIs from Excel formatting issues
- Validates: 15 digits + starts with 35
- Flags invalid IMEIs for admin review
- Prevents auto-approval of devices with bad IMEIs

## Instructions

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/sql/new

2. **Copy and paste this entire SQL block:**

```sql
-- Add IMEI validation tracking columns to rma_devices table

-- Store original IMEI as submitted (before sanitization)
ALTER TABLE rma_devices ADD COLUMN IF NOT EXISTS imei_original VARCHAR(50);

-- Validation status
ALTER TABLE rma_devices ADD COLUMN IF NOT EXISTS imei_valid BOOLEAN DEFAULT true;

-- Validation errors/warnings
ALTER TABLE rma_devices ADD COLUMN IF NOT EXISTS imei_validation_errors TEXT;
ALTER TABLE rma_devices ADD COLUMN IF NOT EXISTS imei_validation_warnings TEXT;

-- Flag for admin review
ALTER TABLE rma_devices ADD COLUMN IF NOT EXISTS requires_imei_review BOOLEAN DEFAULT false;

-- Expand IMEI column to handle edge cases
ALTER TABLE rma_devices ALTER COLUMN imei TYPE VARCHAR(20);

-- Expand model column for full device names
ALTER TABLE rma_devices ALTER COLUMN model TYPE VARCHAR(200);

-- Add comments for documentation
COMMENT ON COLUMN rma_devices.imei IS 'Sanitized IMEI (15 digits, starts with 35)';
COMMENT ON COLUMN rma_devices.imei_original IS 'Original IMEI value as submitted (may have Excel formatting)';
COMMENT ON COLUMN rma_devices.imei_valid IS 'Whether IMEI passes validation (15 digits, starts with 35)';
COMMENT ON COLUMN rma_devices.imei_validation_errors IS 'JSON array of validation errors';
COMMENT ON COLUMN rma_devices.imei_validation_warnings IS 'JSON array of validation warnings';
COMMENT ON COLUMN rma_devices.requires_imei_review IS 'Admin must review this device before approval';
```

3. **Click "RUN" button**

4. **You should see:** "Success. No rows returned"

5. **Verify in Table Editor:**
   - Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/editor
   - Click on `rma_devices` table
   - Check that new columns exist:
     - `imei_original`
     - `imei_valid`
     - `imei_validation_errors`
     - `imei_validation_warnings`
     - `requires_imei_review`

## What Happens Next

Once you run this SQL:

1. **Server will automatically validate all IMEIs** on submission
2. **Invalid IMEIs will be flagged** with status "INFO_REQUESTED"
3. **Admin dashboard will show warnings** for devices needing review
4. **Valid IMEIs** (15 digits, starts with 35) will be auto-marked as "PENDING"

## Examples of What Gets Validated

✅ **Valid IMEIs:**
- 351454482579210 → Valid
- 357068940352541 → Valid
- 350294957046001 → Valid

⚠️ **Excel Formatting Issues (Auto-fixed):**
- 3.51454E+14 → Converted to 351454000000000
- 351454482579210.0 → Cleaned to 351454482579210

❌ **Invalid IMEIs (Flagged for Review):**
- 12345678901234 → Doesn't start with 35
- 451454482579210 → Doesn't start with 35
- 35145448257 → Too short (12 digits)
- Empty/null → Missing IMEI

---

**Ready? Run the SQL above in Supabase, then I'll restart the server and test!**
