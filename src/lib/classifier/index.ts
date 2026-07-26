import { db } from "@/lib/db";
import { NormalizedTransaction } from "@/lib/normalizer";
import { mapToDbCategory } from "@/lib/category-map";

export interface ClassificationResult {
  merchantId: string | null;
  categoryId: string | null;
  confidence: number;
  source: "override" | "rule" | "merchant" | "pattern" | "none";
}

interface ClassificationCache {
  overrides: Map<string, { merchantId: string | null; categoryId: string | null }>;
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
  const [overrides, rules, allMerchants, allCategories, merchantCatAgg] = await Promise.all([
    // 1. Get manual overrides for this user
    db.manualOverride.findMany({
      where: { userId },
      select: { description: true, merchantId: true, categoryId: true },
    }),
    // 2. Get classification rules for this user
    db.classificationRule.findMany({
      where: { userId, isActive: true },
      orderBy: { priority: "desc" },
      select: { type: true, pattern: true, merchantId: true, categoryId: true },
    }),
    // 3. Get all merchants
    db.merchant.findMany({
      select: { id: true, normalizedName: true },
    }),
    // 4. Get all categories (system + user)
    db.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }] },
      select: { id: true, name: true, userId: true, isSystem: true },
    }),
    // 5. Get most common category per merchant from existing transactions
    db.transaction.groupBy({
      by: ["merchantId", "categoryId"],
      where: {
        merchantId: { not: null },
        categoryId: { not: null },
      },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: "desc" } },
    }),
  ]);

  // Build override map (description → {merchantId, categoryId})
  const overrideMap = new Map<string, { merchantId: string | null; categoryId: string | null }>();
  for (const o of overrides) {
    overrideMap.set(o.description.toLowerCase(), {
      merchantId: o.merchantId,
      categoryId: o.categoryId,
    });
  }

  // Build merchant map
  const merchants = new Map<string, { id: string; normalizedName: string }>();
  for (const m of allMerchants) {
    merchants.set(m.normalizedName, m);
  }

  // Build category map with multiple key formats for flexible lookup
  const categoryMap = new Map<string, string | null>();
  for (const c of allCategories) {
    // System categories: "system_Food", "system_Transport", etc.
    if (c.isSystem) {
      categoryMap.set(`system_${c.name}`, c.id);
      // Also add normalized versions
      categoryMap.set(`system_${c.name.toLowerCase()}`, c.id);
    }
    // User categories: "user_{userId}_Food", etc.
    if (c.userId) {
      categoryMap.set(`user_${c.userId}_${c.name}`, c.id);
      categoryMap.set(`user_${c.userId}_${c.name.toLowerCase()}`, c.id);
    }
  }

  // Find Others category
  let othersCategoryId: string | null = null;
  const userOthers = allCategories.find(c => c.name === "Others" && c.userId === userId && !c.isSystem);
  const sysOthers = allCategories.find(c => c.name === "Others" && c.isSystem);
  othersCategoryId = userOthers?.id || sysOthers?.id || null;

  // Build merchant → category map from transaction history
  const merchantCategoryMap = new Map<string, string | null>();
  for (const mc of merchantCatAgg) {
    if (mc.merchantId && !merchantCategoryMap.has(mc.merchantId)) {
      merchantCategoryMap.set(mc.merchantId, mc.categoryId);
    }
  }

  return { overrides: overrideMap, rules, merchants, merchantCategoryMap, categoryMap, othersCategoryId };
}

function matchOverride(tx: NormalizedTransaction, cache: ClassificationCache): ClassificationResult | null {
  const desc = tx.description.toLowerCase();
  const override = cache.overrides.get(desc);
  if (override) {
    return {
      merchantId: override.merchantId,
      categoryId: override.categoryId,
      confidence: 0.95,
      source: "override",
    };
  }
  return null;
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

  // Get category from merchant history
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

  // Map normalizer category name to database category name
  const dbCategoryName = mapToDbCategory(tx.categoryGuess);

  // Try multiple lookup formats
  const key = `system_${dbCategoryName}`;
  const keyLower = `system_${dbCategoryName.toLowerCase()}`;
  const categoryId = cache.categoryMap.get(key) || cache.categoryMap.get(keyLower) || null;

  if (categoryId) {
    return {
      merchantId: null,
      categoryId,
      confidence: 0.5,
      source: "pattern",
    };
  }

  return null;
}

async function findOrCreateMerchant(
  merchantName: string,
  cache: ClassificationCache
): Promise<string | null> {
  if (!merchantName) return null;

  const normalizedName = merchantName.toLowerCase().replace(/\s+/g, "_");

  // Check cache first
  const cached = cache.merchants.get(normalizedName);
  if (cached) return cached.id;

  // Try to find in DB
  const existing = await db.merchant.findUnique({
    where: { normalizedName },
    select: { id: true, normalizedName: true },
  });

  if (existing) {
    cache.merchants.set(normalizedName, existing);
    return existing.id;
  }

  // Create new merchant
  const newMerchant = await db.merchant.create({
    data: {
      normalizedName,
      displayName: merchantName,
    },
    select: { id: true, normalizedName: true },
  });

  cache.merchants.set(normalizedName, newMerchant);
  return newMerchant.id;
}

export async function classifyBatch(
  transactions: NormalizedTransaction[],
  userId: string
): Promise<Map<string, ClassificationResult>> {
  const cache = await buildClassificationCache(userId);
  const results = new Map<string, ClassificationResult>();

  for (let idx = 0; idx < transactions.length; idx++) {
    const tx = transactions[idx];
    // Use index to avoid key collisions for same-day same-amount transactions
    const key = `${idx}_${tx.date}_${tx.description}_${tx.amount}`;

    // 1. Check manual overrides (highest priority - learned from user edits)
    let result = matchOverride(tx, cache);

    // 2. Check classification rules
    if (!result) {
      result = matchRule(tx, cache);
    }

    // 3. Check if merchant already exists in DB
    if (!result) {
      result = matchMerchant(tx, cache);
    }

    // 4. If merchant guess exists but not in DB, create it
    if (!result && tx.merchantGuess) {
      const merchantId = await findOrCreateMerchant(tx.merchantGuess, cache);
      if (merchantId && tx.categoryGuess) {
        // Map normalizer category to DB category
        const dbCategoryName = mapToDbCategory(tx.categoryGuess);
        const categoryKey = `system_${dbCategoryName}`;
        const categoryKeyLower = `system_${dbCategoryName.toLowerCase()}`;
        const categoryId = cache.categoryMap.get(categoryKey) || cache.categoryMap.get(categoryKeyLower) || null;

        result = {
          merchantId,
          categoryId,
          confidence: 0.7,
          source: "merchant",
        };
      } else if (merchantId) {
        result = {
          merchantId,
          categoryId: null,
          confidence: 0.7,
          source: "merchant",
        };
      }
    }

    // 5. Try pattern-based category guess
    if (!result) {
      result = matchCategory(tx, cache);
    }

    // 6. Fallback to Others
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
