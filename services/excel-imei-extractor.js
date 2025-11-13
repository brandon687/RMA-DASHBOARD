/**
 * Excel IMEI Extractor
 *
 * Extracts IMEIs from Excel files while preserving the FULL original value
 * Excel corrupts long numbers by converting to scientific notation (3.57069E+14)
 * This extractor reads the raw cell data BEFORE Excel's number formatting
 */

const XLSX = require('xlsx');

class ExcelIMEIExtractor {
    /**
     * Read Excel file and extract IMEIs with raw cell data preservation
     */
    static extractFromFile(filePath) {
        // Read workbook with cellText option to preserve original formatting
        const workbook = XLSX.readFile(filePath, {
            cellText: false,
            cellNF: true,
            cellFormula: false,
            raw: true  // Get raw values before Excel formatting
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        return this.extractFromWorksheet(worksheet);
    }

    /**
     * Extract IMEIs from worksheet, preserving raw cell values
     */
    static extractFromWorksheet(worksheet) {
        const devices = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // Iterate through rows
        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
            const device = this.extractDeviceFromRow(worksheet, rowNum, range.e.c);
            if (device && device.imei) {
                devices.push(device);
            }
        }

        return devices;
    }

    /**
     * Extract device data from a single row
     * Columns: IMEI | Model | Storage | Grade | Issue | Issue Category | Repair/Return | Unit Price | Repair Cost
     */
    static extractDeviceFromRow(worksheet, rowNum, maxCol) {
        const device = {};

        for (let colNum = 0; colNum <= maxCol; colNum++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
            const cell = worksheet[cellAddress];

            if (!cell) continue;

            // Get the RAW cell value (before Excel formatting)
            const rawValue = this.getRawCellValue(cell);

            // Map columns to database fields
            switch(colNum) {
                case 0: // IMEI
                    if (this.looksLikeIMEI(rawValue)) {
                        device.imei = this.extractIMEI(cell, rawValue);
                        device.imei_raw = rawValue;
                        device.imei_cell_type = cell.t;
                    }
                    break;
                case 1: // Model
                    device.model = rawValue;
                    break;
                case 2: // Storage
                    device.storage = rawValue;
                    break;
                case 3: // Grade/Condition
                    device.condition = rawValue;
                    break;
                case 4: // Issue
                    device.issue_description = rawValue;
                    break;
                case 5: // Issue Category
                    device.issue_category = rawValue;
                    break;
                case 6: // Repair/Return
                    device.requested_action = rawValue;
                    break;
                case 7: // Unit Price
                    device.unit_price = rawValue;
                    break;
                case 8: // Repair Cost
                    device.repair_cost = rawValue;
                    break;
            }
        }

        return device;
    }

    /**
     * Get raw cell value before Excel formatting
     */
    static getRawCellValue(cell) {
        if (!cell) return null;

        // Cell types:
        // 's' = string
        // 'n' = number
        // 'b' = boolean
        // 'e' = error

        // If cell has raw value (w = formatted text), use it
        if (cell.w) return cell.w;

        // Otherwise use the value
        if (cell.v !== undefined) return cell.v;

        return null;
    }

    /**
     * Extract IMEI from cell, handling Excel's number formatting
     */
    static extractIMEI(cell, rawValue) {
        // If cell is stored as string, use it directly
        if (cell.t === 's') {
            return this.cleanIMEI(String(rawValue));
        }

        // If cell is stored as number
        if (cell.t === 'n') {
            // Check if the cell has a format that indicates it should be text
            // Format code 49 = '@' (text format)
            if (cell.z === '@') {
                return this.cleanIMEI(String(rawValue));
            }

            // For numbers, we need to handle scientific notation
            // Excel stores: 357069040352541 as 3.57069040352541E+14
            // The 'w' field contains the formatted display value
            if (cell.w) {
                // If formatted value is in scientific notation
                if (cell.w.includes('E') || cell.w.includes('e')) {
                    return this.convertScientificNotation(cell.w, cell.v);
                }
                return this.cleanIMEI(cell.w);
            }

            // Use the raw numeric value
            return this.cleanIMEI(String(cell.v));
        }

        return this.cleanIMEI(String(rawValue));
    }

    /**
     * Convert scientific notation to full IMEI
     * Excel corrupts: 357069040352541 → 3.57069E+14
     * We need to recover the full number
     */
    static convertScientificNotation(formattedValue, numericValue) {
        // If we have the full numeric value without precision loss, use it
        const fullNumber = String(numericValue);

        // Remove decimal point
        const withoutDecimal = fullNumber.replace('.', '');

        // Ensure it's 15 digits
        if (withoutDecimal.length === 15 && withoutDecimal.startsWith('35')) {
            return withoutDecimal;
        }

        // If precision was lost, we need to warn
        // This happens when Excel converts: 357069040352541 → 357069000000000
        console.warn(`⚠️  Precision loss detected in IMEI: ${formattedValue} → ${fullNumber}`);
        console.warn(`    Original IMEI may have been corrupted by Excel`);

        return this.cleanIMEI(fullNumber);
    }

    /**
     * Clean IMEI string
     */
    static cleanIMEI(value) {
        if (!value) return null;

        // Convert to string and remove non-digits
        let cleaned = String(value).replace(/[^0-9]/g, '');

        // Pad with zeros if too short (Excel might have dropped leading zeros)
        if (cleaned.length < 15 && cleaned.length >= 13) {
            console.warn(`⚠️  Short IMEI detected: ${cleaned} (padding to 15 digits)`);
            cleaned = cleaned.padStart(15, '0');
        }

        return cleaned;
    }

    /**
     * Check if value looks like an IMEI
     */
    static looksLikeIMEI(value) {
        if (!value) return false;

        const str = String(value);

        // Check for 15-digit number
        const digitsOnly = str.replace(/[^0-9]/g, '');
        if (digitsOnly.length === 15 && digitsOnly.startsWith('35')) {
            return true;
        }

        // Check for scientific notation that might be IMEI
        if ((str.includes('E') || str.includes('e')) && str.startsWith('3.5')) {
            return true;
        }

        // Check for number that's around 15 digits
        if (!isNaN(value) && String(Math.floor(value)).length >= 14) {
            return true;
        }

        return false;
    }

    /**
     * Analyze Excel file for IMEI issues
     */
    static analyzeFile(filePath) {
        const workbook = XLSX.readFile(filePath, { cellText: false, cellNF: true, raw: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        const analysis = {
            totalRows: range.e.r - range.s.r + 1,
            imeiCells: [],
            scientificNotation: 0,
            textFormat: 0,
            numberFormat: 0,
            precisionLoss: 0
        };

        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: 0 });
            const cell = worksheet[cellAddress];

            if (!cell) continue;

            const rawValue = this.getRawCellValue(cell);
            if (this.looksLikeIMEI(rawValue)) {
                const cellInfo = {
                    row: rowNum + 1,
                    type: cell.t,
                    raw: rawValue,
                    formatted: cell.w,
                    value: cell.v
                };

                if (cell.t === 's') {
                    analysis.textFormat++;
                } else if (cell.t === 'n') {
                    analysis.numberFormat++;
                    if (cell.w && (cell.w.includes('E') || cell.w.includes('e'))) {
                        analysis.scientificNotation++;

                        // Check for precision loss
                        const fullNumber = String(cell.v).replace('.', '');
                        if (fullNumber.includes('00000')) {
                            analysis.precisionLoss++;
                            cellInfo.precisionLoss = true;
                        }
                    }
                }

                analysis.imeiCells.push(cellInfo);
            }
        }

        return analysis;
    }
}

module.exports = ExcelIMEIExtractor;

// Test if run directly
if (require.main === module) {
    const filePath = process.argv[2];

    if (!filePath) {
        console.log('Usage: node excel-imei-extractor.js <path-to-excel-file>');
        process.exit(1);
    }

    console.log('='.repeat(80));
    console.log('EXCEL IMEI EXTRACTOR - ANALYSIS');
    console.log('='.repeat(80));
    console.log(`\nFile: ${filePath}\n`);

    const analysis = ExcelIMEIExtractor.analyzeFile(filePath);

    console.log('Summary:');
    console.log(`  Total Rows: ${analysis.totalRows}`);
    console.log(`  IMEI Cells Found: ${analysis.imeiCells.length}`);
    console.log(`  Text Format: ${analysis.textFormat}`);
    console.log(`  Number Format: ${analysis.numberFormat}`);
    console.log(`  Scientific Notation: ${analysis.scientificNotation}`);
    console.log(`  Precision Loss: ${analysis.precisionLoss}`);

    if (analysis.precisionLoss > 0) {
        console.log('\n⚠️  WARNING: Excel has corrupted some IMEIs due to precision loss!');
        console.log('   Recommendation: Re-save Excel file with IMEI column formatted as TEXT');
    }

    console.log('\n' + '='.repeat(80));
    console.log('EXTRACTING DEVICES');
    console.log('='.repeat(80) + '\n');

    const devices = ExcelIMEIExtractor.extractFromFile(filePath);

    devices.slice(0, 5).forEach((device, idx) => {
        console.log(`Device #${idx + 1}:`);
        console.log(`  IMEI: ${device.imei}`);
        console.log(`  Model: ${device.model}`);
        console.log(`  Cell Type: ${device.imei_cell_type}`);
        console.log(`  Raw Value: ${device.imei_raw}`);
        console.log('');
    });

    console.log(`Total devices extracted: ${devices.length}`);
}
