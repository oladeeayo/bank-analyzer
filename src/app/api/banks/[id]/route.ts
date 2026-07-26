import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bank = await db.bank.findUnique({
      where: { id },
      include: {
        statements: { orderBy: { uploadedAt: "desc" } },
        _count: { select: { transactions: true } },
      },
    });

    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    }

    return NextResponse.json(bank);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bank" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const bank = await db.bank.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(bank);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update bank" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.bank.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete bank" }, { status: 500 });
  }
}