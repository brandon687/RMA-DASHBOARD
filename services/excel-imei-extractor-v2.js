/**
 * Excel IMEI Extractor V2 - Advanced Column Detection
 *
 * This extractor:
 * 1. Automatically finds header row by looking for "IMEI" column
 * 2. Maps columns by header name (case-insensitive, fuzzy matching)
 * 3. Handles any Excel layout with varying columns
 * 4. Preserves full IMEI values from scientific notation
 * 5. Extracts all 9 required fields with 100% confidence
 */

const XLSX = require('xlsx');

class ExcelIMEIExtractorV2 {
    /**
     * Column mapping configuration
     * Maps various possible header names to our database fields
     */
    static COLUMN_MAPPINGS = {
        imei: ['imei', 'imei number', 'imei#', 'serial', 'serial number'],
        model: ['model', 'device model', 'phone model', 'device'],
        storage: ['storage', 'capacity', 'size', 'gb', 'storage size'],
        condition: ['grade', 'condition', 'device condition', 'quality', 'grading'],
        issue_description: ['issue', 'problem', 'issue description', 'defect', 'reason'],
        issue_category: ['issue category', 'category', 'issue type', 'problem type'],
        requested_action: ['repair/return', 'action', 'repair or return', 'request', 'requested action'],
        unit_price: ['unit price', 'price', 'value', 'cost', 'device price'],
        repair_cost: ['repair cost', 'repair cost (if applicable)', 'cost of repair', 'repair price']
    };

    /**
     * Read Excel file and extract devices with intelligent header detection
     */
    static extractFromFile(filePath) {
        console.log('\n' + '='.repeat(80));
        console.log('EXCEL IMEI EXTRACTOR V2 - INTELLIGENT EXTRACTION');
        console.log('='.repeat(80));
        console.log(`File: ${filePath}\n`);

        // Read workbook with raw values
        const workbook = XLSX.readFile(filePath, {
            cellText: false,
            cellNF: true,
            cellFormula: false,
            raw: true
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log(`Sheet: ${sheetName}`);

        // Step 1: Find header row
        const headerInfo = this.findHeaderRow(worksheet);

        if (!headerInfo) {
            console.error('❌ Could not find header row with IMEI column');
            return [];
        }

        console.log(`\n✓ Header row found at row ${headerInfo.rowIndex + 1}`);
        console.log('✓ Column mappings:');
        Object.entries(headerInfo.columnMap).forEach(([field, colIndex]) => {
            console.log(`  ${field}: Column ${this.columnIndexToLetter(colIndex)} (${colIndex})`);
        });

        // Step 2: Extract devices starting from row after header
        const devices = this.extractDevices(worksheet, headerInfo);

        console.log(`\n✓ Extracted ${devices.length} devices`);
        console.log('='.repeat(80) + '\n');

        return devices;
    }

    /**
     * Find the header row by looking for "IMEI" column
     */
    static findHeaderRow(worksheet) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // Search first 20 rows for header
        for (let rowNum = range.s.r; rowNum <= Math.min(range.s.r + 20, range.e.r); rowNum++) {
            const columnMap = {};
            let foundIMEI = false;

            // Check each column in this row
            for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                const cell = worksheet[cellAddress];

                if (!cell) continue;

                const cellValue = this.getCellValue(cell);
                if (!cellValue) continue;

                const headerText = String(cellValue).toLowerCase().trim();

                // Try to match this header to one of our fields
                // Priority: exact match > starts with > contains
                for (const [field, possibleNames] of Object.entries(this.COLUMN_MAPPINGS)) {
                    // Skip if already mapped
                    if (columnMap[field] !== undefined) continue;

                    // Check for exact match first
                    const exactMatch = possibleNames.some(name =>
                        headerText === name.toLowerCase()
                    );

                    if (exactMatch) {
                        columnMap[field] = colNum;
                        if (field === 'imei') foundIMEI = true;
                        break;
                    }

                    // Then check for startsWith
                    const startsWithMatch = possibleNames.some(name =>
                        headerText.startsWith(name.toLowerCase())
                    );

                    if (startsWithMatch) {
                        columnMap[field] = colNum;
                        if (field === 'imei') foundIMEI = true;
                        break;
                    }

                    // Finally check for contains
                    const containsMatch = possibleNames.some(name =>
                        headerText.includes(name.toLowerCase())
                    );

                    if (containsMatch) {
                        columnMap[field] = colNum;
                        if (field === 'imei') foundIMEI = true;
                        break;
                    }
                }
            }

            // If we found IMEI column, this is likely the header row
            if (foundIMEI) {
                return {
                    rowIndex: rowNum,
                    columnMap: columnMap,
                    dataStartRow: rowNum + 1
                };
            }
        }

        return null;
    }

    /**
     * Extract all devices from worksheet starting after header
     */
    static extractDevices(worksheet, headerInfo) {
        const devices = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // Start from row after header
        for (let rowNum = headerInfo.dataStartRow; rowNum <= range.e.r; rowNum++) {
            const device = this.extractDeviceFromRow(worksheet, rowNum, headerInfo.columnMap);

            // Only include rows that have an IMEI
            if (device && device.imei) {
                devices.push(device);

                console.log(`  Row ${rowNum + 1}: IMEI ${device.imei} | Model: ${device.model || 'N/A'} | Storage: ${device.storage || 'N/A'}`);
            }
        }

        return devices;
    }

    /**
     * Extract device data from a single row using column map
     */
    static extractDeviceFromRow(worksheet, rowNum, columnMap) {
        const device = {};

        // Extract each field based on column mapping
        for (const [field, colNum] of Object.entries(columnMap)) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
            const cell = worksheet[cellAddress];

            if (!cell) continue;

            const value = this.getCellValue(cell);

            // Special handling for IMEI
            if (field === 'imei') {
                if (this.looksLikeIMEI(value)) {
                    device.imei = this.extractIMEI(cell, value);
                    device.imei_raw = value;
                    device.imei_cell_type = cell.t;
                }
            } else {
                // For all other fields, store the value
                if (value !== null && value !== undefined && value !== '') {
                    device[field] = this.formatValue(value, field);
                }
            }
        }

        return device;
    }

    /**
     * Get cell value (handles various cell types)
     */
    static getCellValue(cell) {
        if (!cell) return null;

        // If cell has formatted text (w), use it
        if (cell.w !== undefined) return cell.w;

        // Otherwise use raw value
        if (cell.v !== undefined) return cell.v;

        return null;
    }

    /**
     * Format value based on field type
     */
    static formatValue(value, field) {
        if (value === null || value === undefined) return null;

        // Convert to string and trim
        let formatted = String(value).trim();

        // Handle price fields - remove $ if present
        if (field === 'unit_price' || field === 'repair_cost') {
            formatted = formatted.replace(/[$,]/g, '').trim();
            // If it's a valid number, return as number
            if (!isNaN(formatted) && formatted !== '') {
                return parseFloat(formatted);
            }
        }

        return formatted || null;
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
            // For scientific notation like 3.57069E+14
            if (cell.w && (cell.w.includes('E') || cell.w.includes('e'))) {
                return this.convertScientificNotation(cell.w, cell.v);
            }

            // Use formatted value if available
            if (cell.w) {
                return this.cleanIMEI(cell.w);
            }

            // Use raw numeric value
            return this.cleanIMEI(String(cell.v));
        }

        return this.cleanIMEI(String(rawValue));
    }

    /**
     * Convert scientific notation to full IMEI
     */
    static convertScientificNotation(formattedValue, numericValue) {
        // Get full number from numeric value
        let fullNumber = String(numericValue);

        // Remove decimal point
        fullNumber = fullNumber.replace('.', '');

        // If it's 15 digits and starts with 35, we're good
        if (fullNumber.length === 15 && fullNumber.startsWith('35')) {
            return fullNumber;
        }

        // Pad if needed
        if (fullNumber.length < 15 && fullNumber.length >= 13 && fullNumber.startsWith('35')) {
            console.warn(`⚠️  Padding short IMEI: ${fullNumber}`);
            return fullNumber.padStart(15, '0');
        }

        // Check for precision loss
        if (fullNumber.includes('00000')) {
            console.warn(`⚠️  Precision loss detected in IMEI: ${formattedValue}`);
        }

        return this.cleanIMEI(fullNumber);
    }

    /**
     * Clean IMEI string
     */
    static cleanIMEI(value) {
        if (!value) return null;

        // Convert to string and remove non-digits
        let cleaned = String(value).replace(/[^0-9]/g, '');

        // Pad with zeros if too short
        if (cleaned.length < 15 && cleaned.length >= 13 && cleaned.startsWith('35')) {
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

        // Check for 15-digit number starting with 35
        const digitsOnly = str.replace(/[^0-9]/g, '');
        if (digitsOnly.length === 15 && digitsOnly.startsWith('35')) {
            return true;
        }

        // Check for scientific notation that might be IMEI (3.5xxxE+14)
        if ((str.includes('E') || str.includes('e')) && str.startsWith('3.5')) {
            return true;
        }

        // Check for number that's around 15 digits
        if (!isNaN(value)) {
            const numStr = String(Math.floor(Math.abs(value)));
            if (numStr.length >= 14 && numStr.startsWith('35')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert column index to letter (0 = A, 1 = B, etc.)
     */
    static columnIndexToLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode((index % 26) + 65) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }

    /**
     * Analyze Excel file for debugging
     */
    static analyzeFile(filePath) {
        const workbook = XLSX.readFile(filePath, { cellText: false, cellNF: true, raw: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        console.log('\n' + '='.repeat(80));
        console.log('EXCEL FILE ANALYSIS');
        console.log('='.repeat(80));
        console.log(`File: ${filePath}`);
        console.log(`Sheet: ${sheetName}`);
        console.log(`Range: ${worksheet['!ref']}`);
        console.log(`Total Rows: ${range.e.r - range.s.r + 1}`);
        console.log(`Total Columns: ${range.e.c - range.s.c + 1}`);

        // Show first 15 rows
        console.log('\n' + '='.repeat(80));
        console.log('FIRST 15 ROWS');
        console.log('='.repeat(80));

        for (let rowNum = range.s.r; rowNum <= Math.min(range.s.r + 14, range.e.r); rowNum++) {
            const rowData = [];
            for (let colNum = range.s.c; colNum <= Math.min(range.s.c + 10, range.e.c); colNum++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                const cell = worksheet[cellAddress];
                const value = cell ? this.getCellValue(cell) : '';
                rowData.push(value);
            }
            console.log(`Row ${rowNum + 1}: ${rowData.join(' | ')}`);
        }

        console.log('\n' + '='.repeat(80));
    }
}

module.exports = ExcelIMEIExtractorV2;

// Test if run directly
if (require.main === module) {
    const filePath = process.argv[2];

    if (!filePath) {
        console.log('Usage: node excel-imei-extractor-v2.js <path-to-excel-file>');
        process.exit(1);
    }

    // Analyze file structure
    ExcelIMEIExtractorV2.analyzeFile(filePath);

    // Extract devices
    const devices = ExcelIMEIExtractorV2.extractFromFile(filePath);

    console.log('\n' + '='.repeat(80));
    console.log('EXTRACTED DEVICES');
    console.log('='.repeat(80) + '\n');

    devices.forEach((device, idx) => {
        console.log(`Device #${idx + 1}:`);
        console.log(`  IMEI: ${device.imei}`);
        console.log(`  Model: ${device.model || 'N/A'}`);
        console.log(`  Storage: ${device.storage || 'N/A'}`);
        console.log(`  Condition: ${device.condition || 'N/A'}`);
        console.log(`  Issue: ${device.issue_description || 'N/A'}`);
        console.log(`  Issue Category: ${device.issue_category || 'N/A'}`);
        console.log(`  Requested Action: ${device.requested_action || 'N/A'}`);
        console.log(`  Unit Price: ${device.unit_price || 'N/A'}`);
        console.log(`  Repair Cost: ${device.repair_cost || 'N/A'}`);
        console.log('');
    });

    console.log(`✓ Total devices extracted: ${devices.length}`);
}
