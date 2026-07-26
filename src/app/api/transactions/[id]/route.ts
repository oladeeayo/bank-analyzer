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

    // Get the current transaction first
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

    // Save as manual override so future uploads remember this classification
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
        // Update existing override
        await db.manualOverride.update({
          where: { id: existingOverride.id },
          data: {
            merchantId: body.merchantId || existingOverride.merchantId,
            categoryId: body.categoryId || existingOverride.categoryId,
          },
        });
      } else {
        // Create new override (only requires userId + description)
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

    // Auto-classify similar transactions (same description pattern)
    if (body.merchantId || body.categoryId) {
      const similarTransactions = await db.transaction.findMany({
        where: {
          bank: { userId },
          id: { not: transaction.id },
          OR: [
            // Exact match
            { description: transaction.description },
            // Fuzzy match: description contains the edited text or vice versa
            { description: { contains: transaction.description, mode: "insensitive" } },
            { normalizedDescription: { contains: transaction.description, mode: "insensitive" } },
          ],
        },
        select: { id: true, description: true },
      });

      if (similarTransactions.length > 0) {
        await db.transaction.updateMany({
          where: {
            id: { in: similarTransactions.map(t => t.id) },
          },
          data: {
            merchantId: body.merchantId || undefined,
            categoryId: body.categoryId || undefined,
            normalizedDescription: body.normalizedDescription || undefined,
          },
        });
      }

      return NextResponse.json({
        transaction,
        updatedSimilarCount: similarTransactions.length,
      });
    }

    return NextResponse.json(transaction);
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
