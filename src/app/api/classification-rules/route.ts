import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const rules = await db.classificationRule.findMany({
      where: { userId },
      include: {
        merchant: { select: { displayName: true } },
        category: { select: { name: true, icon: true } },
      },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json(rules);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, type, pattern, merchantId, categoryId, priority } = body;

    if (!userId || !name || !type || !pattern || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rule = await db.classificationRule.create({
      data: {
        userId,
        name,
        type,
        pattern,
        merchantId: merchantId || null,
        categoryId,
        priority: priority || 0,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}