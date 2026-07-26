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
  };
}

export type BankFormat =
  | "gtbank-csv"
  | "gtbank-excel"
  | "access-csv"
  | "access-excel"
  | "uba-csv"
  | "uba-excel"
  | "opay-csv"
  | "palmpay-csv"
  | "moniepoint-csv"
  | "kuda-csv"
  | "firstbank-csv"
  | "zenith-csv"
  | "generic-csv"
  | "generic-excel"
  | "generic-pdf";
