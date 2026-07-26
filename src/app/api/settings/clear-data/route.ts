import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Delete in order respecting foreign keys
    // 1. Manual overrides
    await db.manualOverride.deleteMany({ where: { userId } });
    // 2. Classification rules
    await db.classificationRule.deleteMany({ where: { userId } });
    // 3. Transactions (via banks)
    const banks = await db.bank.findMany({ where: { userId }, select: { id: true } });
    const bankIds = banks.map(b => b.id);
    if (bankIds.length > 0) {
      await db.transaction.deleteMany({ where: { bankId: { in: bankIds } } });
      await db.statement.deleteMany({ where: { bankId: { in: bankIds } } });
      await db.bank.deleteMany({ where: { userId } });
    }
    // 4. Merchants (global)
    await db.merchant.deleteMany();
    // 5. User categories (keep system)
    await db.category.deleteMany({ where: { userId, isSystem: false } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 });
  }
}
