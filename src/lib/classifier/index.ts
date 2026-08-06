import { db } from "@/lib/db";
import { NormalizedTransaction } from "@/lib/normalizer";
import { mapToDbCategory } from "@/lib/category-map";
import { evaluateContextRules, UserIdentity, extractCounterparty } from "./nigerian-context";

export interface ClassificationResult {
  merchantId: string | null;
  categoryId: string | null;
  confidence: number;
  source: "override" | "rule" | "context" | "merchant" | "pattern" | "keyword" | "none";
}

interface ClassificationCache {
  overrides: Map<string, { merchantId: string | null; categoryId: string | null }>;
  overridesByKey: Map<string, { merchantId: string | null; categoryId: string | null }>;
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

const KEYWORD_PATTERNS: Array<{
  patterns: RegExp[];
  categoryName: string;
  confidence: number;
}> = [
  // Savings
  { patterns: [/auto[\s-]?save/i, /savings?\s+(to|from)/i, /save\s+(to|into)\s+/i, /owealth\s+balance/i, /piggyvest/i, /cowrywise/i], categoryName: "Savings & Investments", confidence: 0.85 },
  // Salary / Income
  { patterns: [/salary/i, /wages?/i, /payroll/i, /income/i, /stipend/i], categoryName: "Income", confidence: 0.9 },
  // Electricity / Utilities
  { patterns: [/electricity/i, /power\s+(supply|bill|payment)/i, /ikeja\s+electric/i, /bedc/i, /ibedc/i, /aedc/i, /kedco/i, /phcn/i, /prepaid\s+meter/i, /capricorn[i]?\s+(electric|energy|disco)/i, /kwh/i, /electric\s+(bill|token|meter)/i, /disco/i], categoryName: "Utilities", confidence: 0.95 },
  // Water
  { patterns: [/water\s+(board|supply|bill|payment)/i, /water\s+vendor/i], categoryName: "Utilities", confidence: 0.9 },
  // Airtime / Data
  { patterns: [/airtime/i, /data\s+(bundle|plan|purchase)/i, /recharge/i, /\bvtu\b/i, /glo\s+data/i, /mtn\s+data/i, /9mobile/i, /airtel\s+data/i, /\bmtn\b.*\b(airtime|data|recharge)\b/i, /\bairtel\b.*\b(airtime|data|recharge)\b/i, /\bglo\b.*\b(airtime|data|recharge)\b/i, /gifting/i], categoryName: "Utilities", confidence: 0.9 },
  // Subscriptions / Streaming
  { patterns: [/spotify/i, /netflix/i, /showmax/i, /dstv\s*(explora|subscription|payment)/i, /youtube\s+(premium|music)/i, /apple\s+(music|tv)/i, /prime\s+video/i, /hulu/i, /disney\+/i, /iroll/i, /tv\s+subscription/i, /multichoice/i], categoryName: "Entertainment", confidence: 0.95 },
  // Food & Dining
  { patterns: [/restaurant/i, /food\s+(vendor|court|delivery)/i, /chicken\s+republic/i, /pizza/i, /dominos/i, /kfc/i, /burger\s+king/i, /eatwell/i, /buka/i, /mama\s+put/i, /canteen/i, /bar\s+bar/i, /lounge/i, /tavern/i, /sharwarma/i, /shawarma/i, /amala/i, /efo\s+riro/i, /suya/i, /jollof/i], categoryName: "Food & Dining", confidence: 0.85 },
  // Transport
  { patterns: [/uber/i, /bolt/i, /taxify/i, /indrive/i, /ride\s*(share|hailing)/i, /transport\s+(fare|payment)/i, /bus\s+(fare|ticket)/i, /danfo/i, /keke/i, /okada/i, /uber\s+trip/i, /lagbus/i, /brt/i, /ride\s+to/i], categoryName: "Transportation", confidence: 0.9 },
  // Shopping
  { patterns: [/shoprite/i, /jumia/i, /konga/i, /slot\s*(system| africa)/i, /computer\s+village/i, /market/i, /mall/i, /store/i, /retail/i, /buy\s*(now|items?)/i, /purchase/i], categoryName: "Shopping", confidence: 0.75 },
  // Healthcare
  { patterns: [/hospital/i, /pharmacy/i, /clinic/i, /medical/i, /health\s*(care|insurance)/i, /drug/i, /lab\s+(test|result)/i, /diagnostic/i, /dental/i, /optical/i, /gym/i, /fitness/i], categoryName: "Healthcare", confidence: 0.85 },
  // Education
  { patterns: [/school/i, /university/i, /college/i, /tuition/i, /course/i, /exam/i, /jamb/i, /waec/i, /neco/i, /giving\s+platform/i, /coursera/i, /udemy/i, /skillshare/i], categoryName: "Education", confidence: 0.85 },
  // Housing
  { patterns: [/rent/i, /landlord/i, /accommodation/i, /house\s+(rent|payment)/i, /mortgage/i, /estate\s+(levy|fee|charge)/i, /service\s+charge/i, /cleaning\s+(fee|charge)/i], categoryName: "Housing", confidence: 0.85 },
  // Investment
  { patterns: [/investment/i, /dividend/i, /mutual\s+fund/i, /stock/i, /treasury\s+bills/i, /fixed\s+deposit/i, /bond/i, /crypto/i, /bitcoin/i, /forex/i, /trading/i, /buy\s+crypto/i, /luno/i, /bundle/i, /valr/i], categoryName: "Savings & Investments", confidence: 0.85 },
  // Betting / Gambling
  { patterns: [/bet9ja/i, /sportybet/i, /sportybet/i, /betway/i, /betting/i, /gambling/i, /casino/i, /lottery/i, /nairabet/i, /merrybet/i, /betking/i, /1xbet/i, /melbet/i], categoryName: "Entertainment", confidence: 0.85 },
  // Banking & Financial
  { patterns: [/bank\s+charge/i, /bank\s+fee/i, /sms\s+(charge|alert)/i, /stamp\s+duty/i, /vat/i, /commission/i, /handling\s+fee/i], categoryName: "Banking & Financial", confidence: 0.8 },
  // POS / ATM
  { patterns: [/pos\s+(purchase|terminal|trans)/i, /atm\s+(withdrawal|cash)/i, /card\s+(purchase|payment)/i], categoryName: "Banking & Financial", confidence: 0.7 },
  // Transfer
  { patterns: [/\btrf\b/i, /sent\s+to/i, /received\s+from/i], categoryName: "Banking & Financial", confidence: 0.6 },
  // Government / Taxes
  { patterns: [/tax/i, /irs/i, /firs/i, /lirs/i, /paye/i, /company\s+income\s+tax/i, /vat\s+(remittance|payment)/i, /penalty/i, /fine/i, /levy/i], categoryName: "Government & Taxes", confidence: 0.85 },
  // Family / Personal
  { patterns: [/family/i, /parents?/i, /spouse/i, /children/i, /birthday\s+gift/i, /gift\s+(to|from)/i, /wedding/i, /funeral/i, /naming\s+ceremony/i, /support/i], categoryName: "Family", confidence: 0.8 },
  // Insurance
  { patterns: [/insurance/i, /premium/i, /policy/i, /claim/i, /nder\s+motor/i, /leadway/i, /aiico/i, /custodian/i, /aaron\s+piggyvest/i], categoryName: "Insurance", confidence: 0.85 },
];

function matchKeywords(tx: NormalizedTransaction, cache: ClassificationCache): ClassificationResult | null {
  const desc = `${tx.description} ${tx.memo || ""} ${tx.normalizedDescription || ""}`;
  const isCredit = tx.type === "credit";

  // Spending categories: never match these on credits (refunds/reversals would misfire)
  const SPENDING_CATEGORIES = new Set([
    "Utilities", "Food & Dining", "Transportation", "Shopping",
    "Healthcare", "Education", "Housing", "Entertainment",
    "Banking & Financial", "Government & Taxes", "Insurance",
  ]);

  for (const { patterns, categoryName, confidence } of KEYWORD_PATTERNS) {
    // Skip spending categories on credit transactions
    if (isCredit && SPENDING_CATEGORIES.has(categoryName)) continue;

    for (const pattern of patterns) {
      if (pattern.test(desc)) {
        const key = `system_${categoryName}`;
        const keyLower = `system_${categoryName.toLowerCase()}`;
        const categoryId = cache.categoryMap.get(key) || cache.categoryMap.get(keyLower) || null;

        if (categoryId) {
          return {
            merchantId: null,
            categoryId,
            confidence,
            source: "keyword",
          };
        }
      }
    }
  }

  return null;
}

async function buildClassificationCache(userId: string): Promise<ClassificationCache> {
  const [overrides, rules, allMerchants, allCategories, merchantCatAgg] = await Promise.all([
    // 1. Get manual overrides for this user
    db.manualOverride.findMany({
      where: { userId },
      select: { description: true, normalizedKey: true, merchantId: true, categoryId: true },
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
  // Primary: by normalizedKey, Secondary: by raw description (legacy)
  const overrideMap = new Map<string, { merchantId: string | null; categoryId: string | null }>();
  const overrideMapByKey = new Map<string, { merchantId: string | null; categoryId: string | null }>();
  for (const o of overrides) {
    overrideMap.set(o.description.toLowerCase(), {
      merchantId: o.merchantId,
      categoryId: o.categoryId,
    });
    if (o.normalizedKey) {
      overrideMapByKey.set(o.normalizedKey, {
        merchantId: o.merchantId,
        categoryId: o.categoryId,
      });
    }
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

  return { overrides: overrideMap, overridesByKey: overrideMapByKey, rules, merchants, merchantCategoryMap, categoryMap, othersCategoryId };
}

function matchOverride(tx: NormalizedTransaction, cache: ClassificationCache): ClassificationResult | null {
  // Try normalized key first (stable merchant name, survives ref ID changes)
  if (tx.merchantExtraction?.normalizedKey) {
    const override = cache.overridesByKey.get(tx.merchantExtraction.normalizedKey);
    if (override) {
      return {
        merchantId: override.merchantId,
        categoryId: override.categoryId,
        confidence: 0.95,
        source: "override",
      };
    }
  }

  // Fallback: raw description match (legacy)
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
  if (merchant) {
    const categoryId = cache.merchantCategoryMap.get(merchant.id) ?? null;
    return { merchantId: merchant.id, categoryId, confidence: 0.8, source: "merchant" };
  }

  // Fuzzy match: try to find a merchant with similar name
  const guessLower = tx.merchantGuess.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  let bestMatch: { id: string; normalizedName: string; score: number } | null = null;

  for (const [dbName, merchant] of cache.merchants) {
    const dbLower = dbName.replace(/_/g, " ").trim();
    // Exact substring match
    if (guessLower.includes(dbLower) || dbLower.includes(guessLower)) {
      bestMatch = { id: merchant.id, normalizedName: dbName, score: 0.95 };
      break;
    }
    // Token overlap: check if 2+ significant words match
    const guessWords = guessLower.split(/\s+/).filter(w => w.length > 2);
    const dbWords = dbLower.split(/[\s_]+/).filter(w => w.length > 2);
    let matches = 0;
    for (const gw of guessWords) {
      for (const dw of dbWords) {
        if (gw === dw || gw.includes(dw) || dw.includes(gw)) {
          matches++;
          break;
        }
      }
    }
    if (matches >= 2 && matches >= Math.min(guessWords.length, dbWords.length) * 0.6) {
      const score = matches / Math.max(guessWords.length, dbWords.length);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: merchant.id, normalizedName: dbName, score: Math.min(score, 0.9) };
      }
    }
  }

  if (bestMatch) {
    const merchant = cache.merchants.get(bestMatch.normalizedName);
    const categoryId = merchant ? (cache.merchantCategoryMap.get(merchant.id) ?? null) : null;
    return { merchantId: bestMatch.id, categoryId, confidence: bestMatch.score, source: "merchant" };
  }

  return null;
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
  userId: string,
  user?: UserIdentity
): Promise<Map<string, ClassificationResult>> {
  const cache = await buildClassificationCache(userId);
  const results = new Map<string, ClassificationResult>();

  for (let idx = 0; idx < transactions.length; idx++) {
    const tx = transactions[idx];
    const key = `${idx}_${tx.date}_${tx.description}_${tx.amount}`;

    // 1. Check manual overrides (highest priority - learned from user edits)
    let result = matchOverride(tx, cache);

    // 2. Check classification rules
    if (!result) {
      result = matchRule(tx, cache);
    }

    // 3. Check Nigerian context rules (self-transfer, POS, statutory fees, family)
    if (!result && user) {
      const isCredit = tx.type === "credit";
      const ctxMatch = evaluateContextRules(tx.description, tx.amount, isCredit, user);
      if (ctxMatch) {
        const dbCategoryName = ctxMatch.categoryName;
        const categoryKey = `system_${dbCategoryName}`;
        const categoryKeyLower = `system_${dbCategoryName.toLowerCase()}`;
        const categoryId = cache.categoryMap.get(categoryKey) || cache.categoryMap.get(categoryKeyLower) || null;
        result = {
          merchantId: null,
          categoryId,
          confidence: ctxMatch.confidence,
          source: "context",
        };
      }
    }

    // 4. Check keyword patterns (auto-categorize by description)
    if (!result) {
      result = matchKeywords(tx, cache);
    }

    // 5. Check if merchant already exists in DB
    if (!result) {
      result = matchMerchant(tx, cache);
    }

    // 6. If merchant guess exists but not in DB, create it
    if (!result && tx.merchantGuess) {
      const merchantId = await findOrCreateMerchant(tx.merchantGuess, cache);
      if (merchantId && tx.categoryGuess) {
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

    // 7. Try pattern-based category guess
    if (!result) {
      result = matchCategory(tx, cache);
    }

    // 8. Fallback to Others
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
