import { parseCSV } from "./csv-parser";
import { parseExcel } from "./excel-parser";
import { parsePDF } from "./pdf-parser";
import { ParseResult } from "./types";

export type { ParsedTransaction, ParseResult } from "./types";

export async function parseStatement(
  file: File | Buffer | ArrayBuffer,
  fileName: string
): Promise<ParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    let content: string;
    if (typeof file === "string") {
      content = file;
    } else if (Buffer.isBuffer(file)) {
      content = file.toString("utf-8");
    } else if (file instanceof ArrayBuffer) {
      content = new TextDecoder().decode(file);
    } else {
      content = await (file as File).text();
    }
    return parseCSV(content, fileName);
  }

  if (ext === "xlsx" || ext === "xls") {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof ArrayBuffer) {
      arrayBuffer = file;
    } else if (Buffer.isBuffer(file)) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      arrayBuffer = await (file as File).arrayBuffer();
    }
    return parseExcel(arrayBuffer, fileName);
  }

  if (ext === "pdf") {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof ArrayBuffer) {
      arrayBuffer = file;
    } else if (Buffer.isBuffer(file)) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      arrayBuffer = await (file as File).arrayBuffer();
    }
    return parsePDF(arrayBuffer, fileName);
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
