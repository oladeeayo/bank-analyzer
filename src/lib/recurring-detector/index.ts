import { db } from "@/lib/db";

export interface RecurringPattern {
  merchantId: string;
  merchantName: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  avgAmount: number;
  lastSeen: Date;
  nextExpected: Date;
  transactionCount: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function calculateNextDate(lastDate: Date, frequency: string): Date {
  const next = new Date(lastDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

function detectFrequency(dates: Date[]): "daily" | "weekly" | "monthly" | "yearly" {
  if (dates.length < 2) return "monthly";

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i].getTime() - sorted[i - 1].getTime());
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const dayMs = 86400000;

  if (avgInterval < dayMs * 2) return "daily";
  if (avgInterval < dayMs * 10) return "weekly";
  if (avgInterval < dayMs * 40) return "monthly";
  return "yearly";
}

export async function detectRecurringTransactions(userId: string): Promise<RecurringPattern[]> {
  // Get all debit transactions grouped by merchant
  const merchantTransactions = await db.transaction.groupBy({
    by: ["merchantId"],
    where: {
      bank: { userId },
      type: "debit",
      merchantId: { not: null },
    },
    _count: { id: true },
    _avg: { amount: true },
    _max: { date: true },
    having: { id: { _count: { gte: 3 } } },
  });

  const patterns: RecurringPattern[] = [];

  for (const group of merchantTransactions) {
    if (!group.merchantId) continue;

    const merchant = await db.merchant.findUnique({
      where: { id: group.merchantId },
    });

    if (!merchant) continue;

    const transactions = await db.transaction.findMany({
      where: {
        merchantId: group.merchantId,
        type: "debit",
        bank: { userId },
      },
      select: { date: true, amount: true },
      orderBy: { date: "asc" },
    });

    const dates = transactions.map(t => t.date);
    const amounts = transactions.map(t => t.amount);
    const frequency = detectFrequency(dates);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check if amounts are consistent (within 20% variance)
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);
    const variance = (maxAmount - minAmount) / avgAmount;

    if (variance > 0.2) continue; // Too much variance, probably not recurring

    const lastDate = dates[dates.length - 1];
    const nextExpected = calculateNextDate(lastDate, frequency);

    patterns.push({
      merchantId: group.merchantId,
      merchantName: merchant.displayName,
      frequency,
      avgAmount,
      lastSeen: lastDate,
      nextExpected,
      transactionCount: transactions.length,
    });
  }

  return patterns;
}
