import { db } from "@/lib/db";
import { ParsedTransaction } from "@/lib/parsers/types";

export interface TransferPair {
  sourceTxId: string;
  destTxId: string;
  amount: number;
  sourceBankId: string;
  destBankId: string;
}

export interface PotentialTransfer {
  debitTx: ParsedTransaction;
  creditTx: ParsedTransaction;
  confidence: number;
  amount: number;
}

const TRANSFER_KEYWORDS = ["transfer", "trf", "self", "own", "wallet", "funding"];

function isTransferDescription(desc: string): boolean {
  const lower = desc.toLowerCase();
  return TRANSFER_KEYWORDS.some(kw => lower.includes(kw));
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(name1: string, name2: string): boolean {
  const normalized1 = normalizeForMatch(name1);
  const normalized2 = normalizeForMatch(name2);

  const words1 = normalized1.split(" ").filter(w => w.length > 2);
  const words2 = normalized2.split(" ").filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return false;

  let matchCount = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matchCount++;
        break;
      }
    }
  }

  // At least 2 words must match, or 1 word if both descriptions are short
  const minMatches = Math.min(2, Math.min(words1.length, words2.length));
  return matchCount >= minMatches;
}

function timeDiffMinutes(d1: Date, d2: Date): number {
  return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60);
}

export function detectSelfTransfers(
  transactions: ParsedTransaction[],
  bankIds: string[]
): PotentialTransfer[] {
  const transfers: PotentialTransfer[] = [];
  const processed = new Set<number>();

  const debits = transactions
    .map((tx, idx) => ({ tx, idx }))
    .filter(({ tx }) => tx.type === "debit");

  const credits = transactions
    .map((tx, idx) => ({ tx, idx }))
    .filter(({ tx }) => tx.type === "credit");

  for (const { tx: debit, idx: dIdx } of debits) {
    if (processed.has(dIdx)) continue;

    for (const { tx: credit, idx: cIdx } of credits) {
      if (processed.has(cIdx)) continue;
      if (dIdx === cIdx) continue;

      // Same amount (within 1% tolerance for rounding)
      const amountDiff = Math.abs(debit.amount - credit.amount) / debit.amount;
      if (amountDiff > 0.01) continue;

      // Within time window (same day, within 6 hours)
      const debitDate = new Date(debit.date);
      const creditDate = new Date(credit.date);
      const sameDay = debitDate.toDateString() === creditDate.toDateString();

      if (!sameDay) continue;

      const minutesDiff = timeDiffMinutes(debitDate, creditDate);
      if (minutesDiff > 360) continue; // 6 hours

      // Check for transfer indicators
      const debitIsTransfer = isTransferDescription(debit.description);
      const creditIsTransfer = isTransferDescription(credit.description);
      const isNameMatch = namesMatch(debit.description, credit.description);

      // Must have at least one transfer indicator OR name match
      if (!debitIsTransfer && !creditIsTransfer && !isNameMatch) continue;

      // Calculate confidence
      let confidence = 0.5;

      // Amount match quality
      if (amountDiff === 0) confidence += 0.2;
      else if (amountDiff < 0.005) confidence += 0.1;

      // Time proximity
      if (minutesDiff < 30) confidence += 0.15;
      else if (minutesDiff < 120) confidence += 0.1;

      // Transfer keywords
      if (debitIsTransfer && creditIsTransfer) confidence += 0.1;
      else if (debitIsTransfer || creditIsTransfer) confidence += 0.05;

      // Name matching (strong indicator)
      if (isNameMatch) confidence += 0.15;

      transfers.push({
        debitTx: debit,
        creditTx: credit,
        amount: debit.amount,
        confidence: Math.min(confidence, 1),
      });

      processed.add(dIdx);
      processed.add(cIdx);
      break;
    }
  }

  return transfers;
}

export async function saveTransferDetection(
  userId: string,
  transfers: PotentialTransfer[],
  bankIdMap: Map<string, string>
): Promise<void> {
  for (const transfer of transfers) {
    const sourceBankId = bankIdMap.get("source");
    const destBankId = bankIdMap.get("destination");

    if (sourceBankId && destBankId) {
      // Mark both transactions as self-transfers
      // This would update the transaction records
    }
  }
}
