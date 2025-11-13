#!/usr/bin/env node

/**
 * Preview Database Data
 * Shows what the Supabase database will contain once data is migrated
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('\n📊 RMA Data Preview - What will be in Supabase\n');
console.log('='.repeat(60));

// Load submissions
const submissionsFile = path.join(__dirname, 'uploads', 'submissions.json');
const submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));

console.log('\n📁 SUBMISSIONS TABLE');
console.log('='.repeat(60));
console.log(`Total Submissions: ${submissions.length}\n`);

let totalDevices = 0;
let totalFiles = 0;

for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i];
    console.log(`Submission ${i + 1}:`);
    console.log(`  Reference Number: ${sub.referenceNumber}`);
    console.log(`  Company:          ${sub.companyName}`);
    console.log(`  Email:            ${sub.companyEmail}`);
    console.log(`  Order Number:     ${sub.orderNumber}`);
    console.log(`  Quantity:         ${sub.quantity}`);
    console.log(`  Customer Type:    ${sub.customerType}`);
    console.log(`  Submission Date:  ${new Date(sub.timestamp).toLocaleString()}`);
    console.log(`  Files:            ${sub.files.length}`);
    console.log(`  Status:           ${sub.status}`);

    totalFiles += sub.files.length;

    // Try to find and process Excel files
    for (const file of sub.files) {
        if (file.type === 'spreadsheet') {
            const uploadsDir = path.join(__dirname, 'uploads');
            const files = fs.readdirSync(uploadsDir);
            const matchingFile = files.find(f => f.includes(file.name.replace('.xlsx', '')));

            if (matchingFile) {
                const filePath = path.join(uploadsDir, matchingFile);
                try {
                    const workbook = XLSX.readFile(filePath);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const devices = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    console.log(`  Devices Extracted: ${devices.length}`);
                    totalDevices += devices.length;

                    // Show first device as sample
                    if (devices.length > 0) {
                        const firstDevice = devices[0];
                        console.log(`\n  📱 Sample Device from ${file.name}:`);
                        console.log(`     IMEI:               ${firstDevice.imei || firstDevice.IMEI || 'N/A'}`);
                        console.log(`     Model:              ${firstDevice.model || firstDevice['Device Model'] || 'N/A'}`);
                        console.log(`     Storage:            ${firstDevice.storage || 'N/A'}`);
                        console.log(`     Device Status:      ${firstDevice.device_status || firstDevice['Device Status'] || 'N/A'}`);
                        console.log(`     Condition:          ${firstDevice.condition || firstDevice['Condition'] || 'N/A'}`);
                        console.log(`     Issue Description:  ${(firstDevice.issue_description || firstDevice['Issue Description'] || 'N/A').substring(0, 50)}...`);
                        console.log(`     Requested Action:   ${firstDevice.requested_action || firstDevice['Requested Action'] || 'N/A'}`);
                    }
                } catch (error) {
                    console.log(`  ⚠️  Could not read file: ${error.message}`);
                }
            }
        }
    }

    console.log('');
}

console.log('='.repeat(60));
console.log('📊 Summary Statistics');
console.log('='.repeat(60));
console.log(`Total Submissions:     ${submissions.length}`);
console.log(`Total Files:           ${totalFiles}`);
console.log(`Total Devices:         ${totalDevices}`);
console.log(`Avg Devices/Sub:       ${totalDevices > 0 ? (totalDevices / submissions.length).toFixed(1) : 0}`);
console.log('='.repeat(60));

console.log('\n📋 Database Tables That Will Be Populated:');
console.log('');
console.log(`  1. rma_submissions    → ${submissions.length} record(s)`);
console.log(`  2. rma_devices        → ${totalDevices} record(s)`);
console.log(`  3. rma_files          → ${totalFiles} record(s)`);
console.log('');

console.log('🎯 Next Steps:');
console.log('  1. Unpause Supabase: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb');
console.log('  2. Test connection:   node test-database-connection.js');
console.log('  3. Migrate data:      node migrate-local-to-supabase.js');
console.log('');
