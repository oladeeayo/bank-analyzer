import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
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
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, month, year, limit: budgetLimit } = body;

    if (!categoryId || !month || !year || !budgetLimit) {
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