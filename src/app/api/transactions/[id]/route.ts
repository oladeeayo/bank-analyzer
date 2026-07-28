import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    let finalMerchantId = body.merchantId || null;

    // If a new merchant name was typed, find or create the merchant
    if (body.normalizedDescription && body.normalizedDescription.trim()) {
      const newName = body.normalizedDescription.trim();
      const normalizedName = newName.toLowerCase().replace(/\s+/g, "_");

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
        const existing = await db.merchant.findUnique({
          where: { normalizedName },
          select: { id: true },
        });

        if (existing) {
          finalMerchantId = existing.id;
        } else {
          const created = await db.merchant.create({
            data: {
              normalizedName,
              displayName: newName,
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
    if (body.normalizedDescription) updateData.normalizedDescription = body.normalizedDescription;
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

    // Save manual override for future uploads
    if (finalMerchantId || body.categoryId) {
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
            merchantId: finalMerchantId || existingOverride.merchantId,
            categoryId: body.categoryId || existingOverride.categoryId,
          },
        });
      } else {
        await db.manualOverride.create({
          data: {
            userId,
            description: transaction.description,
            merchantId: finalMerchantId || null,
            categoryId: body.categoryId || null,
          },
        });
      }

      // Auto-create a classification rule from the merchant/counterparty name
      if (body.categoryId && finalMerchantId) {
        const merchant = await db.merchant.findUnique({
          where: { id: finalMerchantId },
          select: { displayName: true },
        });

        if (merchant) {
          const pattern = merchant.displayName.toLowerCase().trim();
          if (pattern.length >= 3) {
            const existingRule = await db.classificationRule.findFirst({
              where: {
                userId,
                pattern,
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
                  name: merchant.displayName,
                  type: "contains",
                  pattern,
                  merchantId: finalMerchantId,
                  categoryId: body.categoryId,
                  priority: (maxPriority._max.priority || 0) + 1,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      transaction,
      updatedSimilarCount: 0,
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
