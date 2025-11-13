#!/usr/bin/env node

/**
 * Migrate Local Submissions to Supabase
 *
 * This script migrates all locally stored RMA submissions from
 * uploads/submissions.json to the Supabase PostgreSQL database.
 *
 * Run this after unpausing your Supabase project to sync all
 * submissions that were created while the database was offline.
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('./services/postgres-service');

async function migrateLocalSubmissions() {
    console.log('\n📦 RMA Data Migration Tool\n');
    console.log('This will migrate local submissions to Supabase database.\n');

    // Test database connection first
    console.log('⏳ Testing database connection...');
    try {
        await db.testConnection();
        console.log('✅ Database is online and ready\n');
    } catch (error) {
        console.error('❌ Cannot connect to database:', error.message);
        console.error('');
        console.error('Please run: node test-database-connection.js');
        console.error('to troubleshoot the connection issue.\n');
        process.exit(1);
    }

    // Load local submissions
    const submissionsFile = path.join(__dirname, 'uploads', 'submissions.json');
    console.log('⏳ Loading local submissions...');

    let submissions = [];
    try {
        const data = await fs.readFile(submissionsFile, 'utf8');
        submissions = JSON.parse(data);
        console.log(`✅ Found ${submissions.length} local submission(s)\n`);
    } catch (error) {
        console.error('❌ Could not read submissions.json:', error.message);
        console.error('No local data to migrate.\n');
        process.exit(1);
    }

    if (submissions.length === 0) {
        console.log('ℹ️  No submissions to migrate.\n');
        process.exit(0);
    }

    // Check which submissions are already in database
    console.log('⏳ Checking for existing submissions in database...');
    const existingRefs = new Set();
    for (const sub of submissions) {
        try {
            const existing = await db.getSubmissionByReference(sub.referenceNumber);
            if (existing) {
                existingRefs.add(sub.referenceNumber);
            }
        } catch (error) {
            // Submission doesn't exist, which is fine
        }
    }
    console.log(`ℹ️  ${existingRefs.size} submission(s) already exist in database\n`);

    // Migrate each submission
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const submission of submissions) {
        const ref = submission.referenceNumber;

        if (existingRefs.has(ref)) {
            console.log(`⏭️  Skipping ${ref} (already exists)`);
            skippedCount++;
            continue;
        }

        console.log(`\n📝 Migrating ${ref}...`);

        try {
            // Create submission record
            console.log('   ⏳ Creating submission record...');
            const dbSubmission = await db.createSubmission({
                referenceNumber: ref,
                companyName: submission.companyName,
                companyEmail: submission.companyEmail,
                orderNumber: submission.orderNumber,
                customerType: submission.customerType
            });
            console.log('   ✅ Submission created (ID:', dbSubmission.id + ')');

            // If there are file details, try to process them
            // Note: We need the actual files to extract device data
            // This just creates the file records
            if (submission.files && submission.files.length > 0) {
                console.log(`   ⏳ Processing ${submission.files.length} file(s)...`);

                for (const file of submission.files) {
                    // Look for the actual file
                    const uploadsDir = path.join(__dirname, 'uploads');
                    const files = await fs.readdir(uploadsDir);
                    const matchingFile = files.find(f => f.includes(file.name.replace('.xlsx', '')));

                    if (matchingFile) {
                        const filePath = path.join(uploadsDir, matchingFile);

                        // If it's a spreadsheet, extract devices
                        if (file.type === 'spreadsheet') {
                            const XLSX = require('xlsx');
                            const workbook = XLSX.readFile(filePath);
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const devices = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                            console.log(`   ⏳ Saving ${devices.length} device(s)...`);
                            await db.addDevices(ref, devices);
                            console.log('   ✅ Devices saved');
                        }

                        // Create file record
                        await db.addFile({
                            referenceNumber: ref,
                            originalFilename: file.name,
                            fileType: file.type,
                            fileSizeBytes: file.size,
                            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            localPath: filePath,
                            processingStatus: file.status === 'processed' ? 'PROCESSED' : 'FAILED',
                            extractedData: null,
                            devicesExtracted: 0
                        });
                    }
                }
                console.log('   ✅ Files processed');
            }

            console.log(`✅ Successfully migrated ${ref}`);
            migratedCount++;

        } catch (error) {
            console.error(`❌ Error migrating ${ref}:`, error.message);
            errorCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`Total submissions:     ${submissions.length}`);
    console.log(`Migrated:              ${migratedCount}`);
    console.log(`Skipped (existing):    ${skippedCount}`);
    console.log(`Errors:                ${errorCount}`);
    console.log('='.repeat(50));
    console.log('');

    if (migratedCount > 0) {
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('You can verify the data in Supabase:');
        console.log('https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/editor');
        console.log('');
    }

    await db.close();
    process.exit(errorCount > 0 ? 1 : 0);
}

// Run migration
migrateLocalSubmissions().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
});
