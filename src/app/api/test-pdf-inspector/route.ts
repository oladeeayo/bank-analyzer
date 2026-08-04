import { NextRequest, NextResponse } from "next/server";
import {
  classifyPdf,
  processPdf,
  extractText,
  extractPagesMarkdown,
  extractTextWithPositions,
} from "@firecrawl/pdf-inspector";
import { cleanupBankText } from "@/lib/utils/text-cleanup";
import { getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";

interface TextToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

/**
 * Advanced Spatial Layout & Table Reconstruction Engine.
 * Takes raw PDF text tokens with coordinates (x, y, width, height) and reconstructs
 * structured Markdown, recognizing tabular data, headings, and aligned columns.
 */
function reconstructFromPositions(positions: TextToken[]): {
  reconstructedText: string;
  markdown: string;
} {
  if (!positions || positions.length === 0) {
    return { reconstructedText: "", markdown: "" };
  }

  const pages = [...new Set(positions.map((t) => t.page))];
  let fullText = "";
  let fullMarkdown = "";

  for (const page of pages) {
    const pageTokens = positions
      .filter((t) => t.page === page)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (pageTokens.length === 0) continue;

    // Determine dynamic Y threshold based on median token height
    const heights = pageTokens.map((t) => t.height).filter((h) => h > 0);
    const medianHeight = heights.length > 0
      ? heights.sort((a, b) => a - b)[Math.floor(heights.length / 2)]
      : 8;
    const Y_THRESHOLD = Math.max(3, medianHeight * 0.45);

    // Step 1: Group tokens into visual lines based on Y position
    const lines: TextToken[][] = [];
    let currentLine: TextToken[] = [pageTokens[0]];
    let lastY = pageTokens[0].y;

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

    // Sort tokens horizontally (X) within each line
    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
    }

    // Step 2: Build plain reconstructed text
    const textLines = lines.map((line) => {
      const words: string[] = [];
      let currentWord = line[0];

      for (let i = 1; i < line.length; i++) {
        const gap = line[i].x - (currentWord.x + currentWord.width);
        if (gap > 12) {
          words.push(currentWord.text);
          currentWord = line[i];
        } else {
          currentWord = {
            ...currentWord,
            text: currentWord.text + (gap > 1.5 ? " " : "") + line[i].text,
            width: line[i].x + line[i].width - currentWord.x,
          };
        }
      }
      words.push(currentWord.text);
      return words.join(" ");
    });

    fullText += `--- Page ${page + 1} ---\n` + textLines.join("\n") + "\n\n";

    // Step 3: Build Markdown representation (detecting tables vs paragraphs)
    const pageMdBlocks: string[] = [];
    let tableBuffer: string[][] = [];

    const flushTable = () => {
      if (tableBuffer.length === 0) return;
      if (tableBuffer.length === 1) {
        // Single row - output as plain line
        pageMdBlocks.push(tableBuffer[0].join(" | "));
      } else {
        // Determine column count
        const colCount = Math.max(...tableBuffer.map((r) => r.length));
        const headerRow = tableBuffer[0];
        while (headerRow.length < colCount) headerRow.push("");

        const mdLines: string[] = [];
        mdLines.push("| " + headerRow.join(" | ") + " |");
        mdLines.push("| " + Array(colCount).fill("---").join(" | ") + " |");

        for (let r = 1; r < tableBuffer.length; r++) {
          const row = tableBuffer[r];
          while (row.length < colCount) row.push("");
          mdLines.push("| " + row.join(" | ") + " |");
        }
        pageMdBlocks.push(mdLines.join("\n"));
      }
      tableBuffer = [];
    };

    for (const line of lines) {
      // Split line into cells if there are large horizontal gaps (> 25 units)
      const cells: string[] = [];
      let cellTokens: TextToken[] = [line[0]];

      for (let i = 1; i < line.length; i++) {
        const prev = cellTokens[cellTokens.length - 1];
        const gap = line[i].x - (prev.x + prev.width);
        if (gap > 22) {
          cells.push(cellTokens.map((t) => t.text).join(" ").trim());
          cellTokens = [line[i]];
        } else {
          cellTokens.push(line[i]);
        }
      }
      if (cellTokens.length > 0) {
        cells.push(cellTokens.map((t) => t.text).join(" ").trim());
      }

      const validCells = cells.filter((c) => c.length > 0);

      // If line has multiple distinct columns, add to table buffer
      if (validCells.length >= 2) {
        tableBuffer.push(validCells);
      } else {
        flushTable();
        const singleText = textLines[lines.indexOf(line)] || "";
        if (singleText.trim()) {
          if (singleText.toUpperCase() === singleText && singleText.length < 50 && singleText.length > 3) {
            pageMdBlocks.push(`### ${singleText.trim()}`);
          } else {
            pageMdBlocks.push(singleText.trim());
          }
        }
      }
    }
    flushTable();

    fullMarkdown += `## Page ${page + 1}\n\n` + pageMdBlocks.join("\n\n") + "\n\n";
  }

  return {
    reconstructedText: fullText.trim(),
    markdown: fullMarkdown.trim(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      if (Array.isArray(positionsResult)) {
        positions = positionsResult.map((t: any) => ({
          text: t.text,
          x: Math.round(t.x * 10) / 10,
          y: Math.round(t.y * 10) / 10,
          width: Math.round(t.width * 10) / 10,
          height: Math.round(t.height * 10) / 10,
          page: t.page,
        }));
      }
    } catch (e) {
      console.error("[TestPDFInspector] extractTextWithPositions failed:", e);
    }

    // Reconstruct spatial layout text and markdown tables from positions
    const { reconstructedText, markdown: spatialMarkdown } = reconstructFromPositions(positions);

    // Clean up the reconstructed text for plain search
    const text = cleanupBankText(reconstructedText);

    // Extract official markdown pages via pdf-inspector
    let markdownResult: any = null;
    let fullMarkdownText = spatialMarkdown;
    try {
      markdownResult = extractPagesMarkdown(buffer);
      if (markdownResult && markdownResult.pages && markdownResult.pages.length > 0) {
        const officialMd = markdownResult.pages.map((p: any) => p.markdown).join("\n\n---\n\n");
        if (officialMd.trim().length > 50) {
          fullMarkdownText = officialMd;
        }
      }
    } catch (e) {
      console.error("[TestPDFInspector] extractPagesMarkdown failed:", e);
    }

    console.log(`[TestPDFInspector] File: ${file.name}`);
    console.log(`[TestPDFInspector] Pages: ${classification.pageCount}`);
    console.log(`[TestPDFInspector] Raw text length: ${rawText.length}`);
    console.log(`[TestPDFInspector] Positions: ${positions.length}`);
    console.log(`[TestPDFInspector] Reconstructed length: ${reconstructedText.length}`);
    console.log(`[TestPDFInspector] Full markdown length: ${fullMarkdownText.length}`);

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
        markdown: fullMarkdownText,
      },
      rawText: rawText,
      reconstructedText: reconstructedText,
      text: text,
      textLength: text.length,
      positionsCount: positions.length,
      textWithPositions: positions.slice(0, 300), // First 300 positions for inspection
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

