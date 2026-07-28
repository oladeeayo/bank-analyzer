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
    const lastDate = new Date(result.transactions[result.transactions.length - 1].date);
    const month = firstDate.getMonth() + 1;
    const year = firstDate.getFullYear();

    // Check for existing statements with overlapping dates
    const existingStatements = await db.statement.findMany({
      where: {
        bankId,
        OR: [
          { month, year },
          { AND: [{ year: { lte: lastDate.getFullYear() } }, { year: { gte: firstDate.getFullYear() } }] },
        ],
      },
      include: {
        transactions: {
          select: { date: true, amount: true, description: true },
          orderBy: { date: "asc" },
        },
      },
    });

    // Find statements with overlapping date ranges
    const overlapping = existingStatements.filter(s => {
      const stmtStart = new Date(s.year, s.month - 1, 1);
      const stmtEnd = new Date(s.year, s.month, 0, 23, 59, 59);
      return firstDate <= stmtEnd && lastDate >= stmtStart;
    });

    if (overlapping.length > 0) {
      // Check if all transactions already exist
      const existingDates = new Set(
        overlapping.flatMap(s => s.transactions.map(t => `${t.date.toISOString().split("T")[0]}_${t.amount}_${t.description.substring(0, 30)}`))
      );

      const newTransactions = result.transactions.filter(tx => {
        const txDate = new Date(tx.date).toISOString().split("T")[0];
        const key = `${txDate}_${tx.amount}_${tx.description.substring(0, 30)}`;
        return !existingDates.has(key);
      });

      const totalExisting = overlapping.reduce((sum, s) => sum + s.transactions.length, 0);

      if (newTransactions.length === 0) {
        return NextResponse.json(
          {
            error: "duplicate",
            message: `This statement appears to be a duplicate. ${totalExisting} transactions already exist for this date range.`,
            existingStatements: overlapping.map(s => ({
              id: s.id,
              month: s.month,
              year: s.year,
              transactionCount: s.transactionCount,
              filename: s.filename,
            })),
            options: ["cancel", "replace"],
          },
          { status: 409 }
        );
      }

      // Some new transactions found - offer merge
      return NextResponse.json(
        {
          error: "partial_overlap",
          message: `Found ${newTransactions.length} new transactions. ${totalExisting} already exist from overlapping statements.`,
          existingStatements: overlapping.map(s => ({
            id: s.id,
            month: s.month,
            year: s.year,
            transactionCount: s.transactionCount,
            filename: s.filename,
          })),
          newTransactionCount: newTransactions.length,
          options: ["merge", "replace", "cancel"],
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
        memo: tx.memo || null,
        institution: tx.institution || null,
        accountOrPhone: tx.accountOrPhone || null,
        channelTag: tx.channelTag || null,
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

    // Calculate summary stats
    const totalCredits = normalized.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const totalDebits = normalized.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const dateRange = {
      from: normalized.length > 0 ? normalized.reduce((min, t) => t.date < min ? t.date : min, normalized[0].date) : null,
      to: normalized.length > 0 ? normalized.reduce((max, t) => t.date > max ? t.date : max, normalized[0].date) : null,
    };

    return NextResponse.json({
      statement,
      transactionCount: normalized.length,
      errorCount: result.errors.length,
      errors: result.errors.slice(0, 10),
      summary: {
        totalCredits,
        totalDebits,
        netCashFlow: totalCredits - totalDebits,
        transactionCount: normalized.length,
        dateRange,
        classifiedCount: transactionData.filter(t => t.merchantId || t.categoryId).length,
      },
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