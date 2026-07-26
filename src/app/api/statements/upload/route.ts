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

    // Check for existing statement (duplicate detection)
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

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

    // Parse the file
    const arrayBuffer = await file.arrayBuffer();
    const result = await parseStatement(arrayBuffer, file.name);

    if (result.transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found", errors: result.errors },
        { status: 400 }
      );
    }

    // Normalize transactions
    const normalized = normalizeTransactions(result.transactions);

    // Classify transactions
    const classifications = await classifyBatch(normalized, userId);

    // Create statement record
    const statement = await db.statement.create({
      data: {
        bankId,
        month,
        year,
        filename: file.name,
        fileType: file.name.split(".").pop() || "csv",
        transactionCount: normalized.length,
      },
    });

    // Create transactions
    const transactionPromises = normalized.map(async (tx, idx) => {
      const key = `${tx.date}_${tx.description}_${tx.amount}`;
      const classification = classifications.get(key);

      return db.transaction.create({
        data: {
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
        },
      });
    });

    await Promise.all(transactionPromises);

    // Update statement status
    await db.statement.update({
      where: { id: statement.id },
      data: { status: "completed" },
    });

    return NextResponse.json({
      statement,
      transactionCount: normalized.length,
      errorCount: result.errors.length,
      errors: result.errors.slice(0, 10), // First 10 errors
    }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to upload statement", details: error?.message },
      { status: 500 }
    );
  }
}