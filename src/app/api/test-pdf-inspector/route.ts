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

interface TextToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

function reconstructFromPositions(positions: TextToken[]): string {
  if (!positions || positions.length === 0) return "";

  const pages = [...new Set(positions.map((t) => t.page))];

  let fullText = "";

  for (const page of pages) {
    const pageTokens = positions
      .filter((t) => t.page === page)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (pageTokens.length === 0) continue;

    const lines: TextToken[][] = [];
    let currentLine: TextToken[] = [pageTokens[0]];
    let lastY = pageTokens[0].y;
    const Y_THRESHOLD = 5;

    for (let i = 1; i < pageTokens.length; i++) {
      const token = pageTokens[i];
      if (Math.abs(token.y - lastY) <= Y_THRESHOLD) {
        currentLine.push(token);
      } else {
        lines.push(currentLine);
        currentLine = [token];
        lastY = token.y;
      }
    }
    lines.push(currentLine);

    const lineTexts = lines.map((line) => {
      line.sort((a, b) => a.x - b.x);

      const words: string[] = [];
      let currentWord = line[0];

      for (let i = 1; i < line.length; i++) {
        const gap = line[i].x - (currentWord.x + currentWord.width);
        if (gap > 8) {
          words.push(currentWord.text);
          currentWord = line[i];
        } else {
          currentWord = {
            ...currentWord,
            text: currentWord.text + line[i].text,
            width:
              line[i].x + line[i].width - currentWord.x,
          };
        }
      }
      words.push(currentWord.text);

      return words.join(" ");
    });

    fullText += lineTexts.join("\n") + "\n\n";
  }

  return fullText.trim();
}

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
    
    let rawText = "";
    try {
      rawText = extractText(buffer);
    } catch (e) {
      console.error("[TestPDFInspector] extractText failed:", e);
    }
    
    // Get positions for reconstruction
    let positions: TextToken[] = [];
    try {
      const positionsResult = extractTextWithPositions(buffer);
      if (positionsResult?.tokens) {
        positions = positionsResult.tokens.map((t: any) => ({
          text: t.text,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          page: t.page,
        }));
      }
    } catch (e) {
      console.error("[TestPDFInspector] extractTextWithPositions failed:", e);
    }
    
    // Reconstruct text from positions
    const reconstructedText = reconstructFromPositions(positions);
    
    // Clean up the reconstructed text
    const text = cleanupBankText(reconstructedText);
    
    console.log(`[TestPDFInspector] File: ${file.name}`);
    console.log(`[TestPDFInspector] Pages: ${classification.pageCount}`);
    console.log(`[TestPDFInspector] Raw text length: ${rawText.length}`);
    console.log(`[TestPDFInspector] Positions: ${positions.length}`);
    console.log(`[TestPDFInspector] Reconstructed length: ${reconstructedText.length}`);
    console.log(`[TestPDFInspector] Cleaned text length: ${text.length}`);

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
      reconstructedText: reconstructedText,
      text: text,
      textLength: text.length,
      positionsCount: positions.length,
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
