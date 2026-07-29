import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
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

    const where: Prisma.TransactionWhereInput = { bank: { userId } };

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
    if (minAmount || maxAmount) {
      const amountFilter: Prisma.FloatFilter = {};
      if (minAmount) amountFilter.gte = parseFloat(minAmount);
      if (maxAmount) amountFilter.lte = parseFloat(maxAmount);
      where.amount = amountFilter;
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { normalizedDescription: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { merchant: { displayName: { contains: search, mode: "insensitive" } } },
        { merchant: { normalizedName: { contains: search.toLowerCase().replace(/\s+/g, "_"), mode: "insensitive" } } },
        { category: { name: { contains: search, mode: "insensitive" } } },
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