import {
  ExtractedCounterparty,
  CounterpartyProfile,
  CounterpartyMatch,
  SimilarTransactionGroup,
} from "./types";

export type { ExtractedCounterparty, CounterpartyProfile, CounterpartyMatch, SimilarTransactionGroup };

const KNOWN_BANKS = [
  "opay", "palmpay", "gtbank", "gtb", "guaranty trust bank", "access bank", "access",
  "uba", "united bank for africa", "moniepoint", "monie point", "moniepoint mfb",
  "kuda", "kuda mfb", "kuda bank", "first bank", "firstbank", "first city monument",
  "zenith bank", "zenith", "sterling bank", "sterling", "wema bank", "wema",
  "fidelity bank", "fidelity", "union bank", "polaris bank", "polaris",
  "stanbic ibtc", "stanbic", "ecobank", "eco bank",
  "providus bank", "providus", "titan bank", "titan",
  "globus bank", "globus", "lotus bank", "parallex bank",
  "coronation bank", "suntrust bank", "optimus bank",
  "pocketapp", "pocket app", "vfd", "vfd mfb", "mfb",
  "rubies mfb", "rubies", "sparkle", "sparkle mfb",
  "fairmoney", "fair money", "carbon", "branch",
  "renmoney", "ren money", "cowrywise", "piggyvest", "piggy vest",
  "chipper", "chipper cash", "flutterwave", "paystack",
];

const SERVICE_PREFIXES = [
  "mobile data", "mobile airtime", "airtime", "vtu", "data bundle",
  "electricity", "prepaid", "meter",
  "cable tv", "dstv", "gotv", "startimes",
  "internet", "data plan", "data",
  "cashbox", "stamp duty", "betting deposit",
  "electronic money transfer levy", "buy data",
];

const PHONE_PATTERN = /^\d{10,11}$/;

const SELF_NAMES = [
  "oladayo", "oladipupo", "isaac oladipupo",
  "oladayo isaac", "oladayo isaac oladipupo",
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupName(name: string): string {
  let cleaned = name
    .toUpperCase()
    .replace(/^TRANSFER\s+(TO|FROM)\s+/i, "")
    .replace(/^TRF\s+(TO|FROM)\s+/i, "")
    .replace(/^NIP\s+(CREDIT|DEBIT)\s*:?\s*/i, "")
    .replace(/^NIP\s+/i, "")
    .replace(/^MOBILE\s+TRF\s+(TO|PAY|FROM)\s+/i, "")
    .replace(/^MOBILE\s+TRANSFER\s+(TO|FROM)\s+/i, "")
    .replace(/^PAY\s+/i, "")
    .replace(/^POS\s+/i, "")
    .replace(/^WEB\s+/i, "")
    .replace(/^ITF\s+/i, "")
    .replace(/^SEND\s+TO\s+/i, "")
    .replace(/^RECEIVED\s+FROM\s+/i, "")
    .replace(/\s+REF\s+\w+/gi, "")
    .replace(/\b(REF|NARR|TRANSACTION)\b\s*:?\s*\w+/gi, "")
    .replace(/\bTRANSFER\b/gi, "")
    .replace(/^\s*(CREDIT|DEBIT)\s*:?\s*/i, "")
    .replace(/^\s*[-–—|]+\s*/, "")
    .replace(/\s*[-–—|]+\s*$/, "")
    .trim();

  const pipeIndex = cleaned.indexOf("|");
  if (pipeIndex > 0) {
    cleaned = cleaned.substring(0, pipeIndex).trim();
  }

  cleaned = cleaned.replace(/[^\w\s\.\-]/g, " ").replace(/\s+/g, " ").trim();

  return cleaned;
}

function isSelfTransfer(name: string): boolean {
  const lower = name.toLowerCase();
  return SELF_NAMES.some(self => lower.includes(self)) || lower === "self" || lower === "own account";
}

function computeLevenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function nameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (n1 === n2) return 1.0;
  if (n1.includes(n2) || n2.includes(n1)) return 0.9;

  const words1 = n1.split(" ").filter(w => w.length > 1);
  const words2 = n2.split(" ").filter(w => w.length > 1);

  if (words1.length === 0 || words2.length === 0) return 0;

  const smaller = words1.length <= words2.length ? words1 : words2;
  const larger = words1.length > words2.length ? words1 : words2;

  let exactMatches = 0;
  let partialMatches = 0;
  for (const sw of smaller) {
    let found = false;
    for (const lw of larger) {
      if (sw === lw) {
        exactMatches++;
        found = true;
        break;
      }
    }
    if (!found) {
      for (const lw of larger) {
        if (sw.includes(lw) || lw.includes(sw)) {
          partialMatches++;
          found = true;
          break;
        }
      }
    }
  }

  const tokenScore = (exactMatches + partialMatches * 0.7) / Math.max(smaller.length, larger.length);

  const combined1 = words1.join(" ");
  const combined2 = words2.join(" ");
  const levDistance = computeLevenshtein(combined1, combined2);
  const maxLen = Math.max(combined1.length, combined2.length);
  const levScore = maxLen > 0 ? 1 - levDistance / maxLen : 1;

  return Math.max(tokenScore, levScore * 0.8);
}

function getKeyIdentifier(name: string): string {
  const normalized = normalizeName(name);
  const words = normalized.split(" ").filter(w => w.length > 1);

  if (words.length === 0) return normalized;
  if (words.length === 1) return words[0];

  const first = words[0];
  const last = words[words.length - 1];

  if (words.length === 2) return `${first} ${last}`;

  for (const word of words) {
    if (/^(ltd|limited|company|enterprise|nigeria|ng|services|and|&|ventures|concept)$/i.test(word)) {
      return `${first} ${last}`;
    }
  }

  return `${first} ${last}`;
}

function getLastDigits(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return digits.slice(-4);
}

function isFullyVisible(account: string): string | null {
  const digits = account.replace(/\D/g, "");
  if (digits.length >= 8 && !account.includes("*")) return digits;
  return null;
}

export function extractCounterpartyInfo(
  description: string,
  userOwnNames: string[] = []
): ExtractedCounterparty {
  const desc = description.trim();

  let direction: "credit" | "debit" | "unknown" = "unknown";
  let name = "";
  let bank: string | undefined;
  let accountNumber: string | undefined;

  const upper = desc.toUpperCase();

  const isCredit = /^(TRANSFER FROM|TRF FROM|NIP CREDIT|MOBILE TRANSFER FROM|MOBILE TRF FROM|ITF |RECEIVED FROM)/i.test(upper);
  const isDebit = /^(TRANSFER TO|TRF TO|NIP DEBIT|MOBILE TRANSFER TO|MOBILE TRF TO|SEND TO)/i.test(upper);

  if (isCredit) {
    direction = "credit";
  } else if (isDebit) {
    direction = "debit";
  }

  const parts = desc.split("|").map(p => p.trim());

  if (parts.length >= 3) {
    if (isCredit || isDebit) {
      const cleaned = parts[0].replace(/^(Transfer|TRF|Mobile Transfer|Mobile TRF|NIP Credit|NIP Debit|ITF)\s+(to|from|credit|debit)\s*/i, "").trim();
      name = cleaned;
      bank = parts[1];
      accountNumber = parts[2].replace(/\s+\S+$/g, "").trim();
    } else {
      const firstPart = parts[0].toLowerCase();
      const knownBankMatch = KNOWN_BANKS.find(b => firstPart.includes(b));
      if (knownBankMatch) {
        bank = parts[0];
        name = parts.slice(1).join(" | ");
      } else {
        name = parts[0];
        const isService = SERVICE_PREFIXES.some(p => firstPart.startsWith(p));
        const secondIsPhone = PHONE_PATTERN.test(parts[1].replace(/\D/g, ""));
        if (isService || secondIsPhone) {
          // Service description: parts[1] is phone/meter, parts[2] is provider
          // Only use the service type as name, don't set bank/account
          bank = undefined;
          accountNumber = undefined;
        } else {
          bank = parts[1];
          accountNumber = parts[2].replace(/\s+\S+$/g, "").trim();
        }
      }
    }
  } else if (parts.length === 2) {
    const firstPart = parts[0].toLowerCase();
    const knownBankMatch = KNOWN_BANKS.find(b => firstPart.includes(b));
    if (knownBankMatch) {
      bank = parts[0];
      name = parts[1];
    } else {
      name = parts[0];
      bank = parts[1];
    }
  } else if (parts.length === 1) {
    const transferMatch = desc.match(/^(?:Transfer|TRF|Send to|Received from)\s+(?:to|from)\s+(.+?)(?:\||$)/i);
    if (transferMatch) {
      name = transferMatch[1].trim();
    } else {
      const debitMatch = desc.match(/(?:POS|WEB|CARD)\s+PURCHASE\s+(?:AT\s+)?(.+?)(?:\d{4,}|$)/i);
      if (debitMatch) {
        name = debitMatch[1].trim();
      } else {
        name = desc;
      }
    }
  }

  name = cleanupName(name);
  const cleanName = name || desc;

  const lastDigits = accountNumber ? getLastDigits(accountNumber) : undefined;
  const fullAccount = accountNumber ? isFullyVisible(accountNumber) : undefined;

  let foundBank: string | undefined;
  if (bank) {
    const bankLower = bank.toLowerCase();
    foundBank = KNOWN_BANKS.find(b => bankLower.includes(b));
  }

  const selfTransfer = isSelfTransfer(cleanName) ||
    userOwnNames.some(own => cleanName.toLowerCase().includes(own.toLowerCase())) ||
    false;

  return {
    name: cleanName,
    normalizedName: normalizeName(cleanName),
    bank: bank || foundBank || undefined,
    accountNumber: fullAccount || accountNumber || undefined,
    partialAccountNumber: lastDigits,
    direction,
    isSelfTransfer: selfTransfer,
  };
}

export function findCounterpartyMatch(
  info: ExtractedCounterparty,
  existingProfiles: CounterpartyProfile[]
): CounterpartyMatch {
  if (!info.name) {
    return { matched: false, confidence: 0, matchLevel: "none" };
  }

  const candidates: Array<{ profile: CounterpartyProfile; confidence: number; matchLevel: CounterpartyMatch["matchLevel"]; matchedField?: string }> = [];

  for (const profile of existingProfiles) {
    if (profile.normalizedName === "self_transfer") continue;

    if (info.bank && info.accountNumber) {
      for (const kb of profile.knownBanks) {
        if (kb.accountNumber && info.accountNumber) {
          const profileLastDigits = getLastDigits(kb.accountNumber);
          const infoLastDigits = getLastDigits(info.accountNumber);

          if (kb.accountNumber === info.accountNumber) {
            candidates.push({
              profile,
              confidence: 1.0,
              matchLevel: "exact_account",
              matchedField: `account: ${info.accountNumber}`,
            });
            break;
          }
        }
      }
    }

    if (info.bank && info.partialAccountNumber && info.partialAccountNumber.length >= 4) {
      for (const kb of profile.knownBanks) {
        if (kb.accountNumber) {
          const profileLastDigits = getLastDigits(kb.accountNumber);
          if (profileLastDigits === info.partialAccountNumber) {
            const bankLower = info.bank.toLowerCase();
            const profileBankLower = (kb.name || "").toLowerCase();
            const bankMatch = KNOWN_BANKS.some(b =>
              bankLower.includes(b) && profileBankLower.includes(b)
            );

            if (bankMatch) {
              candidates.push({
                profile,
                confidence: 0.85,
                matchLevel: "partial_account",
                matchedField: `account_last4: ${info.partialAccountNumber} @ ${kb.name}`,
              });
              break;
            }
          }
        }
      }
    }

    if (info.name) {
      const sim = nameSimilarity(info.normalizedName, profile.normalizedName);

      if (sim >= 1.0) {
        candidates.push({
          profile,
          confidence: 0.95,
          matchLevel: "name_similarity",
          matchedField: `exact_name: ${profile.name}`,
        });
      } else if (sim >= 0.85) {
        candidates.push({
          profile,
          confidence: sim,
          matchLevel: "name_similarity",
          matchedField: `fuzzy_name: ${profile.name} (${(sim * 100).toFixed(0)}%)`,
        });
      }
    }

    const infoKey = getKeyIdentifier(info.name);
    const profileKey = getKeyIdentifier(profile.name);

    if (infoKey !== info.normalizedName && profileKey !== profile.normalizedName) {
      if (infoKey === profileKey) {
        candidates.push({
          profile,
          confidence: 0.75,
          matchLevel: "name_similarity",
          matchedField: `key_id: ${infoKey}`,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return { matched: false, confidence: 0, matchLevel: "none" };
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  return {
    matched: true,
    profileId: candidates[0].profile.id,
    confidence: candidates[0].confidence,
    matchLevel: candidates[0].matchLevel,
    matchedField: candidates[0].matchedField,
  };
}

function namesMatchForGrouping(
  info_i: ExtractedCounterparty,
  info_j: ExtractedCounterparty
): boolean {
  if (info_i.accountNumber && info_j.accountNumber && info_i.accountNumber === info_j.accountNumber) {
    return true;
  }

  if (
    info_i.partialAccountNumber && info_j.partialAccountNumber &&
    info_i.partialAccountNumber === info_j.partialAccountNumber &&
    info_i.partialAccountNumber.length >= 4
  ) {
    const sameBank = info_i.bank && info_j.bank &&
      KNOWN_BANKS.some(b =>
        info_i.bank!.toLowerCase().includes(b) && info_j.bank!.toLowerCase().includes(b)
      );
    if (sameBank) return true;
  }

  const sim = nameSimilarity(info_i.normalizedName, info_j.normalizedName);
  if (sim >= 0.80) return true;

  const key_i = getKeyIdentifier(info_i.name);
  const key_j = getKeyIdentifier(info_j.name);
  if (key_i === key_j && key_i.length >= 3) return true;

  const words_i = info_i.normalizedName.split(" ").filter(w => w.length > 1);
  const words_j = info_j.normalizedName.split(" ").filter(w => w.length > 1);
  const firstWord_i = words_i[0] || "";
  const firstWord_j = words_j[0] || "";
  const lastWord_i = words_i[words_i.length - 1] || "";
  const lastWord_j = words_j[words_j.length - 1] || "";

  if (firstWord_i === firstWord_j && lastWord_i === lastWord_j && firstWord_i.length > 1 && lastWord_i.length > 1) {
    return true;
  }

  return false;
}

export function groupSimilarTransactions(
  descriptions: string[],
  userOwnNames: string[] = []
): SimilarTransactionGroup[] {
  const extracted = descriptions.map(d => extractCounterpartyInfo(d, userOwnNames));

  const groups: SimilarTransactionGroup[] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < extracted.length; i++) {
    if (assigned.has(i)) continue;
    if (!extracted[i].name) continue;

    const group: SimilarTransactionGroup = {
      groupId: `group_${groups.length + 1}`,
      counterpartyName: extracted[i].name,
      normalizedName: extracted[i].normalizedName,
      transactionIndices: [i],
      transactionIds: [],
      direction: (extracted[i].direction === "unknown" ? "mixed" : extracted[i].direction) as "credit" | "debit" | "mixed",
      totalAmount: 0,
      transactionCount: 1,
    };

    assigned.add(i);

    for (let j = i + 1; j < extracted.length; j++) {
      if (assigned.has(j)) continue;
      if (!extracted[j].name) continue;

      if (namesMatchForGrouping(extracted[i], extracted[j])) {
        group.transactionIndices.push(j);
        group.transactionCount++;
        assigned.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

export function mergeProfile(
  target: CounterpartyProfile,
  source: ExtractedCounterparty
): void {
  const normalized = normalizeName(source.name);
  const existingAlias = target.aliases.find(
    a => normalizeName(a) === normalized
  );

  if (!existingAlias) {
    target.aliases.push(source.name);
  }

  if (source.bank) {
    const existingBank = target.knownBanks.find(
      b => b.name.toLowerCase() === source.bank!.toLowerCase() &&
        (!source.accountNumber || b.accountNumber === source.accountNumber)
    );
    if (!existingBank) {
      target.knownBanks.push({ name: source.bank, accountNumber: source.accountNumber });
    } else if (source.accountNumber && !existingBank.accountNumber) {
      existingBank.accountNumber = source.accountNumber;
    }
  }

  target.transactionCount++;
}

export function buildProfile(
  id: string,
  info: ExtractedCounterparty
): CounterpartyProfile {
  return {
    id,
    name: info.name,
    normalizedName: info.normalizedName,
    aliases: [info.name],
    knownBanks: info.bank
      ? [{ name: info.bank, accountNumber: info.accountNumber }]
      : [],
    totalReceived: 0,
    totalSent: 0,
    transactionCount: 1,
  };
}

export function normalizeNamePublic(name: string): string {
  return normalizeName(name);
}

export { nameSimilarity, getKeyIdentifier, getLastDigits, normalizeName, cleanupName, isSelfTransfer, namesMatchForGrouping };
