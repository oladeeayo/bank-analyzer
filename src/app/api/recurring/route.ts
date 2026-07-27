import { NextRequest, NextResponse } from "next/server";
import { detectRecurringTransactions } from "@/lib/recurring-detector";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const patterns = await detectRecurringTransactions(userId);

    return NextResponse.json({ patterns });
  } catch (error: any) {
    console.error("Recurring detection error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to detect recurring transactions" },
      { status: 500 }
    );
  }
}
