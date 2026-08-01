import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { notes, tags } = body;

  const transaction = await db.transaction.update({
    where: { id },
    data: {
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    },
  });

  return NextResponse.json({ transaction });
}
