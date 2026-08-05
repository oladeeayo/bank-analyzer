const { ExactMerchantExtractor } = require('./src/lib/parser/merchant-extractor');

const testCases = [
  "OLADEJI ISAIAH OLADIPUPO - Inward Transfer",
  "SportyBet - Outward Transfer",
  "FoodCo Supermarket - Card Purchase",
  "Mobile Data | 08136167673 | MTN | 6GB Weekly Plan",
  "Inward Transfer from TEMITOPEMARY AYEOYENKAN",
  "Transfer to IKEOLUWA UNIQUE ENTERPRISE",
  "IKEJA ELECTRIC - Bill Payment"
];

console.log("=== Merchant Extraction Test Results ===");
testCases.forEach(input => {
  const result = ExactMerchantExtractor.process(input);
  console.log(`Input: "${input}"`);
  console.log(` -> Exact Merchant: "${result.exactMerchantName}" (Key: ${result.normalizedKey}, Channel: ${result.channelTag})`);
  console.log("---");
});
