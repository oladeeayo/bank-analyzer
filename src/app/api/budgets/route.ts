import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!userId || !month || !year) {
      return NextResponse.json({ error: "userId, month, and year are required" }, { status: 400 });
    }

    const budgets = await db.budget.findMany({
      where: {
        userId,
        month: parseInt(month),
        year: parseInt(year),
      },
      include: {
        category: { select: { name: true, icon: true, color: true } },
      },
    });

    return NextResponse.json(budgets);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, categoryId, month, year, limit: budgetLimit } = body;

    if (!userId || !categoryId || !month || !year || !budgetLimit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const budget = await db.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: { limit: budgetLimit },
      create: {
        userId,
        categoryId,
        month: parseInt(month),
        year: parseInt(year),
        limit: budgetLimit,
      },
      include: {
        category: { select: { name: true, icon: true, color: true } },
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}