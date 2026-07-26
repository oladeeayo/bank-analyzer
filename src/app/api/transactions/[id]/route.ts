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

    const transaction = await db.transaction.update({
      where: { id },
      data: body,
      include: {
        bank: true,
        merchant: true,
        category: true,
      },
    });

    // If merchant or category was updated, save as manual override
    if (body.merchantId || body.categoryId) {
      const existingOverride = await db.manualOverride.findFirst({
        where: { description: transaction.description },
      });

      if (existingOverride) {
        await db.manualOverride.update({
          where: { id: existingOverride.id },
          data: {
            merchantId: body.merchantId || existingOverride.merchantId,
            categoryId: body.categoryId || existingOverride.categoryId,
          },
        });
      } else if (body.merchantId && body.categoryId) {
        await db.manualOverride.create({
          data: {
            description: transaction.description,
            merchantId: body.merchantId,
            categoryId: body.categoryId,
          },
        });
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
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