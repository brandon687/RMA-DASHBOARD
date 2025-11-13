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
