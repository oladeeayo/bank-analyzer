import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateReport, type ReportData } from "@/lib/ai/report";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "monthly";
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const quarter = parseInt(searchParams.get("quarter") || String(Math.ceil((new Date().getMonth() + 1) / 3)));

  try {
    const dateFilter: { gte: Date; lte: Date } = { gte: new Date(0), lte: new Date() };
    if (period === "monthly") {
      dateFilter.gte = new Date(year, month - 1, 1);
      dateFilter.lte = new Date(year, month, 0, 23, 59, 59);
    } else if (period === "quarterly") {
      dateFilter.gte = new Date(year, (quarter - 1) * 3, 1);
      dateFilter.lte = new Date(year, quarter * 3, 0, 23, 59, 59);
    } else if (period === "yearly") {
      dateFilter.gte = new Date(year, 0, 1);
      dateFilter.lte = new Date(year, 11, 31, 23, 59, 59);
    }

    const transactions = await db.transaction.findMany({
      where: { bank: { userId }, date: dateFilter },
      include: { category: true, merchant: true, bank: true },
      orderBy: { date: "desc" },
    });

    const banks = await db.bank.findMany({ where: { userId } });
    const budgets = await db.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    });
    const goals = await db.goal.findMany({ where: { userId } });
    const recurringPatterns = await db.recurringTransaction.findMany({
      where: { isActive: true },
      include: { merchant: true },
    });

    const totalIncome = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;

    const lastBalance = await db.transaction.findFirst({
      where: { bank: { userId }, balance: { not: null } },
      orderBy: { date: "desc" },
      select: { balance: true },
    });

    const activeDays = new Set(transactions.map((t) => t.date.toISOString().slice(0, 10))).size;

    const categoryBreakdown = await db.transaction.groupBy({
      by: ["categoryId"],
      where: { bank: { userId }, date: dateFilter, type: "debit", categoryId: { not: null } },
      _sum: { amount: true },
      _count: true,
    });

    const categories = await db.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const categoryBreakdownMapped = categoryBreakdown
      .map((g) => ({
        name: categoryMap.get(g.categoryId || "")?.name || "Unknown",
        icon: categoryMap.get(g.categoryId || "")?.icon || "?",
        amount: g._sum.amount || 0,
        count: g._count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const merchantRanking = await db.transaction.groupBy({
      by: ["merchantId"],
      where: { bank: { userId }, date: dateFilter, merchantId: { not: null }, type: "debit" },
      _sum: { amount: true },
      _count: true,
    });

    const merchants = await db.merchant.findMany();
    const merchantMap = new Map(merchants.map((m) => [m.id, m]));

    const merchantRankingMapped = merchantRanking
      .map((g) => ({
        name: merchantMap.get(g.merchantId || "")?.displayName || merchantMap.get(g.merchantId || "")?.normalizedName || "Unknown",
        amount: g._sum.amount || 0,
        count: g._count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const incomeCategories = await db.transaction.groupBy({
      by: ["categoryId"],
      where: { bank: { userId }, date: dateFilter, type: "credit", categoryId: { not: null } },
      _sum: { amount: true },
    });

    const topIncomeCategories = incomeCategories
      .map((g) => ({
        name: categoryMap.get(g.categoryId || "")?.name || "Unknown",
        amount: g._sum.amount || 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const biggestDebit = transactions
      .filter((t) => t.type === "debit")
      .sort((a, b) => b.amount - a.amount)[0];

    const budgetHealth = budgets.map((b) => {
      const spent = transactions
        .filter((t) => t.categoryId === b.categoryId && t.type === "debit")
        .reduce((s, t) => s + t.amount, 0);
      return {
        category: b.category?.name || "Unknown",
        limit: b.limit,
        spent,
      };
    });

    const totalBalance = banks.reduce((s, b) => s + (b.openingBalance || 0), 0);
    const transactionsThisPeriod = transactions.filter((t) => t.date >= dateFilter.gte && t.date <= dateFilter.lte);
    const periodBalance = totalBalance + transactionsThisPeriod.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0) - transactionsThisPeriod.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

    const reportData: ReportData = {
      summary: {
        currentBalance: lastBalance?.balance || periodBalance || totalBalance,
        totalIncome,
        totalExpenses,
        netCashFlow,
        savingsRate: totalIncome > 0 ? ((netCashFlow / totalIncome) * 100) : 0,
        averageDailySpend: activeDays > 0 ? totalExpenses / activeDays : 0,
      },
      periodLabel: period === "monthly" ? `${month}/${year}` : period === "quarterly" ? `Q${quarter} ${year}` : period === "yearly" ? String(year) : "All Time",
      transactionCount: transactions.length,
      categoryBreakdown: categoryBreakdownMapped,
      merchantRanking: merchantRankingMapped,
      recurringExpenses: recurringPatterns.map((r) => ({
        description: r.merchant?.displayName || r.merchant?.normalizedName || "Unknown",
        avgAmount: r.avgAmount,
        frequency: r.frequency,
      })),
      biggestExpense: biggestDebit ? {
        amount: biggestDebit.amount,
        description: biggestDebit.description,
        merchant: biggestDebit.merchant?.displayName || "",
      } : null,
      topIncomeCategories,
      budgetHealth,
      goals: goals.map((g) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
      })),
    };

    let aiReport = null;
    try {
      aiReport = await generateReport(reportData);
    } catch {
      // AI generation failed, return data-only report
    }

    return NextResponse.json({ data: reportData, aiReport });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}