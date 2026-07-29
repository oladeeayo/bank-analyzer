import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeTransactions } from "@/lib/normalizer";
import { classifyBatch } from "@/lib/classifier";
import { getSessionUserId } from "@/lib/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the statement
    const statement = await db.statement.findUnique({
      where: { id },
      include: {
        bank: { select: { userId: true } },
        transactions: true,
      },
    });

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    if (statement.bank.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Re-normalize existing transactions
    const parsedTxs = statement.transactions.map(tx => ({
      date: tx.date.toISOString(),
      description: tx.description,
      amount: tx.amount,
      type: tx.type as "debit" | "credit",
      balance: tx.balance || undefined,
      reference: tx.reference || undefined,
      narration: tx.narration || undefined,
    }));

    const normalized = normalizeTransactions(parsedTxs);

    // Re-classify with current rules/overrides
    const classifications = await classifyBatch(normalized, userId);

    // Update each transaction with new classification
    let updatedCount = 0;
    for (let i = 0; i < statement.transactions.length; i++) {
      const tx = statement.transactions[i];
      const norm = normalized[i];
      const key = `${i}_${norm.date}_${norm.description}_${norm.amount}`;
      const classification = classifications.get(key);

      if (classification) {
        await db.transaction.update({
          where: { id: tx.id },
          data: {
            merchantId: classification.merchantId,
            categoryId: classification.categoryId,
            normalizedDescription: norm.normalizedDescription,
            memo: norm.memo || null,
            institution: norm.institution || null,
            accountOrPhone: norm.accountOrPhone || null,
            channelTag: norm.channelTag || null,
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      reprocessedCount: updatedCount,
    });
  } catch (error) {
    console.error("Reprocess error:", error);
    return NextResponse.json({ error: "Failed to reprocess statement" }, { status: 500 });
  }
}
