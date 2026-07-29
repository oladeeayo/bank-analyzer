import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, pattern, merchantId, categoryId, priority } = body;

    if (!name || !type || !pattern || !categoryId) {
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