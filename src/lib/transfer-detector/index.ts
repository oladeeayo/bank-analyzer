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

      // At least one has transfer keyword
      const debitIsTransfer = isTransferDescription(debit.description);
      const creditIsTransfer = isTransferDescription(credit.description);

      if (!debitIsTransfer && !creditIsTransfer) continue;

      // Calculate confidence
      let confidence = 0.5;
      if (amountDiff === 0) confidence += 0.3;
      if (minutesDiff < 30) confidence += 0.1;
      if (debitIsTransfer && creditIsTransfer) confidence += 0.1;

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
