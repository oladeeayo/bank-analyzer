const { ExactMerchantExtractor } = require('./src/lib/parser/merchant-extractor');

const testCases = [
  "Interswitch/Lead City University Ibadan/6671844006/9 Payment Service Bank (9psb) | statement of result",
  "Olatunji Oyinlola Omolola/0142720946/Gtbank Plc | printing",
  "Oladayo Isaac Oladipupo/8136167673/Opay Digital Services Limited | dee",
  "Cbn//Opay Digital Services Limited | stamp duty on electronic funds transfer - 2003792641",
  "Peter Bamigboye/8030737527/Opay Digital Services Limited | bike",
  "Gyv Commercial Business Services - Gbenga Pos/8247887511/Moniepoint | pos",
  "Toluwalope Odunayo Olasupo/8106699691/Opay Digital Services Limited | dee"
];

console.log("=== Kuda Slash Merchant & Memo Test ===");
testCases.forEach(tc => {
  const payload = ExactMerchantExtractor.process(tc);
  console.log(`Raw: "${tc}"`);
  console.log(` -> Merchant: "${payload.exactMerchantName}"`);
  console.log(` -> Bank/Institution: "${payload.institution}"`);
  console.log(` -> Account/Phone: "${payload.accountOrPhone}"`);
  console.log(` -> Memo: "${payload.memo}"`);
  console.log("-----------------------------------------");
});
