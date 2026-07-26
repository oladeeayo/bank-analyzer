import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseStatement } from "@/lib/parsers";
import { normalizeTransactions } from "@/lib/normalizer";
import { classifyBatch } from "@/lib/classifier";

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

    // Parse the file first (fast, no DB calls) before checking duplicates
    const arrayBuffer = await file.arrayBuffer();
    const result = await parseStatement(arrayBuffer, file.name);

    if (result.transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found", errors: result.errors },
        { status: 400 }
      );
    }

    // Determine statement month/year from first transaction date
    const firstDate = new Date(result.transactions[0].date);
    const month = firstDate.getMonth() + 1;
    const year = firstDate.getFullYear();

    // Check for existing statement (duplicate detection)
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

    // Normalize transactions
    const normalized = normalizeTransactions(result.transactions);

    // Classify transactions (optimized: single query for rules/merchants/categories)
    const classifications = await classifyBatch(normalized, userId);

    // Create statement and transactions in a single DB operation
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

    // Batch create all transactions in one query
    const transactionData = normalized.map((tx, idx) => {
      // Use index-based key to match classifier (avoids collisions for same-day same-amount)
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
    }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to upload statement", details: error?.message },
      { status: 500 }
    );
  }
}