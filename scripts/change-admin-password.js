#!/usr/bin/env node

/**
 * Admin Password Change Script
 * Simple utility to change admin password
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('\n🔐 Change Admin Password\n');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in .env file');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Get email
        const email = await question('Enter admin email (default: admin@scalmob.com): ') || 'admin@scalmob.com';

        // Check if user exists
        const checkResult = await pool.query(
            'SELECT id, full_name FROM admin_users WHERE email = $1',
            [email]
        );

        if (checkResult.rows.length === 0) {
            console.error(`❌ Admin user ${email} not found`);
            process.exit(1);
        }

        console.log(`✓ Found user: ${checkResult.rows[0].full_name}`);

        // Get new password (with hidden input)
        process.stdout.write('\nEnter new password: ');
        const newPassword = await question('');

        if (newPassword.length < 8) {
            console.error('\n❌ Password must be at least 8 characters');
            process.exit(1);
        }

        process.stdout.write('Confirm new password: ');
        const confirmPassword = await question('');

        if (newPassword !== confirmPassword) {
            console.error('\n❌ Passwords do not match');
            process.exit(1);
        }

        // Hash new password
        console.log('\n⏳ Hashing password...');
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query(
            'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
            [passwordHash, email]
        );

        console.log('✅ Password changed successfully!\n');

        await pool.end();
        rl.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        rl.close();
        process.exit(1);
    }
}

main();
