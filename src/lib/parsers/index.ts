import { parseCSV } from "./csv-parser";
import { parseExcel } from "./excel-parser";
import { parsePDF } from "./pdf-parser";
import { parseWithAI, parsePdfWithGeminiVision } from "./ai-parser";
import { ParseResult } from "./types";

export type { ParsedTransaction, ParseResult } from "./types";

const MIN_CONFIDENCE_RATIO = 0.5;

export async function parseStatement(
  file: File | Buffer | ArrayBuffer,
  fileName: string
): Promise<ParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  console.log(`[Parser] File: ${fileName}, ext: ${ext}`);

  let result: ParseResult;
  let pdfArrayBuffer: ArrayBuffer | null = null;

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
    result = parseCSV(content, fileName);
  } else if (ext === "xlsx" || ext === "xls") {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof ArrayBuffer) {
      arrayBuffer = file;
    } else if (Buffer.isBuffer(file)) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      arrayBuffer = await (file as File).arrayBuffer();
    }
    result = parseExcel(arrayBuffer, fileName);
  } else if (ext === "pdf") {
    if (file instanceof ArrayBuffer) {
      pdfArrayBuffer = file;
    } else if (Buffer.isBuffer(file)) {
      pdfArrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      pdfArrayBuffer = await (file as File).arrayBuffer();
    }
    result = await parsePDF(pdfArrayBuffer, fileName);
  } else {
    return {
      transactions: [],
      errors: [`Unsupported file type: ${ext}`],
      metadata: { fileName, fileType: ext || "unknown", totalRows: 0, parsedRows: 0 },
    };
  }

  // If heuristic parsing gave low confidence (or 0 rows) and we have Gemini, try AI fallback
  const isKuda = result.metadata.detectedBank?.toLowerCase().includes("kuda");
  const isLowConfidence = result.transactions.length === 0 ||
    (result.metadata.totalRows > 0 && result.transactions.length / result.metadata.totalRows < MIN_CONFIDENCE_RATIO);

  if ((isLowConfidence || isKuda) && process.env.GEMINI_API_KEY) {
    console.log(`[Parser] ${isKuda ? "Kuda statement detected" : "Low confidence (" + result.transactions.length + "/" + result.metadata.totalRows + ")"}, trying Gemini Vision OCR fallback`);

    if (ext === "pdf" && pdfArrayBuffer) {
      const visionResult = await parsePdfWithGeminiVision(pdfArrayBuffer, fileName);
      if (visionResult.transactions.length > result.transactions.length || (isKuda && visionResult.transactions.length > 0)) {
        console.log(`[Parser] Gemini Vision OCR produced ${visionResult.transactions.length} transactions (vs ${result.transactions.length} from heuristic)`);
        visionResult.errors = [
          ...result.errors,
          ...visionResult.errors,
        ];
        return visionResult;
      }
    } else {
      const rawContent = await getRawTextContent(file, ext);
      if (rawContent && rawContent.length > 100) {
        const aiResult = await parseWithAI(rawContent, fileName);
        if (aiResult.transactions.length > result.transactions.length) {
          console.log(`[Parser] AI text fallback produced ${aiResult.transactions.length} transactions (vs ${result.transactions.length} from heuristic)`);
          aiResult.errors = [
            ...result.errors,
            ...aiResult.errors,
          ];
          return aiResult;
        }
      }
    }
  }

  return result;
}

async function getRawTextContent(file: File | Buffer | ArrayBuffer, ext?: string): Promise<string | null> {
  try {
    if (typeof file === "string") return file;
    if (Buffer.isBuffer(file)) return file.toString("utf-8");
    if (file instanceof ArrayBuffer) return new TextDecoder().decode(file);
    return await (file as File).text();
  } catch {
    return null;
  }
}

export { parseCSV } from "./csv-parser";
export { parseExcel } from "./excel-parser";
export { parsePDF } from "./pdf-parser";
