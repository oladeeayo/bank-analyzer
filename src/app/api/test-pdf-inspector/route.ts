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
    
    // Try multiple extraction methods
    let rawText = "";
    try {
      rawText = extractText(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractText failed:", e);
    }
    
    // If extractText returns empty, try using the markdown and strip formatting
    if (!rawText || rawText.trim().length === 0) {
      console.log("[TestPDFInspector] extractText empty, using markdown as fallback");
      rawText = processed.markdown || "";
    }
    
    // Apply comprehensive bank text cleanup
    const text = cleanupBankText(rawText);
    
    console.log(`[TestPDFInspector] Raw text length: ${rawText.length}`);
    console.log(`[TestPDFInspector] Cleaned text length: ${text.length}`);

    let markdownResult: any = null;
    try {
      markdownResult = extractPagesMarkdown(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractPagesMarkdown failed:", e);
    }

    // Log extraction stats
    console.log(`[TestPDFInspector] File: ${file.name}`);
    console.log(`[TestPDFInspector] Pages: ${classification.pageCount}`);
    console.log(`[TestPDFInspector] Full text length: ${text.length}`);
    console.log(`[TestPDFInspector] Markdown pages: ${markdownResult?.pages?.length || 0}`);
    
    if (markdownResult?.pages) {
      markdownResult.pages.forEach((p: any) => {
        console.log(`[TestPDFInspector] Page ${p.page}: ${p.markdown.length} chars, ${p.markdown.split('\n').length} lines`);
      });
    }

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
      rawText: rawText, // Full raw text for debugging
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
