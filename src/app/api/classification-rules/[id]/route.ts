import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await db.classificationRule.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, displayName: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch rule" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, pattern, merchantId, categoryId, priority, isActive } = body;

    const existing = await db.classificationRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const rule = await db.classificationRule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(pattern !== undefined && { pattern }),
        ...(merchantId !== undefined && { merchantId: merchantId || null }),
        ...(categoryId !== undefined && { categoryId }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        merchant: { select: { displayName: true } },
        category: { select: { name: true, icon: true } },
      },
    });

    return NextResponse.json(rule);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.classificationRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await db.classificationRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
