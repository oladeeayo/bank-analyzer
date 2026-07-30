import { db } from "@/lib/db";
import { validateRecurringPatterns, type RecurringCandidate } from "@/lib/ai";

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: string;
  merchantId: string | null;
  normalizedDescription: string | null;
}

export interface RecurringPattern {
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
  annualCost: number;
  trend: "increasing" | "decreasing" | "stable";
  trendPercent: number;
  category: string;
  tags: string[];
  insights: string[];
}

function getFrequency(dates: Date[]): "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
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

function calculateAnnualCost(avgAmount: number, frequency: string): number {
  switch (frequency) {
    case "daily": return avgAmount * 365;
    case "weekly": return avgAmount * 52;
    case "biweekly": return avgAmount * 26;
    case "monthly": return avgAmount * 12;
    case "quarterly": return avgAmount * 4;
    case "yearly": return avgAmount;
    default: return avgAmount * 12;
  }
}

function calculateTrend(
  txs: Array<{ date: Date; amount: number }>
): { trend: "increasing" | "decreasing" | "stable"; trendPercent: number } {
  if (txs.length < 3) return { trend: "stable", trendPercent: 0 };

  const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const n = sorted.length;
  const xValues = sorted.map((_, i) => i);
  const yValues = sorted.map((t) => t.amount);

  const xMean = xValues.reduce((s, x) => s + x, 0) / n;
  const yMean = yValues.reduce((s, y) => s + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  if (denominator === 0) return { trend: "stable", trendPercent: 0 };

  const slope = numerator / denominator;

  if (yMean === 0) return { trend: "stable", trendPercent: 0 };

  const trendPercent = Math.abs((slope * (n - 1)) / yMean) * 100;

  if (trendPercent < 3) return { trend: "stable", trendPercent: Math.round(trendPercent) };
  if (slope > 0) return { trend: "increasing", trendPercent: Math.round(trendPercent) };
  return { trend: "decreasing", trendPercent: Math.round(trendPercent) };
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
    const key = `${tx.merchantId || "none"}_${tx.type}`;
    const group = groups.get(key) || [];
    group.push(tx);
    groups.set(key, group);
  }

  const candidates: RecurringPattern[] = [];

  for (const [, txs] of groups) {
    if (txs.length < 3) continue;

    const amounts = txs.map(t => t.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;

    const amountRange = avgAmount > 0 ? (maxAmount - minAmount) / avgAmount : Infinity;
    if (amountRange > 0.25) continue;

    const dates = txs.map(t => t.date);
    const frequency = getFrequency(dates);
    if (!frequency) continue;

    const lastTx = txs[txs.length - 1];
    const normalizedDesc = txs[0].normalizedDescription || txs[0].description;
    const { trend, trendPercent } = calculateTrend(txs);
    const annualCost = calculateAnnualCost(avgAmount, frequency);

    const amountVariance = amounts.reduce((s, a) => s + Math.pow(a - avgAmount, 2), 0) / amounts.length;
    const amountCV = avgAmount > 0 ? Math.sqrt(amountVariance) / avgAmount : Infinity;

    candidates.push({
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
      annualCost,
      trend,
      trendPercent,
      category: "other",
      tags: [],
      insights: [],
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  if (candidates.length === 0) return [];

  const aiCandidates: RecurringCandidate[] = candidates.map((c, i) => ({
    index: i,
    description: c.description,
    normalizedDescription: c.normalizedDescription,
    frequency: c.frequency,
    avgAmount: c.avgAmount,
    transactionCount: c.transactionCount,
    type: c.type,
    lastSeenDate: c.lastSeenDate.toISOString(),
  }));

  try {
    const validations = await validateRecurringPatterns(aiCandidates);

    const validationMap = new Map<number, (typeof validations)[number]>();
    for (const v of validations) {
      validationMap.set(v.index, v);
    }

    const enriched: RecurringPattern[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const validation = validationMap.get(i);
      if (validation && !validation.isTrulyRecurring) continue;

      const pattern = { ...candidates[i] };
      if (validation) {
        pattern.category = validation.category;
        pattern.tags = validation.tags;
        pattern.insights = validation.insights;
      }

      enriched.push(pattern);
    }

    enriched.sort((a, b) => b.confidence - a.confidence);
    return enriched;
  } catch {
    return candidates;
  }
}
