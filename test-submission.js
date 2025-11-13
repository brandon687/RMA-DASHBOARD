const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testSubmission() {
    const form = new FormData();

    form.append('companyName', 'TEST COMPANY');
    form.append('companyEmail', 'test@scal.com');
    form.append('orderNumber', '12345');
    form.append('quantity', '50');
    form.append('customerType', 'us');
    form.append('files', fs.createReadStream('/Users/brandonin/Downloads/RMA_110725_AMERICATECH.xlsx'));

    try {
        const response = await axios.post('http://localhost:3000/api/submit-rma', form, {
            headers: form.getHeaders()
        });

        console.log('✓ SUCCESS:', response.data);
    } catch (error) {
        console.error('✗ ERROR:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testSubmission();
