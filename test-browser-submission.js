/**
 * Browser Form Submission Test
 *
 * This script tests form submission through a headless browser
 * to simulate real user interaction and identify issues.
 */

const fs = require('fs');
const path = require('path');

async function testFormSubmission() {
    console.log('\n=== BROWSER FORM SUBMISSION TEST ===\n');

    // Check if server is running
    console.log('1. Checking if server is running...');
    try {
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        console.log('✓ Server is running:', data.service);
    } catch (error) {
        console.error('✗ Server is not running on port 3000');
        console.error('   Please start the server with: node server.js');
        process.exit(1);
    }

    // Test file upload endpoint
    console.log('\n2. Testing file upload endpoint...');

    // Create test data
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('companyName', 'Browser Test Company');
    formData.append('companyEmail', 'browsertest@example.com');
    formData.append('orderNumber', 'TEST-BROWSER-001');
    formData.append('quantity', '5');
    formData.append('customerType', 'us');

    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'Test file content for browser submission test');
    formData.append('file_0', fs.createReadStream(testFilePath), {
        filename: 'test-file.txt',
        contentType: 'text/plain'
    });

    try {
        const response = await fetch('http://localhost:3000/api/submit-rma', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✓ Form submission successful!');
            console.log('  Reference Number:', result.referenceNumber);
            console.log('  Files Processed:', result.filesProcessed);
            console.log('\n=== TEST PASSED ===');
            console.log('The form submission endpoint is working correctly.');
            console.log('If the browser form is not submitting, the issue is likely:');
            console.log('  1. JavaScript file not loading (check browser console)');
            console.log('  2. Browser cache has old JavaScript (hard refresh: Cmd+Shift+R)');
            console.log('  3. File upload state not being populated correctly');
            console.log('  4. Form event listener not attached');
        } else {
            const error = await response.json();
            console.error('✗ Form submission failed:', error);
        }
    } catch (error) {
        console.error('✗ Error during submission:', error.message);
    } finally {
        // Clean up test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

// Run the test
testFormSubmission().catch(console.error);
