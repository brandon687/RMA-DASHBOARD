#!/usr/bin/env node

/**
 * Helper script to build your Supabase connection string
 * This helps you format your connection string correctly, especially with special characters
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function urlEncode(str) {
    // URL encode special characters in password
    return encodeURIComponent(str);
}

async function main() {
    console.log('\n🔧 Supabase Connection String Builder\n');
    console.log('This will help you build your DATABASE_URL correctly.\n');

    // Get project reference
    console.log('First, we need your Supabase project reference.');
    console.log('In Supabase dashboard, look at the URL:');
    console.log('https://supabase.com/dashboard/project/YOUR-PROJECT-REF-HERE\n');

    const projectRef = await question('Enter your project reference (the random letters/numbers in the URL): ');

    if (!projectRef || projectRef.length < 10) {
        console.error('\n❌ Project reference seems too short. Please check and try again.');
        process.exit(1);
    }

    // Get password
    console.log('\nNow enter your database password.');
    console.log('Your password: SCaltest6%$#$\n');

    const password = await question('Enter database password (or press Enter to use SCaltest6%$#$): ') || 'SCaltest6%$#$';

    // URL encode the password (important for special characters!)
    const encodedPassword = urlEncode(password);

    // Build connection string
    const connectionString = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

    console.log('\n✅ Your connection string is:\n');
    console.log('─'.repeat(80));
    console.log(connectionString);
    console.log('─'.repeat(80));

    console.log('\n📝 Next steps:\n');
    console.log('1. Copy the connection string above');
    console.log('2. Open your .env file');
    console.log('3. Add this line:\n');
    console.log(`DATABASE_URL=${connectionString}\n`);
    console.log('4. Save the file');
    console.log('5. Run: npm install');
    console.log('6. Run: npm run setup-db\n');

    // Also show the raw password encoding for reference
    console.log('📌 Note: Your password contains special characters.');
    console.log(`   Original: ${password}`);
    console.log(`   Encoded:  ${encodedPassword}`);
    console.log('   (The encoded version is automatically used in the connection string)\n');

    rl.close();
}

main().catch(error => {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
});
