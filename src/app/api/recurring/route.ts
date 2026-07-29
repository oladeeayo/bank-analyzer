import { NextResponse } from "next/server";
import { detectRecurringTransactions } from "@/lib/recurring-detector";
import { getSessionUserId } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patterns = await detectRecurringTransactions(userId);

    return NextResponse.json({ patterns });
  } catch (error: unknown) {
    console.error("Recurring detection error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to detect recurring transactions" },
      { status: 500 }
    );
  }
}
