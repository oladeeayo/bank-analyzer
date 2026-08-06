import { ExactMerchantExtractor } from "./src/lib/parser/merchant-extractor";
import { evaluateContextRules } from "./src/lib/classifier/nigerian-context";

function runTest() {
  const user = {
    fullName: "OLADAYO ISAAC OLADIPUPO",
    surname: "OLADIPUPO",
  };

  const testCases = [
    {
      desc: "outward transfer Toluwalope Odunayo Olasupo/8106699691/Opay Digital Services Limited",
      memo: "dee",
      amount: 5000,
    },
    {
      desc: "Gyv Commercial Business Services - Gbenga Pos/8247887511/Moniepoint",
      memo: "pos",
      amount: 5100,
    },
    {
      desc: "bills 500mb for 1 day purchase",
      memo: "500mb for 1 day purchase",
      amount: 350,
    },
    {
      desc: "outward transfer Cbn//Opay Digital Services Limited",
      memo: "stamp duty on electronic funds transfer - 2003792641",
      amount: 50,
    },
    {
      desc: "outward transfer Oladayo Isaac Oladipupo/8136167673/Opay Digital Services Limited",
      memo: "dee",
      amount: 10000,
    },
    {
      desc: "outward transfer Interswitch/Lead City University Ibadan/6671844006/9 Payment Service Bank (9psb)",
      memo: "statement of result",
      amount: 1300,
    },
    {
      desc: "outward transfer Olatunji Oyinlola Omolola/0142720946/Gtbank Plc",
      memo: "printing",
      amount: 100,
    },
    {
      desc: "outward transfer Peter Bamigboye/8030737527/Opay Digital Services Limited",
      memo: "bike",
      amount: 300,
    },
    {
      desc: "loan charges",
      memo: "smart overdraft interest application",
      amount: 3413.24,
    },
  ];

  console.log("=== MERCHANT EXTRACTION & CONTEXT TEST ===");
  for (const tc of testCases) {
    const ext = ExactMerchantExtractor.process(tc.desc);
    const fullText = `${tc.desc} ${tc.memo}`;
    const ctx = evaluateContextRules(fullText, tc.amount, false, user);

    console.log(`\nInput: "${tc.desc}" [Memo: "${tc.memo}"]`);
    console.log(`  -> Exact Merchant Name: "${ext.exactMerchantName}"`);
    console.log(`  -> Channel Tag: ${ext.channelTag}`);
    console.log(`  -> Institution: ${ext.institution}`);
    console.log(`  -> Account/Phone: ${ext.accountOrPhone}`);
    if (ctx) {
      console.log(`  -> Context Category: ${ctx.categoryName} (${ctx.subCategoryName || "N/A"}) [Confidence: ${ctx.confidence}]`);
    } else {
      console.log(`  -> Context Category: None (drops to keyword/merchant match)`);
    }
  }
}

runTest();
