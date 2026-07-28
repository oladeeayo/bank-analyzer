import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractCounterparty } from "@/lib/classifier/nigerian-context";
import { ExactMerchantExtractor } from "@/lib/parser/merchant-extractor";

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

function sanitizePattern(description: string): string {
  return description
    .toLowerCase()
    .replace(/^(transfer\s+(to|from)|send\s+to|received?\s+from|payment\s+to|funded\s+by)\s+/i, "")
    .replace(/\s*\|.*/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

    // Extract counterparty from the description
    const extracted = extractCounterparty(body.normalizedDescription || currentTx.description);
    const counterpartyName = extracted.counterparty || body.normalizedDescription || null;

    let finalMerchantId = body.merchantId || null;

    // If a counterparty was extracted or merchant name was provided, find or create
    const merchantName = counterpartyName || (body.normalizedDescription && body.normalizedDescription.trim()) || null;
    if (merchantName) {
      const normalizedName = merchantName.toLowerCase().replace(/[^a-z0-9]/g, "_");

      if (finalMerchantId) {
        const currentMerchant = await db.merchant.findUnique({
          where: { id: finalMerchantId },
          select: { normalizedName: true },
        });
        if (currentMerchant && currentMerchant.normalizedName !== normalizedName) {
          finalMerchantId = null;
        }
      }

      if (!finalMerchantId) {
        const existing = await db.merchant.findFirst({
          where: { normalizedName },
          select: { id: true },
        });

        if (existing) {
          finalMerchantId = existing.id;
        } else {
          const created = await db.merchant.create({
            data: {
              normalizedName,
              displayName: merchantName,
            },
            select: { id: true },
          });
          finalMerchantId = created.id;
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (finalMerchantId !== undefined) updateData.merchantId = finalMerchantId;
    if (body.categoryId) updateData.categoryId = body.categoryId;
    if (counterpartyName) updateData.normalizedDescription = counterpartyName;
    if (body.isTransfer !== undefined) updateData.isTransfer = body.isTransfer;
    if (body.isSelfTransfer !== undefined) updateData.isSelfTransfer = body.isSelfTransfer;

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: {
        bank: true,
        merchant: true,
        category: true,
      },
    });

    // Active Learning: Save manual override + auto-create rule + backfill
    if (finalMerchantId || body.categoryId) {
      // Compute normalized key for override matching
      const extraction = ExactMerchantExtractor.process(transaction.description);
      const normKey = extraction.normalizedKey || null;

      // 1. Save manual override (use normalizedKey as primary match key)
      const existingOverride = await db.manualOverride.findFirst({
        where: {
          userId,
          OR: [
            { normalizedKey: normKey },
            { description: transaction.description },
          ],
        },
      });

      if (existingOverride) {
        await db.manualOverride.update({
          where: { id: existingOverride.id },
          data: {
            merchantId: finalMerchantId || existingOverride.merchantId,
            categoryId: body.categoryId || existingOverride.categoryId,
            normalizedKey: normKey,
          },
        });
      } else {
        await db.manualOverride.create({
          data: {
            userId,
            description: transaction.description,
            normalizedKey: normKey,
            merchantId: finalMerchantId || null,
            categoryId: body.categoryId || null,
          },
        });
      }

      // 2. Create sanitized classification rule for future imports
      if (body.categoryId && merchantName) {
        const cleanPattern = sanitizePattern(transaction.description);

        if (cleanPattern.length >= 3) {
          const existingRule = await db.classificationRule.findFirst({
            where: {
              userId,
              pattern: cleanPattern,
              categoryId: body.categoryId,
            },
          });

          if (!existingRule) {
            const maxPriority = await db.classificationRule.aggregate({
              where: { userId },
              _max: { priority: true },
            });

            await db.classificationRule.create({
              data: {
                userId,
                name: merchantName,
                type: "contains",
                pattern: cleanPattern,
                merchantId: finalMerchantId,
                categoryId: body.categoryId,
                priority: (maxPriority._max.priority || 0) + 1,
              },
            });
          }
        }
      }

      // 3. Backfill: Update all past uncategorized transactions matching this counterparty
      let backfillCount = 0;
      if (counterpartyName && body.categoryId) {
        const backfillResult = await db.transaction.updateMany({
          where: {
            bank: { userId },
            id: { not: id },
            OR: [
              { categoryId: null },
              { category: { name: "Others" } },
            ],
            description: {
              contains: counterpartyName,
              mode: "insensitive",
            },
          },
          data: {
            merchantId: finalMerchantId || undefined,
            categoryId: body.categoryId,
          },
        });
        backfillCount = backfillResult.count;
      }

      return NextResponse.json({
        transaction,
        updatedSimilarCount: backfillCount,
      });
    }

    return NextResponse.json({ transaction, updatedSimilarCount: 0 });
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
