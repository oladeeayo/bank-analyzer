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
    const nested = searchParams.get("nested") === "true";

    const where = { OR: [{ userId }, { isSystem: true }] };

    const categories = await db.category.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (nested) {
      interface CategoryNode {
        id: string;
        name: string;
        slug: string;
        icon: string;
        color: string;
        sortOrder: number;
        isSystem: boolean;
        parentId: string | null;
        _count?: { transactions: number };
        children: CategoryNode[];
      }

      const rootCategories = categories.filter(c => !c.parentId);
      const buildTree = (parentId: string): CategoryNode[] => {
        return categories
          .filter(c => c.parentId === parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(c => ({
            ...c,
            children: buildTree(c.id),
          }));
      };

      const tree: CategoryNode[] = rootCategories.map(c => ({
        ...c,
        children: buildTree(c.id),
      }));

      return NextResponse.json(tree);
    }

    return NextResponse.json(categories);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, color, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await db.category.findFirst({
      where: {
        name,
        parentId: parentId || null,
        OR: [
          { userId },
          { isSystem: true },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const category = await db.category.create({
      data: {
        userId,
        isSystem: false,
        name,
        slug,
        icon: icon || "📁",
        color: color || "#6B7280",
        parentId: parentId || undefined,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
