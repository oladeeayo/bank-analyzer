import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyBatch } from "@/lib/classifier";
import { NormalizedTransaction } from "@/lib/normalizer";
import { getSessionUserId } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionIds } = body;

    // Get transactions to re-classify (only unclassified ones)
    const where = transactionIds && transactionIds.length > 0
      ? { id: { in: transactionIds }, bank: { userId } }
      : { bank: { userId }, categoryId: null };

    const transactions = await db.transaction.findMany({
      where,
      select: {
        id: true,
        date: true,
        description: true,
        normalizedDescription: true,
        amount: true,
        type: true,
        reference: true,
        narration: true,
        categoryId: true,
      },
      orderBy: { date: "asc" },
    });

    if (transactions.length === 0) {
      return NextResponse.json({ error: "No unclassified transactions found" }, { status: 404 });
    }

    // Convert to NormalizedTransaction format for the classifier
    const normalized: NormalizedTransaction[] = transactions.map(tx => ({
      date: tx.date.toISOString(),
      description: tx.normalizedDescription || tx.description,
      normalizedDescription: tx.normalizedDescription || tx.description,
      amount: tx.amount,
      type: tx.type as "debit" | "credit",
      reference: tx.reference || undefined,
      narration: tx.narration || undefined,
      merchantGuess: undefined,
      categoryGuess: undefined,
      counterpartyName: undefined,
      counterpartyBank: undefined,
      counterpartyAccount: undefined,
      isSelfTransfer: false,
    }));

    // Run classification
    const classifications = await classifyBatch(normalized, userId);

    // Update transactions with new classifications (only unclassified ones)
    let updatedCount = 0;
    for (let idx = 0; idx < transactions.length; idx++) {
      const tx = transactions[idx];
      const key = `${idx}_${tx.date.toISOString()}_${tx.normalizedDescription || tx.description}_${tx.amount}`;
      const classification = classifications.get(key);

      if (classification && (classification.merchantId || classification.categoryId)) {
        await db.transaction.update({
          where: { id: tx.id },
          data: {
            merchantId: classification.merchantId || null,
            categoryId: classification.categoryId || null,
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalTransactions: transactions.length,
      updatedCount,
      skippedCount: 0,
    });
  } catch (error: unknown) {
    console.error("Re-classify error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to re-classify transactions", details: errorMessage(error) },
      { status: 500 }
    );
  }
}
