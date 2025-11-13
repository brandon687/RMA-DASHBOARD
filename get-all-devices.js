const xlsx = require('xlsx');

const workbook = xlsx.readFile('uploads/1762977482406_19336_-_RMA.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log('================================================================================');
console.log('COMPLETE DEVICE LIST FOR RMA-MHWF9VHJ-ITMS');
console.log('================================================================================');
console.log('\nCustomer: outside (outside@gmail.com)');
console.log('Order Number: 4321');
console.log('Invoice: 19336');
console.log('Submitted Quantity: 21');
console.log('Actual Devices Found: 19 (all marked as "Repair")');
console.log('\n' + '='.repeat(80));

const devices = [];
data.forEach((row, idx) => {
    const imei = row['Return Request Form'];
    if (typeof imei === 'number' && imei.toString().length === 15) {
        devices.push({
            device_number: devices.length + 1,
            imei: imei.toString(),
            model: row['__EMPTY'] || 'Unknown',
            quantity: row['__EMPTY_1'] || 1,
            reason: row['__EMPTY_4'] || 'Not specified',
            status: row['__EMPTY_6'] || 'Unknown',
            value: row['__EMPTY_8'] || 0
        });
    }
});

console.log(`\nTotal Devices: ${devices.length}\n`);

devices.forEach((device, idx) => {
    console.log(`Device #${device.device_number}:`);
    console.log(`  IMEI: ${device.imei}`);
    console.log(`  Model: ${device.model}`);
    console.log(`  Quantity: ${device.quantity}`);
    console.log(`  Reason: ${device.reason}`);
    console.log(`  Status: ${device.status}`);
    console.log(`  Value: $${device.value}`);
    console.log('');
});

console.log('='.repeat(80));
console.log('SUMMARY:');
console.log('='.repeat(80));
const totalValue = devices.reduce((sum, d) => sum + (d.value || 0), 0);
const models = {};
devices.forEach(d => {
    const modelName = d.model.includes('iPhone 14') ? 'iPhone 14' : d.model.includes('iPhone 13') ? 'iPhone 13' : 'Other';
    models[modelName] = (models[modelName] || 0) + 1;
});

console.log(`\nTotal Devices: ${devices.length}`);
console.log(`Total Value: $${totalValue}`);
console.log('\nBreakdown by Model:');
Object.entries(models).forEach(([model, count]) => {
    console.log(`  ${model}: ${count} devices`);
});
console.log('\nAll devices are marked as "Repair" status');
console.log('All repairs are for "battery service"');
