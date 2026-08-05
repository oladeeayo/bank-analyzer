import { parseKudaFromMarkdown } from "./src/lib/parsers/kuda-pdf-parser";
import { parseCSV } from "./src/lib/parsers/csv-parser";

async function testParsers() {
  console.log("=== Testing Kuda Markdown Parser with 4-digit years ===");
  const testKudaMarkdown = `
Date/Time | Money In | Money Out | To / From | Description | Balance
28/07/2026 11:47:40 | | ₦15,000.00 | Lead City University | Tuition fee | ₦250,000.00
02/02/2026 14:50:32 | ₦50,000.00 | | John Doe | Salary | ₦300,000.00
15/01/26 09:12:00 | | ₦2,500.00 | MTN Data | Data plan | ₦297,500.00
`;

  const result = parseKudaFromMarkdown(testKudaMarkdown, "test_kuda.pdf");
  console.log(`Parsed ${result.transactions.length} transactions:`);
  for (const tx of result.transactions) {
    console.log(`- ${tx.date} | ${tx.description} | ₦${tx.amount} (${tx.type})`);
  }

  if (result.transactions.length !== 3) {
    console.error("FAIL: Expected 3 transactions!");
    process.exit(1);
  }

  console.log("\n=== Testing CSV Parser ===");
  const testCSV = `Date,Description,Amount,Type\n2026-07-28,"Lead City University",15000,debit\n2026-07-29,"John Doe",50000,credit`;
  const csvResult = parseCSV(testCSV, "test.csv");
  console.log(`Parsed ${csvResult.transactions.length} CSV transactions.`);
  if (csvResult.transactions.length !== 2) {
    console.error("FAIL: Expected 2 CSV transactions!");
    process.exit(1);
  }

  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
}

testParsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
