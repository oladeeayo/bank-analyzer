import { NextRequest, NextResponse } from "next/server";
import {
  classifyPdf,
  processPdf,
  extractText,
  extractPagesMarkdown,
} from "@firecrawl/pdf-inspector";

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
    const text = extractText(buffer);

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

    // Count transactions in text (rough count by date pattern)
    const textTransactions = (text.match(/\d{2}\/\d{2}\/\d{4}/g) || []).length;
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
