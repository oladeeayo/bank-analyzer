export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  balance?: number;
  reference?: string;
  narration?: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  metadata: {
    fileName: string;
    fileType: string;
    totalRows: number;
    parsedRows: number;
    dateRange?: { start: string; end: string };
    detectedBank?: string;
    detectedAccountNumber?: string;
    detectedAccountName?: string;
  };
}

export type BankFormat =
  | "gtbank-csv"
  | "gtbank-excel"
  | "gtbank-pdf"
  | "access-csv"
  | "access-excel"
  | "access-pdf"
  | "uba-csv"
  | "uba-excel"
  | "uba-pdf"
  | "opay-csv"
  | "opay-pdf"
  | "palmpay-csv"
  | "palmpay-pdf"
  | "moniepoint-csv"
  | "moniepoint-pdf"
  | "kuda-csv"
  | "kuda-pdf"
  | "firstbank-csv"
  | "firstbank-pdf"
  | "zenith-csv"
  | "zenith-pdf"
  | "generic-csv"
  | "generic-excel"
  | "generic-pdf";
