import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { merchantId } = await params;

    const userBanks = await db.bank.findMany({
      where: { userId },
      select: { id: true },
    });
    const bankIds = userBanks.map((b) => b.id);

    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, displayName: true, icon: true, color: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: {
        bankId: { in: bankIds },
        merchantId,
        type: "debit",
      },
      include: {
        category: { select: { name: true, icon: true, color: true } },
      },
      orderBy: { date: "desc" },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const visitCount = transactions.length;
    const avgVisit = visitCount > 0 ? totalSpent / visitCount : 0;

    const monthlyMap = new Map<string, { month: number; year: number; amount: number; count: number }>();
    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const entry = monthlyMap.get(key) || { month: d.getMonth() + 1, year: d.getFullYear(), amount: 0, count: 0 };
      entry.amount += tx.amount;
      entry.count += 1;
      monthlyMap.set(key, entry);
    }
    const monthlySpending = Array.from(monthlyMap.values()).sort((a, b) => a.year - b.year || a.month - b.month);

    const categoryMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();
    for (const tx of transactions) {
      if (!tx.category) continue;
      const cat = tx.category;
      const existing = categoryMap.get(cat.name) || { name: cat.name, icon: cat.icon, color: cat.color, amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count += 1;
      categoryMap.set(cat.name, existing);
    }
    const categorySplit = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);

    const recentTransactions = transactions.slice(0, 10).map((tx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      channelTag: tx.channelTag,
    }));

    const dayMap = new Map<number, { day: string; amount: number; count: number }>();
    for (const tx of transactions) {
      const d = new Date(tx.date);
      const dayOfWeek = d.getDay();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const existing = dayMap.get(dayOfWeek) || { day: dayNames[dayOfWeek], amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count += 1;
      dayMap.set(dayOfWeek, existing);
    }
    const peakDay = Array.from(dayMap.values()).sort((a, b) => b.amount - a.amount)[0] || null;

    const dates = [...new Set(transactions.map((t) => new Date(t.date).toDateString()))].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    let avgDaysBetween = 0;
    if (dates.length > 1) {
      const gaps = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000);
      }
      avgDaysBetween = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    }

    return NextResponse.json({
      merchant,
      totalSpent,
      visitCount,
      avgVisit,
      monthlySpending,
      categorySplit,
      recentTransactions,
      peakDay,
      avgDaysBetween,
      uniqueDays: dates.length,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch merchant analytics" }, { status: 500 });
  }
}
