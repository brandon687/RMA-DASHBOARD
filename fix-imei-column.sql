-- Fix IMEI column to allow longer values (some IMEIs may have formatting)
ALTER TABLE rma_devices ALTER COLUMN imei TYPE VARCHAR(20);

-- Also make model column longer for full device names
ALTER TABLE rma_devices ALTER COLUMN model TYPE VARCHAR(200);
