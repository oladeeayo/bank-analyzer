import { NextRequest, NextResponse } from "next/server";
import { batchClassify, findSimilarGroups } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, transactions } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "transactions array required" },
        { status: 400 }
      );
    }

    // Limit batch size
    const limitedTransactions = transactions.slice(0, 50);

    if (action === "classify") {
      const results = await batchClassify(limitedTransactions);
      return NextResponse.json({ results });
    }

    if (action === "similar") {
      const groups = await findSimilarGroups(limitedTransactions);
      return NextResponse.json({ groups });
    }

    if (action === "both") {
      const [results, groups] = await Promise.all([
        batchClassify(limitedTransactions),
        findSimilarGroups(limitedTransactions),
      ]);
      return NextResponse.json({ results, groups });
    }

    return NextResponse.json(
      { error: "action must be 'classify', 'similar', or 'both'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("AI classify error:", error);
    return NextResponse.json(
      { error: error.message || "AI classification failed" },
      { status: 500 }
    );
  }
}
