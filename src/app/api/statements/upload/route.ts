import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseStatement } from "@/lib/parsers";
import { normalizeTransactions } from "@/lib/normalizer";
import { classifyBatch } from "@/lib/classifier";
import { extractCounterpartyInfo, groupSimilarTransactions } from "@/lib/counterparty-matcher";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bankId = formData.get("bankId") as string;
    const userId = formData.get("userId") as string;

    if (!file || !bankId || !userId) {
      return NextResponse.json(
        { error: "file, bankId, and userId are required" },
        { status: 400 }
      );
    }

    // Get user's own account names for self-transfer detection
    const userBanks = await db.bank.findMany({
      where: { userId },
      select: { accountName: true, bankName: true, accountNumber: true },
    });
    const userOwnNames = userBanks
      .map(b => b.accountName)
      .filter((n): n is string => !!n);

    // Parse the file
    const arrayBuffer = await file.arrayBuffer();
    const result = await parseStatement(arrayBuffer, file.name);

    if (result.transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found", errors: result.errors },
        { status: 400 }
      );
    }

    const firstDate = new Date(result.transactions[0].date);
    const month = firstDate.getMonth() + 1;
    const year = firstDate.getFullYear();

    const existing = await db.statement.findFirst({
      where: { bankId, month, year },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Statement already exists for this month",
          existingStatement: existing,
          options: ["replace", "merge", "cancel"],
        },
        { status: 409 }
      );
    }

    // Normalize with counterparty extraction
    const normalized = normalizeTransactions(result.transactions, userOwnNames);

    // Classify transactions
    const classifications = await classifyBatch(normalized, userId);

    // Find similar counterparty groups using trinity matching
    const descriptions = normalized.map(tx => tx.description);
    const similarGroups = groupSimilarTransactions(descriptions, userOwnNames);

    // Create statement
    const statement = await db.statement.create({
      data: {
        bankId,
        month,
        year,
        filename: file.name,
        fileType: file.name.split(".").pop() || "csv",
        transactionCount: normalized.length,
        status: "completed",
      },
    });

    const transactionData = normalized.map((tx, idx) => {
      const key = `${idx}_${tx.date}_${tx.description}_${tx.amount}`;
      const classification = classifications.get(key);

      return {
        statementId: statement.id,
        bankId,
        date: new Date(tx.date),
        description: tx.description,
        normalizedDescription: tx.normalizedDescription,
        amount: tx.amount,
        type: tx.type,
        balance: tx.balance,
        reference: tx.reference,
        narration: tx.narration,
        merchantId: classification?.merchantId || null,
        categoryId: classification?.categoryId || null,
      };
    });

    await db.transaction.createMany({ data: transactionData });

    return NextResponse.json({
      statement,
      transactionCount: normalized.length,
      errorCount: result.errors.length,
      errors: result.errors.slice(0, 10),
      counterpartyGroups: similarGroups.map(g => ({
        groupId: g.groupId,
        counterpartyName: g.counterpartyName,
        transactionCount: g.transactionCount,
        direction: g.direction,
        transactionIndices: g.transactionIndices,
      })),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to upload statement", details: error?.message },
      { status: 500 }
    );
  }
}