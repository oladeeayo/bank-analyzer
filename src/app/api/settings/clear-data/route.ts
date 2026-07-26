import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Delete in correct FK order: children before parents
    // 1. Manual overrides (refs Merchant, Category)
    await db.manualOverride.deleteMany({ where: { userId } });
    // 2. Classification rules (refs Merchant, Category)
    await db.classificationRule.deleteMany({ where: { userId } });
    // 3. Budgets (refs Category)
    await db.budget.deleteMany({ where: { userId } });
    // 4. Goals
    await db.goal.deleteMany({ where: { userId } });
    // 5. Recurring transactions (refs Merchant)
    await db.recurringTransaction.deleteMany();

    // 6. Get user's banks
    const banks = await db.bank.findMany({ where: { userId }, select: { id: true } });
    const bankIds = banks.map(b => b.id);

    if (bankIds.length > 0) {
      // 7. Staged transactions (refs Statement)
      const statements = await db.statement.findMany({ where: { bankId: { in: bankIds } }, select: { id: true } });
      const statementIds = statements.map(s => s.id);
      if (statementIds.length > 0) {
        await db.stagedTransaction.deleteMany({ where: { statementId: { in: statementIds } } });
      }
      // 8. Transactions (refs Statement, Bank, Merchant, Category)
      await db.transaction.deleteMany({ where: { bankId: { in: bankIds } } });
      // 9. Statements (refs Bank)
      await db.statement.deleteMany({ where: { bankId: { in: bankIds } } });
      // 10. Banks
      await db.bank.deleteMany({ where: { userId } });
    }

    // 11. Merchants (global, no FK from transactions anymore)
    await db.merchant.deleteMany();
    // 12. User categories (keep system)
    await db.category.deleteMany({ where: { userId, isSystem: false } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 });
  }
}
