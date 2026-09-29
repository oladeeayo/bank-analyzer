const fs = require('fs');
const path = require('path');
const { parsePDF } = require('./src/lib/parsers/pdf-parser');

async function testEach() {
  const dir = 'C:\\Users\\User\\Desktop\\bank statement';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

  console.log(`Testing ${files.length} PDF files with bank-analyzer parsePDF:`);

  for (const file of files) {
    console.log('\n========================================');
    console.log('Testing PDF:', file);
    const filePath = path.join(dir, file);
    const buffer = fs.readFileSync(filePath);

    try {
      const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const res = await parsePDF(arrayBuf, file);
      console.log('Detected Bank:', res.metadata.detectedBank);
      console.log('Detected Acct Name:', res.metadata.detectedAccountName);
      console.log('Detected Acct No:', res.metadata.detectedAccountNumber);
      console.log('Parsed Rows / Total Rows:', res.metadata.parsedRows, '/', res.metadata.totalRows);
      console.log('Transactions Count:', res.transactions.length);
      console.log('Errors:', res.errors);
      if (res.transactions.length > 0) {
        console.log('Sample Tx 0:', res.transactions[0]);
        console.log('Sample Tx Last:', res.transactions[res.transactions.length - 1]);
      }
    } catch (err) {
      console.error('CRASH / ERROR while parsing', file, ':', err.stack || err);
    }
  }
}

testEach();
