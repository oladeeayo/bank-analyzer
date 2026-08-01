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

    // 4. Extract markdown per page (with error handling)
    let markdownResult: any = null;
    try {
      markdownResult = extractPagesMarkdown(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractPagesMarkdown failed:", e);
    }

    // 5. Extract text with positions - only page 0 (with error handling)
    let textWithPositions: any = null;
    try {
      const positions = extractTextWithPositions(buffer, [0]);
      textWithPositions = positions.slice(0, 100); // Limit to 100 items
    } catch (e) {
      console.error("[TestPDFInspector] extractTextWithPositions failed:", e);
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: buffer.length,
      classification,
      processed: {
        pdfType: processed.pdfType,
        markdown: processed.markdown || "",
        processingTimeMs: processed.processingTimeMs,
        isComplexLayout: processed.isComplexLayout,
        pagesWithTables: processed.pagesWithTables,
        pagesWithColumns: processed.pagesWithColumns,
      },
      text: text.substring(0, 5000),
      textLength: text.length,
      markdownPages: markdownResult
        ? {
            pages: markdownResult.pages.map((p: any) => ({
              page: p.page,
              markdown: p.markdown.substring(0, 3000),
              needsOcr: p.needsOcr,
            })),
            pagesWithTables: markdownResult.pagesWithTables,
            pagesWithColumns: markdownResult.pagesWithColumns,
          }
        : null,
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
