import { NextRequest, NextResponse } from "next/server";
import {
  classifyPdf,
  processPdf,
  extractText,
  extractPagesMarkdown,
  extractTextWithPositions,
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

    // 1. Classify the PDF
    const classification = classifyPdf(buffer);

    // 2. Process full PDF (returns markdown + classification)
    const processed = processPdf(buffer);

    // 3. Extract plain text
    const text = extractText(buffer);

    // 4. Extract markdown per page
    const markdownResult = extractPagesMarkdown(buffer);

    // 5. Extract text with positions (first 3 pages for brevity)
    let textWithPositions: any[] = [];
    try {
      const pagesToProcess = Array.from(
        { length: Math.min(classification.pageCount, 3) },
        (_, i) => i
      );
      const positions = extractTextWithPositions(buffer, pagesToProcess);
      // Group by page
      const byPage: Record<number, any[]> = {};
      for (const item of positions) {
        if (!byPage[item.page]) byPage[item.page] = [];
        byPage[item.page].push(item);
      }
      textWithPositions = Object.entries(byPage).map(([page, items]) => ({
        page: parseInt(page),
        itemCount: items.length,
        items: items.slice(0, 50), // First 50 items per page
      }));
    } catch (e) {
      textWithPositions = [{ error: `Position extraction failed: ${e}` }];
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: buffer.length,
      classification,
      processed: {
        pdfType: processed.pdfType,
        markdownLength: processed.markdown?.length || 0,
        processingTimeMs: processed.processingTimeMs,
        isComplexLayout: processed.isComplexLayout,
        pagesWithTables: processed.pagesWithTables,
        pagesWithColumns: processed.pagesWithColumns,
      },
      text: text.substring(0, 5000),
      textLength: text.length,
      markdown: {
        pages: markdownResult.pages.map((p) => ({
          page: p.page,
          markdown: p.markdown.substring(0, 2000),
          needsOcr: p.needsOcr,
        })),
        pagesWithTables: markdownResult.pagesWithTables,
        pagesWithColumns: markdownResult.pagesWithColumns,
        isComplex: markdownResult.isComplex,
      },
      textWithPositions,
    });
  } catch (error) {
    console.error("[TestPDFInspector] Error:", error);
    return NextResponse.json(
      { error: `Processing failed: ${error}` },
      { status: 500 }
    );
  }
}
