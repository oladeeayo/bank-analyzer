import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function wordsMatch(desc1: string, desc2: string): { score: number; matchedWords: string[] } {
  const words1 = normalizeForMatch(desc1).split(" ").filter(w => w.length > 2);
  const words2 = normalizeForMatch(desc2).split(" ").filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return { score: 0, matchedWords: [] };

  const matchedWords: string[] = [];
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matchedWords.push(w1);
        break;
      }
    }
  }

  return { score: matchedWords.length, matchedWords };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        bank: true,
        merchant: true,
        category: true,
        statement: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const currentTx = await db.transaction.findUnique({
      where: { id },
      include: { bank: { select: { userId: true } } },
    });

    if (!currentTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const userId = currentTx.bank.userId;

    // Update the transaction
    const transaction = await db.transaction.update({
      where: { id },
      data: {
        merchantId: body.merchantId || undefined,
        categoryId: body.categoryId || undefined,
        normalizedDescription: body.normalizedDescription || undefined,
        isTransfer: body.isTransfer || undefined,
        isSelfTransfer: body.isSelfTransfer || undefined,
      },
      include: {
        bank: true,
        merchant: true,
        category: true,
      },
    });

    // Save manual override for future uploads
    if (body.merchantId || body.categoryId) {
      const existingOverride = await db.manualOverride.findUnique({
        where: {
          userId_description: {
            userId,
            description: transaction.description,
          },
        },
      });

      if (existingOverride) {
        await db.manualOverride.update({
          where: { id: existingOverride.id },
          data: {
            merchantId: body.merchantId || existingOverride.merchantId,
            categoryId: body.categoryId || existingOverride.categoryId,
          },
        });
      } else {
        await db.manualOverride.create({
          data: {
            userId,
            description: transaction.description,
            merchantId: body.merchantId || null,
            categoryId: body.categoryId || null,
          },
        });
      }
    }

    // Auto-classify similar transactions
    let updatedSimilarCount = 0;
    if (body.merchantId || body.categoryId || body.normalizedDescription) {
      // Find all transactions by this user
      const allTxs = await db.transaction.findMany({
        where: {
          bank: { userId },
          id: { not: transaction.id },
        },
        select: { id: true, description: true, normalizedDescription: true, type: true },
      });

      // Find similar transactions by description matching
      const similarIds: string[] = [];
      for (const tx of allTxs) {
        const { score } = wordsMatch(transaction.description, tx.description);
        // At least 2 words match, or exact same description
        if (score >= 2 || normalizeForMatch(tx.description) === normalizeForMatch(transaction.description)) {
          similarIds.push(tx.id);
        }
      }

      // Also find same merchant transfers (debit to same credit pattern)
      if (body.merchantId) {
        const merchantTxs = allTxs.filter(tx => !similarIds.includes(tx.id));
        for (const tx of merchantTxs) {
          const { score } = wordsMatch(
            transaction.normalizedDescription || transaction.description,
            tx.normalizedDescription || tx.description
          );
          if (score >= 2) {
            similarIds.push(tx.id);
          }
        }
      }

      if (similarIds.length > 0) {
        await db.transaction.updateMany({
          where: { id: { in: similarIds } },
          data: {
            merchantId: body.merchantId || undefined,
            categoryId: body.categoryId || undefined,
            normalizedDescription: body.normalizedDescription || undefined,
          },
        });
        updatedSimilarCount = similarIds.length;
      }
    }

    return NextResponse.json({
      transaction,
      updatedSimilarCount,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
