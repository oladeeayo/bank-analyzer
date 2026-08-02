import { NextRequest, NextResponse } from "next/server";
import {
  classifyPdf,
  processPdf,
  extractText,
  extractPagesMarkdown,
  extractTextWithPositions,
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
    
    // If extractText returns empty, try using the markdown
    if (!rawText || rawText.trim().length === 0) {
      console.log("[TestPDFInspector] extractText empty, using markdown as fallback");
      rawText = processed.markdown || "";
    }
    
    // Also try textWithPositions for better reconstruction
    let textWithPositions: any[] = [];
    let reconstructedText = "";
    try {
      const allPages = Array.from({ length: classification.pageCount }, (_, i) => i);
      textWithPositions = extractTextWithPositions(buffer, allPages);
      
      // Reconstruct text from positions: sort by Y then X
      reconstructedText = reconstructFromPositions(textWithPositions);
    } catch (e) {
      console.error("[TestPDFInspector] extractTextWithPositions failed:", e);
    }
    
    // Use the best text source: try reconstructed first, then raw, then markdown
    const bestRawText = reconstructedText.length > 100 ? reconstructedText : rawText;
    
    // Apply comprehensive bank text cleanup
    const text = cleanupBankText(bestRawText);
    
    console.log(`[TestPDFInspector] File: ${file.name}`);
    console.log(`[TestPDFInspector] Pages: ${classification.pageCount}`);
    console.log(`[TestPDFInspector] Raw text length: ${rawText.length}`);
    console.log(`[TestPDFInspector] Reconstructed text length: ${reconstructedText.length}`);
    console.log(`[TestPDFInspector] Cleaned text length: ${text.length}`);

    let markdownResult: any = null;
    try {
      markdownResult = extractPagesMarkdown(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractPagesMarkdown failed:", e);
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
      rawText: rawText,
      reconstructedText: reconstructedText,
      text: text,
      textLength: text.length,
      textTransactionCount: textTransactions,
      positionsCount: textWithPositions.length,
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

/**
 * Reconstruct text from position data by sorting Y then X coordinates.
 * This handles character-level PDFs like Kuda better.
 */
function reconstructFromPositions(positions: any[]): string {
  if (!positions || positions.length === 0) return "";

  // Group by page
  const byPage = new Map<number, any[]>();
  for (const item of positions) {
    const page = item.page || 0;
    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page)!.push(item);
  }

  const lines: string[] = [];

  for (const [page, items] of byPage) {
    // Sort by Y (top to bottom), then X (left to right)
    const sorted = items.sort((a, b) => {
      const yDiff = (a.y || 0) - (b.y || 0);
      if (Math.abs(yDiff) > 3) return yDiff; // Different lines (3px threshold)
      return (a.x || 0) - (b.x || 0); // Same line, sort by X
    });

    let currentY = -1000;
    let lineParts: string[] = [];

    for (const item of sorted) {
      const y = item.y || 0;
      
      // If Y changed significantly, it's a new line
      if (Math.abs(y - currentY) > 3) {
        if (lineParts.length > 0) {
          lines.push(lineParts.join(""));
        }
        lineParts = [];
        currentY = y;
      }
      
      const text = item.text || "";
      if (text.trim()) {
        lineParts.push(text);
      }
    }
    
    // Don't forget the last line
    if (lineParts.length > 0) {
      lines.push(lineParts.join(""));
    }
  }

  return lines.join("\n");
}
