import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const search = searchParams.get("search");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        date: { gte: startDate, lte: endDate },
      };
    }

    // Get user's bank IDs
    const userBanks = await db.bank.findMany({
      where: { userId },
      select: { id: true },
    });
    const bankIds = userBanks.map(b => b.id);

    // Get merchant spending summary
    const merchantSummary = await db.transaction.groupBy({
      by: ["merchantId"],
      where: {
        bankId: { in: bankIds },
        merchantId: { not: null },
        ...dateFilter,
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    // Get merchant details
    const merchantIds = merchantSummary
      .filter(m => m.merchantId)
      .map(m => m.merchantId!);

    const merchants = await db.merchant.findMany({
      where: { id: { in: merchantIds } },
      select: {
        id: true,
        displayName: true,
        icon: true,
        color: true,
      },
    });

    const merchantMap = new Map(merchants.map(m => [m.id, m]));

    // Build summary with merchant details
    const summary = merchantSummary
      .filter(m => m.merchantId && merchantMap.has(m.merchantId))
      .map(m => {
        const merchant = merchantMap.get(m.merchantId!);
        return {
          merchantId: m.merchantId,
          displayName: merchant?.displayName || "Unknown",
          icon: merchant?.icon || "🏪",
          color: merchant?.color || "#6B7280",
          totalAmount: m._sum.amount || 0,
          transactionCount: m._count.id,
          averageAmount: m._count.id > 0 ? (m._sum.amount || 0) / m._count.id : 0,
        };
      });

    // Also get uncategorized transactions (no merchant)
    const uncategorized = await db.transaction.aggregate({
      where: {
        bankId: { in: bankIds },
        merchantId: null,
        ...dateFilter,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Get category breakdown
    const categoryBreakdown = await db.transaction.groupBy({
      by: ["categoryId"],
      where: {
        bankId: { in: bankIds },
        categoryId: { not: null },
        ...dateFilter,
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const categoryIds = categoryBreakdown
      .filter(c => c.categoryId)
      .map(c => c.categoryId!);

    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
      },
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const categorySummary = categoryBreakdown
      .filter(c => c.categoryId && categoryMap.has(c.categoryId))
      .map(c => {
        const category = categoryMap.get(c.categoryId!);
        return {
          categoryId: c.categoryId,
          name: category?.name || "Unknown",
          icon: category?.icon || "📁",
          color: category?.color || "#6B7280",
          totalAmount: c._sum.amount || 0,
          transactionCount: c._count.id,
        };
      });

    return NextResponse.json({
      merchants: summary,
      uncategorized: {
        totalAmount: uncategorized._sum.amount || 0,
        transactionCount: uncategorized._count.id,
      },
      categories: categorySummary,
    });
  } catch (error: any) {
    console.error("Merchant summary error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch merchant summary", details: error?.message },
      { status: 500 }
    );
  }
}
