import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const transactions = await db.transaction.findMany({
      where: { bank: { userId } },
      include: {
        bank: { select: { bankName: true } },
        merchant: { select: { displayName: true } },
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    const header = "Date,Description,Amount,Type,Merchant,Category,Bank,Reference\n";
    const rows = transactions.map(tx => {
      const date = tx.date.toISOString().split("T")[0];
      const desc = `"${tx.description.replace(/"/g, '""')}"`;
      const amount = tx.amount;
      const type = tx.type;
      const merchant = `"${(tx.merchant?.displayName || "").replace(/"/g, '""')}"`;
      const category = `"${(tx.category?.name || "").replace(/"/g, '""')}"`;
      const bank = `"${(tx.bank?.bankName || "").replace(/"/g, '""')}"`;
      const ref = `"${(tx.reference || "").replace(/"/g, '""')}"`;
      return `${date},${desc},${amount},${type},${merchant},${category},${bank},${ref}`;
    }).join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=transactions.csv",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
