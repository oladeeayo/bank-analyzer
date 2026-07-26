import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
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
    const body = await request.json();
    const { userId, bankName, accountName, accountNumber, nickname, openingBalance, currency } = body;

    if (!userId || !bankName) {
      return NextResponse.json({ error: "userId and bankName are required" }, { status: 400 });
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