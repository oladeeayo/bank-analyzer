import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bankId = searchParams.get("bankId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const where: any = {
      bank: { userId },
    };
    if (bankId) where.bankId = bankId;

    const statements = await db.statement.findMany({
      where,
      include: {
        bank: { select: { id: true, bankName: true, nickname: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(
      statements.map((s) => ({
        id: s.id,
        bankId: s.bankId,
        bankName: s.bank.nickname || s.bank.bankName,
        month: s.month,
        year: s.year,
        filename: s.filename,
        fileType: s.fileType,
        status: s.status,
        transactionCount: s._count.transactions,
        uploadedAt: s.uploadedAt.toISOString(),
      }))
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch statements", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 });
    }

    const statement = await db.statement.findFirst({
      where: { id, bank: { userId } },
      include: { _count: { select: { transactions: true } } },
    });

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    await db.statement.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      deleted: { id, transactionCount: statement._count.transactions },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete statement", details: error?.message },
      { status: 500 }
    );
  }
}
