#!/usr/bin/env node
/**
 * Interactive script to set up Supabase API key
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n' + '='.repeat(80));
console.log('SUPABASE API KEY SETUP');
console.log('='.repeat(80));
console.log('\nTo connect to your Supabase database, we need your API key.');
console.log('\n📋 Steps to get your Supabase anon key:');
console.log('   1. Open: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb/settings/api');
console.log('   2. Find the section "Project API keys"');
console.log('   3. Copy the "anon public" key (starts with "eyJ...")');
console.log('   4. Paste it below');
console.log('\n' + '='.repeat(80) + '\n');

rl.question('Paste your Supabase anon key here: ', async (anonKey) => {
    if (!anonKey || anonKey.trim() === '') {
        console.error('❌ No key provided. Exiting.');
        rl.close();
        process.exit(1);
    }

    anonKey = anonKey.trim();

    // Validate key format (should start with eyJ)
    if (!anonKey.startsWith('eyJ')) {
        console.error('⚠️  Warning: Key doesn\'t start with "eyJ" - are you sure this is correct?');
    }

    // Update .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the placeholder
    envContent = envContent.replace(
        /SUPABASE_ANON_KEY=.*/,
        `SUPABASE_ANON_KEY=${anonKey}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Supabase key saved to .env file!');
    console.log('\n🔄 Testing connection...\n');

    // Test the connection
    process.env.SUPABASE_ANON_KEY = anonKey;
    const db = require('./services/supabase-client');

    try {
        const success = await db.testConnection();
        if (success) {
            console.log('\n' + '='.repeat(80));
            console.log('✅ SUCCESS! Supabase is connected and working!');
            console.log('='.repeat(80));
            console.log('\nNext steps:');
            console.log('  1. Restart your server: Ctrl+C then npm start');
            console.log('  2. Submit a test RMA through localhost:3000');
            console.log('  3. Data will now save to Supabase!');
            console.log('');
        } else {
            console.log('\n❌ Connection test failed. Please check:');
            console.log('  - The API key is correct');
            console.log('  - Your Supabase project is active');
            console.log('  - Tables were created (check SQL Editor)');
        }
    } catch (error) {
        console.error('\n❌ Connection error:', error.message);
    }

    rl.close();
});
