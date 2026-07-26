import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Get all banks for this user
    const banks = await db.bank.findMany({ where: { userId } });
    const bankIds = banks.map(b => b.id);

    // Get all transactions for the month
    const transactions = await db.transaction.findMany({
      where: {
        bankId: { in: bankIds },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        bank: { select: { bankName: true, nickname: true } },
        merchant: { select: { displayName: true, icon: true } },
        category: { select: { name: true, icon: true, color: true } },
      },
      orderBy: { date: "desc" },
    });

    // Calculate summary
    const totalIncome = transactions
      .filter(t => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();
    transactions
      .filter(t => t.type === "debit" && t.category)
      .forEach(t => {
        const cat = t.category!;
        const key = cat.name;
        const existing = categoryMap.get(key) || { name: cat.name, icon: cat.icon, color: cat.color, amount: 0, count: 0 };
        existing.amount += t.amount;
        existing.count += 1;
        categoryMap.set(key, existing);
      });

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount);

    // Merchant ranking
    const merchantMap = new Map<string, { name: string; icon: string; amount: number; count: number }>();
    transactions
      .filter(t => t.type === "debit" && t.merchant)
      .forEach(t => {
        const merch = t.merchant!;
        const key = merch.displayName;
        const existing = merchantMap.get(key) || { name: merch.displayName, icon: merch.icon, amount: 0, count: 0 };
        existing.amount += t.amount;
        existing.count += 1;
        merchantMap.set(key, existing);
      });

    const merchantRanking = Array.from(merchantMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);

    // Bank comparison
    const bankMap = new Map<string, { name: string; income: number; expenses: number }>();
    banks.forEach(b => bankMap.set(b.id, { name: b.nickname || b.bankName, income: 0, expenses: 0 }));
    transactions.forEach(t => {
      const bank = bankMap.get(t.bankId);
      if (bank) {
        if (t.type === "credit") bank.income += t.amount;
        else bank.expenses += t.amount;
      }
    });

    const bankComparison = Array.from(bankMap.values()).filter(b => b.income > 0 || b.expenses > 0);

    // Daily spending
    const dailySpending: Record<number, number> = {};
    transactions
      .filter(t => t.type === "debit")
      .forEach(t => {
        const day = new Date(t.date).getDate();
        dailySpending[day] = (dailySpending[day] || 0) + t.amount;
      });

    // Weekly spending
    const weeklySpending: Record<number, number> = {};
    transactions
      .filter(t => t.type === "debit")
      .forEach(t => {
        const date = new Date(t.date);
        const weekStart = new Date(currentYear, currentMonth - 1, 1);
        const weekNum = Math.ceil(((date.getTime() - weekStart.getTime()) / 86400000 + 1) / 7);
        weeklySpending[weekNum] = (weeklySpending[weekNum] || 0) + t.amount;
      });

    // Average daily spend
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysWithSpending = Object.keys(dailySpending).length;
    const averageDailySpend = daysWithSpending > 0 ? totalExpenses / daysInMonth : 0;

    // Biggest expense
    const biggestExpense = transactions
      .filter(t => t.type === "debit")
      .sort((a, b) => b.amount - a.amount)[0] || null;

    // Current balance across all banks
    const currentBalance = banks.reduce((sum, b) => sum + b.openingBalance, 0) + netCashFlow;

    return NextResponse.json({
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
      bankComparison,
      dailySpending,
      weeklySpending,
      transactionCount: transactions.length,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}