import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "monthly";
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const banks = await db.bank.findMany({ where: { userId } });
    const bankIds = banks.map(b => b.id);

    let dateFilter: { gte: Date; lte: Date } | null = null;
    let periodLabel = "";

    if (period === "monthly") {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      dateFilter = { gte: start, lte: end };
      periodLabel = `${new Date(year, month - 1).toLocaleString("en", { month: "long" })} ${year}`;
    } else if (period === "quarterly" && quarter) {
      const start = new Date(year, (quarter - 1) * 3, 1);
      const end = new Date(year, quarter * 3, 0, 23, 59, 59);
      dateFilter = { gte: start, lte: end };
      periodLabel = `Q${quarter} ${year}`;
    } else if (period === "yearly") {
      dateFilter = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) };
      periodLabel = `${year}`;
    } else if (period === "all") {
      dateFilter = null;
      periodLabel = "All Time";
    }

    const transactions = await db.transaction.findMany({
      where: {
        bankId: { in: bankIds },
        isSelfTransfer: false,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        bank: { select: { bankName: true, nickname: true } },
        merchant: { select: { displayName: true, icon: true } },
        category: { select: { name: true, icon: true, color: true } },
      },
      orderBy: { date: "desc" },
    });

    const totalIncome = transactions
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const categoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }>();
    transactions
      .filter(t => t.type === "debit" && t.category)
      .forEach(t => {
        const cat = t.category!;
        const key = cat.name;
        const existing = categoryMap.get(key) || { id: cat.name, name: cat.name, icon: cat.icon, color: cat.color, amount: 0, count: 0 };
        existing.amount += t.amount;
        existing.count += 1;
        categoryMap.set(key, existing);
      });

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount);

    const merchantMap = new Map<string, { id: string; name: string; icon: string; amount: number; count: number }>();
    transactions
      .filter(t => t.type === "debit" && t.merchant)
      .forEach(t => {
        const merch = t.merchant!;
        const key = merch.displayName;
        const existing = merchantMap.get(key) || { id: merch.displayName, name: merch.displayName, icon: merch.icon, amount: 0, count: 0 };
        existing.amount += t.amount;
        existing.count += 1;
        merchantMap.set(key, existing);
      });

    const merchantRanking = Array.from(merchantMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);

    // Daily spending (keyed by "YYYY-MM-DD" so it works across periods)
    const dailySpending: Record<string, number> = {};
    const dailyCredits: Record<string, number> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (t.type === "debit") {
        dailySpending[key] = (dailySpending[key] || 0) + t.amount;
      } else {
        dailyCredits[key] = (dailyCredits[key] || 0) + t.amount;
      }
    });

    const sortedDays = Object.keys(dailySpending).sort();
    const daysInPeriod = dateFilter
      ? Math.ceil((dateFilter.lte.getTime() - dateFilter.gte.getTime()) / 86400000) + 1
      : sortedDays.length;

    const daysWithSpending = sortedDays.length;
    const averageDailySpend = daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0;

    const biggestExpense = transactions
      .filter(t => t.type === "debit")
      .sort((a, b) => b.amount - a.amount)[0] || null;

    const currentBalance = banks.reduce((sum, b) => sum + b.openingBalance, 0) + netCashFlow;

    // Monthly breakdown for the period (for chart)
    const monthlyChart: Array<{ month: number; year: number; credits: number; debits: number; net: number }> = [];
    if (period === "yearly" || period === "all") {
      const monthlyMap = new Map<string, { month: number; year: number; credits: number; debits: number }>();
      for (const tx of transactions) {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const entry = monthlyMap.get(key) || { month: d.getMonth() + 1, year: d.getFullYear(), credits: 0, debits: 0 };
        if (tx.type === "credit") entry.credits += tx.amount;
        else entry.debits += tx.amount;
        monthlyMap.set(key, entry);
      }
      for (const entry of monthlyMap.values()) {
        monthlyChart.push({ ...entry, net: entry.credits - entry.debits });
      }
      monthlyChart.sort((a, b) => a.year - b.year || a.month - b.month);
    }

    // Weekly chart for monthly/quarterly views
    const weeklySpending: Record<number, number> = {};
    if (dateFilter) {
      const periodStart = dateFilter.gte;
      transactions.filter(t => t.type === "debit").forEach(t => {
        const date = new Date(t.date);
        const weekNum = Math.ceil(((date.getTime() - periodStart.getTime()) / 86400000 + 1) / 7);
        weeklySpending[weekNum] = (weeklySpending[weekNum] || 0) + t.amount;
      });
    }

    return NextResponse.json({
      period,
      periodLabel,
      summary: {
        currentBalance,
        totalIncome,
        totalExpenses,
        netCashFlow,
        savingsRate,
        averageDailySpend,
        biggestExpense: biggestExpense ? {
          amount: biggestExpense.amount,
          description: biggestExpense.description,
          merchant: biggestExpense.merchant?.displayName,
        } : null,
      },
      categoryBreakdown,
      merchantRanking,
      bankComparison: banks.map(b => ({
        name: b.nickname || b.bankName,
        income: transactions.filter(t => t.bankId === b.id && t.type === "credit").reduce((s, t) => s + t.amount, 0),
        expenses: transactions.filter(t => t.bankId === b.id && t.type === "debit").reduce((s, t) => s + t.amount, 0),
      })).filter(b => b.income > 0 || b.expenses > 0),
      dailySpending,
      dailyCredits,
      weeklySpending,
      monthlyChart,
      transactionCount: transactions.length,
      daysInPeriod,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
