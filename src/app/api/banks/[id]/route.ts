import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bank = await db.bank.findFirst({
      where: { id, userId },
      include: {
        statements: { orderBy: { uploadedAt: "desc" } },
        _count: { select: { transactions: true } },
      },
    });

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    return NextResponse.json(bank);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch bank" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Prevent reassigning ownership and only update rows owned by this user
    const { userId: _ignored, ...data } = body;
    const { count } = await db.bank.updateMany({
      where: { id, userId },
      data,
    });

    if (count === 0) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    const bank = await db.bank.findUnique({ where: { id } });
    return NextResponse.json(bank);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update bank" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { count } = await db.bank.deleteMany({ where: { id, userId } });

    if (count === 0) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete bank" }, { status: 500 });
  }
}
