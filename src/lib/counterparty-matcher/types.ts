export interface ExtractedCounterparty {
  name: string;
  normalizedName: string;
  bank?: string;
  accountNumber?: string;
  partialAccountNumber?: string;
  direction: "credit" | "debit" | "unknown";
  isSelfTransfer: boolean;
}

export interface CounterpartyProfile {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  knownBanks: { name: string; accountNumber?: string }[];
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
  firstTransactionDate?: string;
  lastTransactionDate?: string;
}

export interface CounterpartyMatch {
  matched: boolean;
  profileId?: string;
  confidence: number;
  matchLevel: "exact_account" | "partial_account" | "name_similarity" | "none";
  matchedField?: string;
}

export interface SimilarTransactionGroup {
  groupId: string;
  counterpartyName: string;
  normalizedName: string;
  transactionIds: string[];
  transactionIndices: number[];
  direction: "credit" | "debit" | "mixed";
  totalAmount: number;
  transactionCount: number;
}
