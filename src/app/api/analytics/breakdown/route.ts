import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface MonthData {
  year: number;
  month: number;
  credits: number;
  debits: number;
  count: number;
}

interface GroupEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
  months: MonthData[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const groupBy = searchParams.get("groupBy") || "merchant";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!["merchant", "category", "subcategory"].includes(groupBy)) {
      return NextResponse.json({ error: "groupBy must be merchant, category, or subcategory" }, { status: 400 });
    }

    const banks = await db.bank.findMany({
      where: { userId },
      select: { id: true },
    });
    const bankIds = banks.map(b => b.id);

    const transactions = await db.transaction.findMany({
      where: { bankId: { in: bankIds } },
      select: {
        id: true,
        amount: true,
        type: true,
        date: true,
        merchantId: true,
        categoryId: true,
        merchant: { select: { id: true, displayName: true, icon: true, color: true } },
        category: { select: { id: true, name: true, icon: true, color: true, parentId: true, parent: { select: { id: true, name: true, icon: true, color: true } } } },
      },
      orderBy: { date: "asc" },
    });

    if (groupBy === "merchant") {
      const groups = new Map<string, GroupEntry>();

      for (const tx of transactions) {
        if (!tx.merchant) continue;
        const m = tx.merchant;
        const key = m.id;

        if (!groups.has(key)) {
          groups.set(key, {
            id: m.id,
            name: m.displayName,
            icon: m.icon,
            color: m.color,
            totalCredits: 0,
            totalDebits: 0,
            netAmount: 0,
            transactionCount: 0,
            months: [],
          });
        }

        const g = groups.get(key)!;
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (tx.type === "credit") g.totalCredits += tx.amount;
        else g.totalDebits += tx.amount;
        g.transactionCount++;

        let monthEntry = g.months.find(m => m.year === year && m.month === month);
        if (!monthEntry) {
          monthEntry = { year, month, credits: 0, debits: 0, count: 0 };
          g.months.push(monthEntry);
        }
        if (tx.type === "credit") monthEntry.credits += tx.amount;
        else monthEntry.debits += tx.amount;
        monthEntry.count++;
      }

      for (const g of groups.values()) {
        g.netAmount = g.totalCredits - g.totalDebits;
        g.months.sort((a, b) => a.year - b.year || a.month - b.month);
      }

      return NextResponse.json({
        groupBy: "merchant",
        groups: Array.from(groups.values()).sort((a, b) => (b.totalCredits + b.totalDebits) - (a.totalCredits + a.totalDebits)),
      });
    }

    if (groupBy === "category") {
      const groups = new Map<string, GroupEntry>();

      for (const tx of transactions) {
        if (!tx.category || tx.category.parentId) continue;
        const c = tx.category;
        const key = c.id;

        if (!groups.has(key)) {
          groups.set(key, {
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            totalCredits: 0,
            totalDebits: 0,
            netAmount: 0,
            transactionCount: 0,
            months: [],
          });
        }

        const g = groups.get(key)!;
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (tx.type === "credit") g.totalCredits += tx.amount;
        else g.totalDebits += tx.amount;
        g.transactionCount++;

        let monthEntry = g.months.find(m => m.year === year && m.month === month);
        if (!monthEntry) {
          monthEntry = { year, month, credits: 0, debits: 0, count: 0 };
          g.months.push(monthEntry);
        }
        if (tx.type === "credit") monthEntry.credits += tx.amount;
        else monthEntry.debits += tx.amount;
        monthEntry.count++;
      }

      for (const g of groups.values()) {
        g.netAmount = g.totalCredits - g.totalDebits;
        g.months.sort((a, b) => a.year - b.year || a.month - b.month);
      }

      return NextResponse.json({
        groupBy: "category",
        groups: Array.from(groups.values()).sort((a, b) => (b.totalCredits + b.totalDebits) - (a.totalCredits + a.totalDebits)),
      });
    }

    if (groupBy === "subcategory") {
      const groups = new Map<string, GroupEntry>();

      for (const tx of transactions) {
        if (!tx.category || !tx.category.parentId) continue;
        const c = tx.category;
        const parent = tx.category.parent;
        const key = c.id;
        const label = parent ? `${parent.name} → ${c.name}` : c.name;

        if (!groups.has(key)) {
          groups.set(key, {
            id: c.id,
            name: label,
            icon: c.icon,
            color: c.color,
            totalCredits: 0,
            totalDebits: 0,
            netAmount: 0,
            transactionCount: 0,
            months: [],
          });
        }

        const g = groups.get(key)!;
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (tx.type === "credit") g.totalCredits += tx.amount;
        else g.totalDebits += tx.amount;
        g.transactionCount++;

        let monthEntry = g.months.find(m => m.year === year && m.month === month);
        if (!monthEntry) {
          monthEntry = { year, month, credits: 0, debits: 0, count: 0 };
          g.months.push(monthEntry);
        }
        if (tx.type === "credit") monthEntry.credits += tx.amount;
        else monthEntry.debits += tx.amount;
        monthEntry.count++;
      }

      for (const g of groups.values()) {
        g.netAmount = g.totalCredits - g.totalDebits;
        g.months.sort((a, b) => a.year - b.year || a.month - b.month);
      }

      return NextResponse.json({
        groupBy: "subcategory",
        groups: Array.from(groups.values()).sort((a, b) => (b.totalCredits + b.totalDebits) - (a.totalCredits + a.totalDebits)),
      });
    }

    return NextResponse.json({ groupBy, groups: [] });
  } catch (error) {
    console.error("Breakdown error:", error);
    return NextResponse.json({ error: "Failed to fetch breakdown" }, { status: 500 });
  }
}
