import { NextRequest, NextResponse } from "next/server";
import {
  classifyPdf,
  processPdf,
  extractText,
  extractPagesMarkdown,
} from "@firecrawl/pdf-inspector";
import { cleanupBankText } from "@/lib/utils/text-cleanup";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const classification = classifyPdf(buffer);
    const processed = processPdf(buffer);
    
    // Try extractText first
    let rawText = "";
    try {
      rawText = extractText(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractText failed:", e);
    }
    
    // Get markdown (which has all the data for Kuda)
    let markdownText = "";
    try {
      const markdownResult = extractPagesMarkdown(buffer);
      if (markdownResult?.pages) {
        markdownText = markdownResult.pages.map((p: any) => p.markdown).join("\n\n");
      }
    } catch (e) {
      console.error("[TestPDFInspector] extractPagesMarkdown failed:", e);
    }
    
    // Use the best text source: prefer extractText if it has data, otherwise use markdown
    const bestRawText = (rawText && rawText.length > 100) ? rawText : markdownText;
    
    // Apply comprehensive bank text cleanup
    const text = cleanupBankText(bestRawText);
    
    console.log(`[TestPDFInspector] File: ${file.name}`);
    console.log(`[TestPDFInspector] Pages: ${classification.pageCount}`);
    console.log(`[TestPDFInspector] Raw text length: ${rawText.length}`);
    console.log(`[TestPDFInspector] Markdown text length: ${markdownText.length}`);
    console.log(`[TestPDFInspector] Cleaned text length: ${text.length}`);

    // Count transactions in text (multiple date formats)
    const datePatterns = [
      /\d{2}\/\d{2}\/\d{4}/g,    // DD/MM/YYYY
      /\d{2}\/\d{2}\/\d{2}/g,    // DD/MM/YY
      /\d{2}-[A-Za-z]{3}-\d{4}/g, // DD-Mon-YYYY
      /\d{2}-[A-Za-z]{3}-\d{2}/g, // DD-Mon-YY
    ];
    let textTransactions = 0;
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) textTransactions += matches.length;
    }
    console.log(`[TestPDFInspector] Transactions in text (approx): ${textTransactions}`);

    let markdownResult: any = null;
    try {
      markdownResult = extractPagesMarkdown(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractPagesMarkdown failed:", e);
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: buffer.length,
      classification,
      processed: {
        pdfType: processed.pdfType,
        processingTimeMs: processed.processingTimeMs,
        isComplexLayout: processed.isComplexLayout,
        pagesWithTables: processed.pagesWithTables,
        pagesWithColumns: processed.pagesWithColumns,
      },
      rawText: rawText,
      text: text,
      textLength: text.length,
      textTransactionCount: textTransactions,
      markdownPages: markdownResult
        ? {
            pages: markdownResult.pages.map((p: any) => ({
              page: p.page,
              markdown: p.markdown,
              needsOcr: p.needsOcr,
            })),
            pagesWithTables: markdownResult.pagesWithTables,
            pagesWithColumns: markdownResult.pagesWithColumns,
          }
        : null,
    });
  } catch (error) {
    console.error("[TestPDFInspector] Error:", error);
    return NextResponse.json(
      { error: `Processing failed: ${error}` },
      { status: 500 }
    );
  }
}
