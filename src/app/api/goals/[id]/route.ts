import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

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
    const { count } = await db.goal.updateMany({
      where: { id, userId },
      data,
    });

    if (count === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goal = await db.goal.findUnique({ where: { id } });
    return NextResponse.json(goal);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
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
    const { count } = await db.goal.deleteMany({ where: { id, userId } });

    if (count === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
