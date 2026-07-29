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
    const search = searchParams.get("search");

    const where = search
      ? { displayName: { contains: search, mode: "insensitive" as const } }
      : {};

    const merchants = await db.merchant.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { displayName: "asc" },
    });

    return NextResponse.json(merchants);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, normalizedName, icon, color } = body;

    if (!displayName || !normalizedName) {
      return NextResponse.json(
        { error: "displayName and normalizedName are required" },
        { status: 400 }
      );
    }

    const merchant = await db.merchant.create({
      data: {
        displayName,
        normalizedName: normalizedName.toLowerCase().replace(/\s+/g, "_"),
        icon: icon || "🏪",
        color: color || "#6B7280",
      },
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create merchant" }, { status: 500 });
  }
}