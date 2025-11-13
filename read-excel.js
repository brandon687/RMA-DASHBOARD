const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/brandonin/Downloads/RMA_110725_AMERICATECH.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log('Total rows:', data.length);
console.log('\nFirst 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
console.log('\nColumn names:', Object.keys(data[0] || {}));
