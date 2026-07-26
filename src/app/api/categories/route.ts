import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let categories;
    if (userId) {
      categories = await db.category.findMany({
        where: {
          OR: [
            { userId },
            { isSystem: true },
          ],
        },
        include: {
          _count: { select: { transactions: true } },
        },
        orderBy: { name: "asc" },
      });
    } else {
      categories = await db.category.findMany({
        where: { isSystem: true },
        include: {
          _count: { select: { transactions: true } },
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(categories);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Check if category already exists for this user
    if (userId) {
      const existing = await db.category.findFirst({
        where: {
          name,
          OR: [
            { userId },
            { isSystem: true },
          ],
        },
      });

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    const category = await db.category.create({
      data: {
        userId: userId || undefined,
        isSystem: !userId,
        name,
        icon: icon || "📁",
        color: color || "#6B7280",
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
