const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('uploads/1762977482406_19336_-_RMA.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log('='.repeat(80));
console.log('RMA SUBMISSION DETAILS: RMA-MHWF9VHJ-ITMS');
console.log('='.repeat(80));
console.log('\nCUSTOMER INFORMATION:');
console.log('  Company Name: outside');
console.log('  Email: outside@gmail.com');
console.log('  Order Number: 4321');
console.log('  Quantity: 21');
console.log('  Customer Type: US');
console.log('  File: 19336 - RMA.xlsx');
console.log('  Submitted: 2025-11-12T19:58:02.407Z');

console.log('\n' + '='.repeat(80));
console.log('EXTRACTED DEVICE DATA FROM EXCEL:');
console.log('='.repeat(80));
console.log(`\nTotal Rows in Excel: ${data.length}`);

// Try to identify device columns
const firstRow = data[0] || {};
const columns = Object.keys(firstRow);
console.log('\nDetected Columns:', columns);

// Look for IMEI/device data
console.log('\n--- First 5 Rows ---');
data.slice(0, 5).forEach((row, idx) => {
    console.log(`\nRow ${idx + 1}:`);
    console.log(JSON.stringify(row, null, 2));
});

// Try to find device information
console.log('\n' + '='.repeat(80));
console.log('DEVICE EXTRACTION ANALYSIS:');
console.log('='.repeat(80));

// Look for IMEI patterns
const devices = [];
data.forEach((row, idx) => {
    const rowStr = JSON.stringify(row);
    // Check if row contains numeric data that might be IMEI (15 digits)
    const potentialIMEI = Object.values(row).find(val =>
        typeof val === 'number' && val.toString().length === 15
    );
    if (potentialIMEI) {
        devices.push({
            rowIndex: idx + 1,
            data: row
        });
    }
});

if (devices.length > 0) {
    console.log(`\nFound ${devices.length} potential device rows with IMEI data:`);
    devices.slice(0, 10).forEach(device => {
        console.log(`\nDevice at Row ${device.rowIndex}:`);
        console.log(JSON.stringify(device.data, null, 2));
    });
} else {
    console.log('\nNo clear IMEI patterns found. Showing all data rows:');
    console.log(`\nTotal data rows: ${data.length}`);
}
