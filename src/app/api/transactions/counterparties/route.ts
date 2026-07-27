import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractCounterpartyInfo, groupSimilarTransactions } from "@/lib/counterparty-matcher";

interface CounterpartySummary {
  counterpartyName: string;
  normalizedName: string;
  aliases: string[];
  knownBanks: { name: string; accountNumber?: string }[];
  direction: string;
  totalAmount: number;
  transactionCount: number;
  transactionIds: string[];
  firstDate: string | null;
  lastDate: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bankId = searchParams.get("bankId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const where: any = { bank: { userId } };
    if (bankId) where.bankId = bankId;

    const transactions = await db.transaction.findMany({
      where,
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
      },
      orderBy: { date: "desc" },
    });

    if (transactions.length === 0) {
      return NextResponse.json({ counterparties: [], totalTransactions: 0 });
    }

    // Get user's own account names
    const userBanks = await db.bank.findMany({
      where: { userId },
      select: { accountName: true },
    });
    const userOwnNames = userBanks
      .map(b => b.accountName)
      .filter((n): n is string => !!n);

    // Group similar transactions
    const descriptions = transactions.map(tx => tx.description);
    const groups = groupSimilarTransactions(descriptions, userOwnNames);

    // Build summary for each group
    const counterparties: CounterpartySummary[] = groups.map(group => {
      const groupTxs = group.transactionIndices.map(idx => transactions[idx]);
      const extracted = extractCounterpartyInfo(group.counterpartyName, userOwnNames);

      let totalAmount = 0;
      let direction = "mixed";
      let creditCount = 0, debitCount = 0;

      for (const tx of groupTxs) {
        totalAmount += tx.amount;
        if (tx.type === "credit") creditCount++;
        else debitCount++;
      }

      if (creditCount > 0 && debitCount === 0) direction = "credit";
      else if (debitCount > 0 && creditCount === 0) direction = "debit";

      const dates = groupTxs.map(tx => new Date(tx.date));
      const firstDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null;
      const lastDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null;

      return {
        counterpartyName: group.counterpartyName,
        normalizedName: group.normalizedName,
        aliases: [group.counterpartyName],
        knownBanks: extracted.bank ? [{ name: extracted.bank, accountNumber: extracted.accountNumber }] : [],
        direction,
        totalAmount,
        transactionCount: group.transactionCount,
        transactionIds: groupTxs.map(tx => tx.id),
        firstDate,
        lastDate,
      };
    });

    return NextResponse.json({
      counterparties: counterparties.sort((a, b) => b.transactionCount - a.transactionCount),
      totalTransactions: transactions.length,
      totalCounterparties: counterparties.length,
    });
  } catch (error) {
    console.error("Counterparty grouping error:", error);
    return NextResponse.json({ error: "Failed to group counterparties" }, { status: 500 });
  }
}
