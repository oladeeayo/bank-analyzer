import { parseCSV } from "./csv-parser";
import { parseExcel } from "./excel-parser";
import { parsePDF } from "./pdf-parser";
import { ParseResult } from "./types";

export type { ParsedTransaction, ParseResult } from "./types";

export async function parseStatement(
  file: File | Buffer,
  fileName: string
): Promise<ParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const content = typeof file === "string"
      ? file
      : Buffer.isBuffer(file)
        ? file.toString("utf-8")
        : await (file as File).text();
    return parseCSV(content, fileName);
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = Buffer.isBuffer(file)
      ? file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
      : file instanceof ArrayBuffer
        ? file
        : await (file as File).arrayBuffer();
    return parseExcel(buffer as ArrayBuffer, fileName);
  }

  if (ext === "pdf") {
    const buffer = Buffer.isBuffer(file)
      ? file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
      : file instanceof ArrayBuffer
        ? file
        : await (file as File).arrayBuffer();
    return parsePDF(buffer as ArrayBuffer, fileName);
  }

  return {
    transactions: [],
    errors: [`Unsupported file type: ${ext}`],
    metadata: { fileName, fileType: ext || "unknown", totalRows: 0, parsedRows: 0 },
  };
}

export { parseCSV } from "./csv-parser";
export { parseExcel } from "./excel-parser";
export { parsePDF } from "./pdf-parser";
