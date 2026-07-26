import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const merchant = await db.merchant.update({
      where: { id },
      data: {
        displayName: body.displayName || undefined,
        icon: body.icon || undefined,
        color: body.color || undefined,
      },
    });

    return NextResponse.json(merchant);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update merchant" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.merchant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete merchant" }, { status: 500 });
  }
}
