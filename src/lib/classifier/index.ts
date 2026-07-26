import { db } from "@/lib/db";
import { NormalizedTransaction } from "@/lib/normalizer";

export interface ClassificationResult {
  merchantId: string | null;
  categoryId: string | null;
  confidence: number;
  source: "rule" | "override" | "merchant" | "pattern" | "none";
}

interface ClassificationCache {
  rules: Array<{
    type: string;
    pattern: string;
    merchantId: string | null;
    categoryId: string;
  }>;
  merchants: Map<string, { id: string; normalizedName: string }>;
  merchantCategoryMap: Map<string, string | null>;
  categoryMap: Map<string, string | null>;
  othersCategoryId: string | null;
}

async function buildClassificationCache(userId: string): Promise<ClassificationCache> {
  const [rules, allMerchants, allCategories] = await Promise.all([
    db.classificationRule.findMany({
      where: { userId, isActive: true },
      orderBy: { priority: "desc" },
      select: { type: true, pattern: true, merchantId: true, categoryId: true },
    }),
    db.merchant.findMany({
      select: { id: true, normalizedName: true },
    }),
    db.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }] },
      select: { id: true, name: true, userId: true, isSystem: true },
    }),
  ]);

  const merchants = new Map<string, { id: string; normalizedName: string }>();
  for (const m of allMerchants) {
    merchants.set(m.normalizedName, m);
  }

  const categoryMap = new Map<string, string | null>();
  for (const c of allCategories) {
    const key = c.isSystem ? `system_${c.name}` : `user_${c.userId}_${c.name}`;
    categoryMap.set(key, c.id);
  }

  let othersCategoryId: string | null = null;
  const userOthers = allCategories.find(c => c.name === "Others" && c.userId === userId && !c.isSystem);
  const sysOthers = allCategories.find(c => c.name === "Others" && c.isSystem);
  othersCategoryId = userOthers?.id || sysOthers?.id || null;

  const merchantCategoryMap = new Map<string, string | null>();

  return { rules, merchants, merchantCategoryMap, categoryMap, othersCategoryId };
}

function matchRule(tx: NormalizedTransaction, cache: ClassificationCache): ClassificationResult | null {
  const desc = tx.description.toLowerCase();

  for (const rule of cache.rules) {
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

  return null;
}

function matchMerchant(tx: NormalizedTransaction, cache: ClassificationCache): ClassificationResult | null {
  if (!tx.merchantGuess) return null;

  const normalizedName = tx.merchantGuess.toLowerCase().replace(/\s+/g, "_");
  const merchant = cache.merchants.get(normalizedName);
  if (!merchant) return null;

  const categoryId = cache.merchantCategoryMap.get(merchant.id) ?? null;

  return {
    merchantId: merchant.id,
    categoryId,
    confidence: 0.8,
    source: "merchant",
  };
}

function matchCategory(tx: NormalizedTransaction, cache: ClassificationCache): ClassificationResult | null {
  if (!tx.categoryGuess) return null;

  const key = `system_${tx.categoryGuess}`;
  const userKey = tx.categoryGuess;
  const categoryId = cache.categoryMap.get(key) || cache.categoryMap.get(userKey) || null;

  return {
    merchantId: null,
    categoryId,
    confidence: 0.5,
    source: "pattern",
  };
}

export async function classifyBatch(
  transactions: NormalizedTransaction[],
  userId: string
): Promise<Map<string, ClassificationResult>> {
  const cache = await buildClassificationCache(userId);
  const results = new Map<string, ClassificationResult>();

  for (const tx of transactions) {
    const key = `${tx.date}_${tx.description}_${tx.amount}`;

    let result = matchRule(tx, cache);
    if (!result) result = matchMerchant(tx, cache);
    if (!result) result = matchCategory(tx, cache);
    if (!result) {
      result = {
        merchantId: null,
        categoryId: cache.othersCategoryId,
        confidence: 0.0,
        source: "none",
      };
    }

    results.set(key, result);
  }

  return results;
}
