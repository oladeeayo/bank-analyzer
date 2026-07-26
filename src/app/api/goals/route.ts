import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const goals = await db.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, targetAmount, deadline, icon } = body;

    if (!userId || !name || !targetAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await db.goal.create({
      data: {
        userId,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || "🎯",
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}