import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banks = await db.bank.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true, statements: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(banks);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bankName, accountName, accountNumber, nickname, openingBalance, currency } = body;

    if (!bankName) {
      return NextResponse.json({ error: "bankName is required" }, { status: 400 });
    }

    const bank = await db.bank.create({
      data: {
        userId,
        bankName,
        accountName,
        accountNumber,
        nickname,
        openingBalance: openingBalance || 0,
        currency: currency || "NGN",
      },
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create bank" }, { status: 500 });
  }
}