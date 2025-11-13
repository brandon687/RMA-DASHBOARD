#!/usr/bin/env node

/**
 * Test Database Connection Script
 * Tests connectivity to Supabase PostgreSQL database
 */

require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
    console.log('\n🔍 Testing Supabase Database Connection...\n');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') || 'NOT SET');
    console.log('');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000,
    });

    try {
        console.log('⏳ Attempting to connect...');
        const client = await pool.connect();
        console.log('✅ Connected to database successfully!\n');

        // Test query
        console.log('⏳ Running test query...');
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✅ Query successful!\n');
        console.log('Current Time:', result.rows[0].current_time);
        console.log('PostgreSQL Version:', result.rows[0].postgres_version.split(' ').slice(0, 2).join(' '));
        console.log('');

        // Check tables
        console.log('⏳ Checking database schema...');
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        console.log('✅ Found', tablesResult.rows.length, 'tables:');
        tablesResult.rows.forEach(row => {
            console.log('   -', row.table_name);
        });
        console.log('');

        // Check submissions count
        const countResult = await client.query('SELECT COUNT(*) as count FROM rma_submissions');
        console.log('📊 Total RMA submissions in database:', countResult.rows[0].count);

        client.release();
        await pool.end();

        console.log('\n✅ Database is fully operational!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Database connection failed!\n');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('');

        if (error.code === 'ENOTFOUND') {
            console.error('📋 ISSUE: Cannot resolve database hostname');
            console.error('');
            console.error('🔧 SOLUTION: Your Supabase project appears to be paused.');
            console.error('');
            console.error('To unpause your Supabase project:');
            console.error('1. Go to: https://supabase.com/dashboard/project/pzkyojrrrvmxasiigrkb');
            console.error('2. Log in to your Supabase account');
            console.error('3. The project will automatically resume when you access it');
            console.error('4. Wait 30-60 seconds for the database to fully wake up');
            console.error('5. Run this script again: node test-database-connection.js');
            console.error('');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('📋 ISSUE: Database is refusing connections');
            console.error('');
            console.error('Possible causes:');
            console.error('- Database is still starting up (wait 30 seconds)');
            console.error('- Firewall blocking connection');
            console.error('- Wrong database host/port in .env');
            console.error('');
        } else if (error.code === '28P01') {
            console.error('📋 ISSUE: Authentication failed');
            console.error('');
            console.error('Check your DATABASE_URL password in .env file');
            console.error('');
        }

        await pool.end();
        process.exit(1);
    }
}

testConnection();
