import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionIds, categoryId, merchantId } = body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "transactionIds array is required" },
        { status: 400 }
      );
    }

    // Verify all transactions belong to this user
    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        bank: { userId },
      },
      select: { id: true, description: true },
    });

    if (transactions.length !== transactionIds.length) {
      return NextResponse.json(
        { error: "Some transactions not found or not owned by user" },
        { status: 403 }
      );
    }

    // Batch update
    const updateData: Record<string, unknown> = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (merchantId) updateData.merchantId = merchantId;

    const result = await db.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: updateData,
    });

    // Create manual overrides for each unique description
    if (categoryId || merchantId) {
      const uniqueDescriptions = [...new Set(transactions.map(t => t.description))];

      for (const desc of uniqueDescriptions) {
        const existing = await db.manualOverride.findUnique({
          where: { userId_description: { userId, description: desc } },
        });

        if (existing) {
          await db.manualOverride.update({
            where: { id: existing.id },
            data: {
              merchantId: merchantId || existing.merchantId,
              categoryId: categoryId || existing.categoryId,
            },
          });
        } else {
          await db.manualOverride.create({
            data: {
              userId,
              description: desc,
              merchantId: merchantId || null,
              categoryId: categoryId || null,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Batch update error:", error);
    return NextResponse.json({ error: "Failed to batch update" }, { status: 500 });
  }
}
