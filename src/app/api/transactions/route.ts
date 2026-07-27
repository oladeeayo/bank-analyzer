import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bankId = searchParams.get("bankId");
    const categoryId = searchParams.get("categoryId");
    const merchantId = searchParams.get("merchantId");
    const type = searchParams.get("type");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const where: any = { bank: { userId } };

    if (bankId) where.bankId = bankId;
    if (categoryId) where.categoryId = categoryId;
    if (merchantId) where.merchantId = merchantId;
    if (type) where.type = type;
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }
    if (minAmount) where.amount = { ...(where.amount || {}), gte: parseFloat(minAmount) };
    if (maxAmount) where.amount = { ...(where.amount || {}), lte: parseFloat(maxAmount) };
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { normalizedDescription: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { merchant: { displayName: { contains: search, mode: "insensitive" } } },
        { merchant: { normalizedName: { contains: search.toLowerCase().replace(/\s+/g, "_"), mode: "insensitive" } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          bank: { select: { bankName: true, nickname: true } },
          merchant: { select: { displayName: true, icon: true, color: true } },
          category: { select: { name: true, icon: true, color: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}