import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // "category" | "merchant"
    const name = searchParams.get("name");
    const period = searchParams.get("period") || "all";
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;

    if (!userId || !type || !name) {
      return NextResponse.json({ error: "userId, type, and name are required" }, { status: 400 });
    }

    const banks = await db.bank.findMany({ where: { userId }, select: { id: true } });
    const bankIds = banks.map(b => b.id);

    let dateFilter: { gte: Date; lte: Date } | undefined = undefined;
    if (period === "monthly") {
      dateFilter = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) };
    } else if (period === "quarterly" && quarter) {
      dateFilter = { gte: new Date(year, (quarter - 1) * 3, 1), lte: new Date(year, quarter * 3, 0, 23, 59, 59) };
    } else if (period === "yearly") {
      dateFilter = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) };
    }

    let transactions;

    if (type === "category") {
      transactions = await db.transaction.findMany({
        where: {
          bankId: { in: bankIds },
          isSelfTransfer: false,
          category: { name: name },
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        select: {
          id: true,
          date: true,
          description: true,
          normalizedDescription: true,
          amount: true,
          type: true,
          merchant: { select: { displayName: true, icon: true } },
          category: { select: { name: true, icon: true } },
        },
        orderBy: { date: "desc" },
        take: 50,
      });
    } else {
      transactions = await db.transaction.findMany({
        where: {
          bankId: { in: bankIds },
          isSelfTransfer: false,
          merchant: { displayName: name },
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        select: {
          id: true,
          date: true,
          description: true,
          normalizedDescription: true,
          amount: true,
          type: true,
          merchant: { select: { displayName: true, icon: true } },
          category: { select: { name: true, icon: true } },
        },
        orderBy: { date: "desc" },
        take: 50,
      });
    }

    const totalCredits = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const totalDebits = transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      totalCredits,
      totalDebits,
      transactions,
      total: transactions.length,
    });
  } catch (error: any) {
    console.error("Drilldown error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch drilldown" }, { status: 500 });
  }
}
