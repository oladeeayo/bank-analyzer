import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const banks = await db.bank.findMany({ where: { userId }, select: { id: true } });
    const bankIds = banks.map(b => b.id);

    if (bankIds.length > 0) {
      const statements = await db.statement.findMany({ where: { bankId: { in: bankIds } }, select: { id: true } });
      const statementIds = statements.map(s => s.id);
      if (statementIds.length > 0) {
        await db.stagedTransaction.deleteMany({ where: { statementId: { in: statementIds } } });
      }
      await db.transaction.deleteMany({ where: { bankId: { in: bankIds } } });
      await db.statement.deleteMany({ where: { bankId: { in: bankIds } } });
      await db.bank.deleteMany({ where: { userId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear statements error:", error);
    return NextResponse.json({ error: "Failed to clear statements" }, { status: 500 });
  }
}
