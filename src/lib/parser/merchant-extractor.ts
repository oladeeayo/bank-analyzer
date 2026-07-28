export interface ExtractedMerchantPayload {
  rawDescription: string;
  exactMerchantName: string;
  normalizedKey: string;
  institution: string | null;
  accountOrPhone: string | null;
  isSystemOrUtility: boolean;
  memo: string | null;
  channelTag: 'POS_AGENT' | 'DIRECT_TRANSFER' | 'UTILITY' | 'SYSTEM_CHARGE' | 'GATEWAY';
}

export class ExactMerchantExtractor {
  private static PREFIX_REGEX = /^(received from|send to|transfer (to|from)|paid to|payment to|third-party merchant order\s*\|\s*)/i;
  private static GATEWAY_PREFIX_REGEX = /^(gfs\/|gfs|pos transfer\s*-\s*|pos transfer\s*|pos\s*-\s*)/i;
  private static ACRONYMS = new Set([
    'LTD', 'PLC', 'MFB', 'POS', 'NIG', 'LIMITED', 'NIGERIA', 'GTB', 'UBA',
    'MTN', 'AIRTEL', 'GLO', 'BRT', 'VAT', 'EMTL', 'CBN', 'NEPA', 'IKEDC',
    'EKEDC', 'IBEDC', 'PHEDC', 'KEDCO', 'JEDC', 'AEDC', 'IBDC', 'OPAY', 'PALMPAY'
  ]);

  public static process(rawDescription: string): ExtractedMerchantPayload {
    if (!rawDescription || !rawDescription.trim()) {
      return this.buildPayload(rawDescription ?? '', 'Unknown', null, null, true, null, 'SYSTEM_CHARGE');
    }

    const raw = rawDescription.trim();

    // ── Stage 1: Utility & System Transaction Interception ──────────────────
    if (/mobile data|buy data bundle/i.test(raw)) {
      const parts = raw.split('|').map(p => p.trim());
      const telco = parts[2] ? parts[2].toUpperCase() : 'DATA SERVICE';
      const phone = parts[1] || null;
      return this.buildPayload(raw, `${telco} Data Purchase`, telco, phone, true, parts[3] || null, 'UTILITY');
    }

    if (/^airtime|top up airtime/i.test(raw)) {
      const parts = raw.split('|').map(p => p.trim());
      const telco = parts[2] ? parts[2].toUpperCase() : 'AIRTIME SERVICE';
      const phone = parts[1] || null;
      return this.buildPayload(raw, `${telco} Airtime Top-Up`, telco, phone, true, null, 'UTILITY');
    }

    if (/electricity/i.test(raw)) {
      const parts = raw.split('|').map(p => p.trim());
      const provider = parts[2] ? parts[2].toUpperCase().replace(/_/g, ' ') : 'ELECTRICITY DISCO';
      const meter = parts[1] || null;
      return this.buildPayload(raw, provider, provider, meter, true, parts[3] || null, 'UTILITY');
    }

    if (/cashbox interest|owealth interest/i.test(raw)) {
      return this.buildPayload(raw, 'Fintech Savings Interest', 'PALMPAY/OPAY', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/cashbox auto save|auto-save to owealth/i.test(raw)) {
      return this.buildPayload(raw, 'Internal Wallet Auto-Save', 'PALMPAY/OPAY', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/stamp duty/i.test(raw)) {
      return this.buildPayload(raw, 'CBN Stamp Duty', 'FEDERAL GOVERNMENT', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/electronic money|emtl/i.test(raw)) {
      return this.buildPayload(raw, 'Electronic Money Transfer Levy', 'FEDERAL GOVERNMENT', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/ussd charge/i.test(raw)) {
      return this.buildPayload(raw, 'USSD Service Charge', 'TELECOM PROVIDER', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/^interbank transfer$/i.test(raw)) {
      return this.buildPayload(raw, 'Interbank Transfer Credit', null, null, true, null, 'DIRECT_TRANSFER');
    }

    // ── Stage 2: Structure Delimitation ─────────────────────────────────────
    let candidateName = '';
    let institution: string | null = null;
    let accountOrPhone: string | null = null;
    let memo: string | null = null;
    let channelTag: 'POS_AGENT' | 'DIRECT_TRANSFER' | 'GATEWAY' = 'DIRECT_TRANSFER';

    if (raw.includes('|')) {
      const parts = raw.split('|').map(p => p.trim());
      candidateName = parts[0];

      if (parts.length >= 2 && parts[1]) {
        institution = parts[1].toUpperCase();
      }
      if (parts.length >= 3 && parts[2]) {
        accountOrPhone = parts[2].replace(/\*/g, '');
      }
      if (parts.length >= 4 && parts[3]) {
        memo = parts.slice(3).join(' | ');
      }
    } else {
      candidateName = raw;
    }

    if (/third-party merchant order|paystack|interswitch|flutterwave/i.test(candidateName)) {
      channelTag = 'GATEWAY';
    }

    if (/pos transfer|gbenga pos/i.test(candidateName)) {
      channelTag = 'POS_AGENT';
    }

    // ── Stage 3: Prefix Cleaning ────────────────────────────────────────────
    candidateName = candidateName.replace(this.PREFIX_REGEX, '').trim();
    candidateName = candidateName.replace(this.GATEWAY_PREFIX_REGEX, '').trim();

    // ── Stage 4: Outlet, Branch & Terminal Suffix Cleaning ──────────────────
    if (candidateName.includes(' - ')) {
      const subParts = candidateName.split(' - ').map(p => p.trim());
      if (/(limited|ltd|inc|ventures|services|enterprises|stores|supermart)/i.test(subParts[0])) {
        candidateName = subParts[0];
      } else {
        candidateName = subParts[0];
      }
    }

    candidateName = candidateName.replace(/\s*\([\s\S]*?\)$/, '').trim();

    // ── Stage 5: Formatting & Title-Casing ──────────────────────────────────
    const exactMerchantName = this.toTitleCase(candidateName);

    return this.buildPayload(
      raw,
      exactMerchantName,
      institution,
      accountOrPhone,
      false,
      memo,
      channelTag,
    );
  }

  private static buildPayload(
    rawDescription: string,
    exactMerchantName: string,
    institution: string | null,
    accountOrPhone: string | null,
    isSystemOrUtility: boolean,
    memo: string | null,
    channelTag: 'POS_AGENT' | 'DIRECT_TRANSFER' | 'UTILITY' | 'SYSTEM_CHARGE' | 'GATEWAY',
  ): ExtractedMerchantPayload {
    const normalizedKey = exactMerchantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return {
      rawDescription,
      exactMerchantName,
      normalizedKey,
      institution,
      accountOrPhone,
      isSystemOrUtility,
      memo,
      channelTag,
    };
  }

  private static toTitleCase(str: string): string {
    if (!str) return 'Unknown';

    const cleanStr = str.replace(/\s+/g, ' ').trim();
    const words = cleanStr.split(' ');

    return words
      .map(w => {
        const upper = w.toUpperCase();
        if (this.ACRONYMS.has(upper)) {
          return upper;
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
