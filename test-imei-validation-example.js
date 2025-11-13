/**
 * Example showing how IMEI validation will work with real RMA data
 */

const IMEIValidator = require('./services/imei-validator');

console.log('='.repeat(80));
console.log('IMEI VALIDATION - REAL WORLD EXAMPLES FROM YOUR RMA SUBMISSIONS');
console.log('='.repeat(80));

// Simulate devices from the Excel file we processed earlier
const devicesFromExcel = [
    { 'Return Request Form': 351454482579210, '__EMPTY': 'Apple iPhone 14 128GB Midnight' },
    { 'Return Request Form': 357068940352541, '__EMPTY': 'Apple iPhone 13 128GB Green' },
    { 'Return Request Form': 358469529440690, '__EMPTY': 'Apple iPhone 13 128GB Blue' },
    { 'Return Request Form': '3.51454E+14', '__EMPTY': 'Apple iPhone 13 (Excel scientific notation)' },
    { 'Return Request Form': 12345678901234, '__EMPTY': 'Bad IMEI - too short and wrong start' },
    { 'Return Request Form': 451454482579210, '__EMPTY': 'Bad IMEI - starts with 45 not 35' },
    { 'Return Request Form': null, '__EMPTY': 'Missing IMEI' }
];

console.log('\nProcessing devices from RMA submission...\n');

devicesFromExcel.forEach((device, idx) => {
    const rawIMEI = device['Return Request Form'];
    const model = device.__EMPTY;
    const validation = IMEIValidator.validate(rawIMEI);

    console.log(`Device #${idx + 1}: ${model}`);
    console.log(`  Original IMEI: ${rawIMEI}`);
    console.log(`  Sanitized IMEI: ${validation.sanitized}`);
    console.log(`  Valid: ${validation.isValid ? '✓ YES' : '✗ NO'}`);

    if (validation.errors.length > 0) {
        console.log(`  ❌ Errors: ${validation.errors.join(', ')}`);
        console.log(`  → Status: INFO_REQUESTED (requires admin review)`);
    } else if (validation.warnings.length > 0) {
        console.log(`  ⚠️  Warnings: ${validation.warnings.join(', ')}`);
        console.log(`  → Status: PENDING (review recommended)`);
    } else {
        console.log(`  → Status: PENDING (ready for approval)`);
    }
    console.log('');
});

console.log('='.repeat(80));
console.log('WHAT ADMIN WILL SEE IN DASHBOARD');
console.log('='.repeat(80));

const validDevices = devicesFromExcel.filter(d =>
    IMEIValidator.validate(d['Return Request Form']).isValid
);
const invalidDevices = devicesFromExcel.filter(d =>
    !IMEIValidator.validate(d['Return Request Form']).isValid
);
const warningDevices = devicesFromExcel.filter(d => {
    const v = IMEIValidator.validate(d['Return Request Form']);
    return v.isValid && v.warnings.length > 0;
});

console.log(`\n📊 Submission Summary:`);
console.log(`   Total Devices: ${devicesFromExcel.length}`);
console.log(`   ✓ Valid & Clean: ${validDevices.length - warningDevices.length}`);
console.log(`   ⚠️  Valid but needs review: ${warningDevices.length} (Excel formatting issues)`);
console.log(`   ❌ Invalid (blocked): ${invalidDevices.length}`);

console.log('\n🔴 Devices Requiring Review Before Approval:');
devicesFromExcel.forEach((device, idx) => {
    const validation = IMEIValidator.validate(device['Return Request Form']);
    if (!validation.isValid || validation.warnings.length > 0) {
        console.log(`   • Device #${idx + 1}: ${device.__EMPTY}`);
        console.log(`     IMEI: ${device['Return Request Form']} → ${validation.sanitized}`);
        if (!validation.isValid) {
            console.log(`     Issue: ${validation.errors.join(', ')}`);
        } else {
            console.log(`     Warning: ${validation.warnings.join(', ')}`);
        }
    }
});

console.log('\n✅ Devices Ready for Automatic Approval:');
devicesFromExcel.forEach((device, idx) => {
    const validation = IMEIValidator.validate(device['Return Request Form']);
    if (validation.isValid && validation.warnings.length === 0) {
        console.log(`   • Device #${idx + 1}: ${device.__EMPTY} (IMEI: ${validation.sanitized})`);
    }
});

console.log('\n' + '='.repeat(80));
console.log('This is how your system will intelligently handle IMEI validation!');
console.log('='.repeat(80));
