import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await db.category.findFirst({
      where: {
        name,
        parentId: undefined,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        icon: icon || "📁",
        color: color || "#6B7280",
      },
    });

    return NextResponse.json(category);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true, children: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category.isSystem) {
      return NextResponse.json({ error: "Cannot delete system categories" }, { status: 403 });
    }

    if (category._count.transactions > 0) {
      return NextResponse.json(
        { error: `Cannot delete "${category.name}" — ${category._count.transactions} transactions use this category. Reassign them first.` },
        { status: 409 }
      );
    }

    // Delete children first
    if (category._count.children > 0) {
      await db.category.deleteMany({ where: { parentId: id } });
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
