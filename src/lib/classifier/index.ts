import { db } from "@/lib/db";
import { NormalizedTransaction } from "@/lib/normalizer";

export interface ClassificationResult {
  merchantId: string | null;
  categoryId: string | null;
  confidence: number;
  source: "rule" | "override" | "merchant" | "pattern" | "none";
}

export async function classifyTransaction(
  tx: NormalizedTransaction,
  userId: string
): Promise<ClassificationResult> {
  // 1. Check manual overrides first (highest priority)
  const override = await db.manualOverride.findFirst({
    where: { description: tx.description },
    include: { merchant: true, category: true },
  });

  if (override) {
    return {
      merchantId: override.merchantId,
      categoryId: override.categoryId,
      confidence: 1.0,
      source: "override",
    };
  }

  // 2. Check classification rules
  const rules = await db.classificationRule.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: "desc" },
    include: { merchant: true, category: true },
  });

  for (const rule of rules) {
    const desc = tx.description.toLowerCase();
    let matches = false;

    switch (rule.type) {
      case "contains":
        matches = desc.includes(rule.pattern.toLowerCase());
        break;
      case "equals":
        matches = desc === rule.pattern.toLowerCase();
        break;
      case "regex":
        try {
          matches = new RegExp(rule.pattern, "i").test(desc);
        } catch {
          matches = false;
        }
        break;
    }

    if (matches) {
      return {
        merchantId: rule.merchantId || null,
        categoryId: rule.categoryId,
        confidence: 0.9,
        source: "rule",
      };
    }
  }

  // 3. Check existing merchant matches
  if (tx.merchantGuess) {
    const merchant = await db.merchant.findFirst({
      where: { normalizedName: tx.merchantGuess.toLowerCase().replace(/\s+/g, "_") },
    });

    if (merchant) {
      // Find the most common category for this merchant
      const categoryStats = await db.transaction.groupBy({
        by: ["categoryId"],
        where: { merchantId: merchant.id, categoryId: { not: null } },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: "desc" } },
        take: 1,
      });

      return {
        merchantId: merchant.id,
        categoryId: categoryStats[0]?.categoryId || null,
        confidence: 0.8,
        source: "merchant",
      };
    }
  }

  // 4. Use pattern-based guessing
  if (tx.categoryGuess) {
    const category = await db.category.findFirst({
      where: {
        OR: [
          { userId, name: tx.categoryGuess },
          { isSystem: true, name: tx.categoryGuess },
        ],
      },
    });

    return {
      merchantId: null,
      categoryId: category?.id || null,
      confidence: 0.5,
      source: "pattern",
    };
  }

  // 5. No classification found
  const othersCategory = await db.category.findFirst({
    where: {
      OR: [
        { userId, name: "Others" },
        { isSystem: true, name: "Others" },
      ],
    },
  });

  return {
    merchantId: null,
    categoryId: othersCategory?.id || null,
    confidence: 0.0,
    source: "none",
  };
}

export async function classifyBatch(
  transactions: NormalizedTransaction[],
  userId: string
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();

  for (const tx of transactions) {
    const key = `${tx.date}_${tx.description}_${tx.amount}`;
    const result = await classifyTransaction(tx, userId);
    results.set(key, result);
  }

  return results;
}
