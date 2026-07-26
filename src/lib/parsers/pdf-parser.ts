import { ParseResult } from "./types";
import { parseCSV } from "./csv-parser";

export async function parsePDF(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  try {
    // Basic PDF text extraction attempt
    // For production, consider using pdf-parse or a dedicated PDF table extraction library
    const text = new TextDecoder().decode(buffer);

    // Try to find CSV-like data in the PDF
    const lines = text.split("\n").filter(line => line.includes(",") || line.includes("\t"));

    if (lines.length > 0) {
      const csvContent = lines.join("\n");
      return parseCSV(csvContent, fileName);
    }

    return {
      transactions: [],
      errors: ["PDF parsing requires a dedicated PDF extraction library. Please export as CSV or Excel."],
      metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
    };
  } catch (_error) {
    return {
      transactions: [],
      errors: [`PDF parse error: ${error}`],
      metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
    };
  }
}
