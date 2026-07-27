import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractCounterpartyInfo, namesMatchForGrouping } from "@/lib/counterparty-matcher";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const txId = searchParams.get("txId");

    if (!userId || !txId) {
      return NextResponse.json(
        { error: "userId and txId are required" },
        { status: 400 }
      );
    }

    const [targetTx, allTransactions] = await Promise.all([
      db.transaction.findFirst({
        where: { id: txId, bank: { userId } },
        select: { id: true, description: true, amount: true, type: true, date: true },
      }),
      db.transaction.findMany({
        where: { bank: { userId } },
        select: { id: true, description: true, amount: true, type: true, date: true },
      }),
    ]);

    if (!targetTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const userBanks = await db.bank.findMany({
      where: { userId },
      select: { accountName: true },
    });
    const userOwnNames = userBanks
      .map(b => b.accountName)
      .filter((n): n is string => !!n);

    const targetInfo = extractCounterpartyInfo(targetTx.description, userOwnNames);

    if (!targetInfo.name) {
      return NextResponse.json({ similar: [], reason: "Could not extract counterparty from this transaction" });
    }

    const similar: Array<{
      id: string;
      description: string;
      amount: number;
      type: string;
      date: string;
      matchReason: string;
    }> = [];

    for (const other of allTransactions) {
      if (other.id === targetTx.id) continue;

      const otherInfo = extractCounterpartyInfo(other.description, userOwnNames);
      if (!otherInfo.name) continue;

      if (namesMatchForGrouping(targetInfo, otherInfo)) {
        let reason = "";
        if (targetInfo.accountNumber && otherInfo.accountNumber && targetInfo.accountNumber === otherInfo.accountNumber) {
          reason = `Same account: ${targetInfo.accountNumber}`;
        } else if (
          targetInfo.partialAccountNumber && otherInfo.partialAccountNumber &&
          targetInfo.partialAccountNumber === otherInfo.partialAccountNumber
        ) {
          reason = `Same bank account last 4: **${targetInfo.partialAccountNumber}`;
        } else if (targetInfo.normalizedName === otherInfo.normalizedName) {
          reason = `Same name: ${targetInfo.name}`;
        } else {
          reason = `Similar: ${targetInfo.name} ↔ ${otherInfo.name}`;
        }

        similar.push({
          id: other.id,
          description: other.description,
          amount: other.amount,
          type: other.type,
          date: other.date.toISOString(),
          matchReason: reason,
        });
      }
    }

    similar.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      target: {
        id: targetTx.id,
        description: targetTx.description,
        counterpartyName: targetInfo.name,
        normalizedName: targetInfo.normalizedName,
        bank: targetInfo.bank,
        account: targetInfo.accountNumber || targetInfo.partialAccountNumber,
        direction: targetInfo.direction,
      },
      similar,
      totalSimilar: similar.length,
    });
  } catch (error) {
    console.error("Similar transactions error:", error);
    return NextResponse.json({ error: "Failed to find similar transactions" }, { status: 500 });
  }
}
