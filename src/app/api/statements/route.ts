import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSessionUserId } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId");

    const where: Prisma.StatementWhereInput = {
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch statements", details: errorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const statement = await db.statement.findFirst({
      where: { id, bank: { userId } },
      include: { _count: { select: { transactions: true } } },
    });

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    const bankId = statement.bankId;

    await db.statement.delete({ where: { id } });

    // Clean up associated upload logs for this bank and filename
    await db.uploadLog.deleteMany({
      where: { bankId, filename: statement.filename },
    });

    // If the bank has no more statements, delete it too
    const remainingStatements = await db.statement.count({ where: { bankId } });
    if (remainingStatements === 0) {
      await db.bank.delete({ where: { id: bankId } });
    }

    return NextResponse.json({
      success: true,
      deleted: { id, transactionCount: statement._count.transactions },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to delete statement", details: errorMessage(error) },
      { status: 500 }
    );
  }
}
