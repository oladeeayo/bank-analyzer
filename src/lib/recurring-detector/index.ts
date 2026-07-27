import { db } from "@/lib/db";

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: string;
  merchantId: string | null;
  normalizedDescription: string | null;
}

interface RecurringPattern {
  merchantId: string | null;
  description: string;
  normalizedDescription: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  avgAmount: number;
  transactionCount: number;
  lastSeenDate: Date;
  nextExpectedDate: Date | null;
  confidence: number;
  type: string;
}

function getFrequency(dates: Date[]): "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | null {
  if (dates.length < 2) return null;
  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24));
  }
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgGap > 0 ? stdDev / avgGap : Infinity;

  if (cv > 0.4) return null;

  if (avgGap >= 0.5 && avgGap <= 1.5) return "daily";
  if (avgGap >= 5 && avgGap <= 9) return "weekly";
  if (avgGap >= 12 && avgGap <= 16) return "biweekly";
  if (avgGap >= 25 && avgGap <= 35) return "monthly";
  if (avgGap >= 80 && avgGap <= 100) return "quarterly";
  if (avgGap >= 350 && avgGap <= 380) return "yearly";
  return null;
}

function getNextExpectedDate(lastDate: Date, frequency: string): Date | null {
  const next = new Date(lastDate);
  switch (frequency) {
    case "daily": next.setDate(next.getDate() + 1); break;
    case "weekly": next.setDate(next.getDate() + 7); break;
    case "biweekly": next.setDate(next.getDate() + 14); break;
    case "monthly": next.setMonth(next.getMonth() + 1); break;
    case "quarterly": next.setMonth(next.getMonth() + 3); break;
    case "yearly": next.setFullYear(next.getFullYear() + 1); break;
    default: return null;
  }
  return next;
}

export async function detectRecurringTransactions(userId: string): Promise<RecurringPattern[]> {
  const userBanks = await db.bank.findMany({ where: { userId }, select: { id: true } });
  const bankIds = userBanks.map(b => b.id);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await db.transaction.findMany({
    where: {
      bankId: { in: bankIds },
      date: { gte: sixMonthsAgo },
      isSelfTransfer: false,
    },
    select: {
      id: true,
      date: true,
      amount: true,
      description: true,
      type: true,
      merchantId: true,
      normalizedDescription: true,
    },
    orderBy: { date: "asc" },
  });

  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = `${tx.merchantId || "none"}_${tx.type}_${Math.round(tx.amount)}`;
    const group = groups.get(key) || [];
    group.push(tx);
    groups.set(key, group);
  }

  const patterns: RecurringPattern[] = [];

  for (const [, txs] of groups) {
    if (txs.length < 3) continue;
    const dates = txs.map(t => t.date);
    const frequency = getFrequency(dates);
    if (!frequency) continue;

    const avgAmount = txs.reduce((s, t) => s + t.amount, 0) / txs.length;
    const amounts = txs.map(t => t.amount);
    const amountVariance = amounts.reduce((s, a) => s + Math.pow(a - avgAmount, 2), 0) / amounts.length;
    const amountCV = avgAmount > 0 ? Math.sqrt(amountVariance) / avgAmount : Infinity;
    if (amountCV > 0.15) continue;

    const lastTx = txs[txs.length - 1];
    const normalizedDesc = txs[0].normalizedDescription || txs[0].description;

    patterns.push({
      merchantId: txs[0].merchantId,
      description: txs[0].description,
      normalizedDescription: normalizedDesc,
      frequency,
      avgAmount,
      transactionCount: txs.length,
      lastSeenDate: lastTx.date,
      nextExpectedDate: getNextExpectedDate(lastTx.date, frequency),
      confidence: Math.min(0.95, 0.5 + (txs.length * 0.05) + ((1 - amountCV) * 0.3)),
      type: txs[0].type,
    });
  }

  patterns.sort((a, b) => b.confidence - a.confidence);
  return patterns;
}
