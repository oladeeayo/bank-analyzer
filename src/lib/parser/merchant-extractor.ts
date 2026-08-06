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

const BRAND_KEYWORDS: { pattern: RegExp; brand: string }[] = [
  { pattern: /sporty/i, brand: 'SportyBet' },
  { pattern: /1xbet/i, brand: '1xBet' },
  { pattern: /msport/i, brand: 'MSport' },
  { pattern: /opay/i, brand: 'OPay' },
  { pattern: /palmpay/i, brand: 'PalmPay' },
  { pattern: /paystack/i, brand: 'Paystack' },
  { pattern: /flutterwave|rave/i, brand: 'Flutterwave' },
  { pattern: /interswitch|quickteller/i, brand: 'Interswitch' },
  { pattern: /kuda/i, brand: 'Kuda Bank' },
  { pattern: /mtn/i, brand: 'MTN' },
  { pattern: /airtel/i, brand: 'Airtel' },
  { pattern: /glo/i, brand: 'Glo' },
  { pattern: /stamp duty/i, brand: 'CBN Stamp Duty' },
  { pattern: /vat|value added tax/i, brand: 'VAT' },
  { pattern: /sms charge/i, brand: 'SMS Service' },
  { pattern: /gtworld|gtb/i, brand: 'GTBank' },
  { pattern: /onebank|sterling/i, brand: 'Sterling Bank' },
  { pattern: /moniepoint/i, brand: 'Moniepoint' },
  { pattern: /access bank/i, brand: 'Access Bank' },
  { pattern: /zenith/i, brand: 'Zenith Bank' },
  { pattern: /uba/i, brand: 'UBA' },
  { pattern: /first bank|firstbank/i, brand: 'First Bank' },
  { pattern: /wema|alat/i, brand: 'Wema Bank' },
  { pattern: /fidelity/i, brand: 'Fidelity Bank' },
  { pattern: /fcmb/i, brand: 'FCMB' },
];

const LEGAL_SUFFIXES = [
  'LTD', 'LIMITED', 'PLC', 'INC', 'VENTURES', 'VENTURE', 'ENTERPRISE',
  'ENTERPRISES', 'SERVICES', 'GLOBAL', 'STORES', 'STORE', 'PHARMACY',
  'SUPERMARKET', 'BAKERY', 'KITCHEN', 'RESTAURANT', 'LOGISTICS', 'NIGERIA',
  'INTERNATIONAL', 'CONSULTING', 'SOLUTIONS', 'TECHNOLOGIES', 'HOLDINGS',
];

export class ExactMerchantExtractor {
  private static PREFIX_REGEX = /^(received from|send to|transfer (to|from)|paid to|payment to|outward transfer|inward transfer|local funds transfer|transfer|trf to|trf from|third-party merchant order\s*\|\s*|kuda transfer (to|from)\s*|inward transfer from\s*|outward transfer to\s*|bills\s+|airtime\s+)/i;
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

    let raw = rawDescription.trim();

    // Always clean transaction direction prefixes first
    raw = raw.replace(this.PREFIX_REGEX, '').trim();

    // Stage 1: Brand keyword matching (for specific bank charges)
    if (/charge|fee|vat|stamp|sms/i.test(raw)) {
      for (const item of BRAND_KEYWORDS) {
        if (item.pattern.test(raw)) {
          return this.buildPayload(raw, item.brand, item.brand, null, true, null, 'SYSTEM_CHARGE');
        }
      }
    }

    // Stage 2: Utility & System Transaction Interception
    if (/mobile data|buy data bundle|500mb|data purchase/i.test(raw)) {
      const parts = raw.split('|').map(p => p.trim());
      const telco = parts[2] ? parts[2].toUpperCase() : 'DATA SERVICE';
      const phone = parts[1] || null;
      return this.buildPayload(raw, `${telco} Data Purchase`, telco, phone, true, parts[3] || raw, 'UTILITY');
    }

    if (/^airtime|top up airtime|airtime purchase/i.test(raw)) {
      const parts = raw.split('|').map(p => p.trim());
      const telco = parts[2] ? parts[2].toUpperCase() : 'AIRTIME SERVICE';
      const phone = parts[1] || null;
      return this.buildPayload(raw, `${telco} Airtime Top-Up`, telco, phone, true, raw, 'UTILITY');
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
      return this.buildPayload(raw, 'CBN Stamp Duty Charge', 'FEDERAL GOVERNMENT', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/electronic money|emtl/i.test(raw)) {
      return this.buildPayload(raw, 'Electronic Money Transfer Levy', 'FEDERAL GOVERNMENT', null, true, null, 'SYSTEM_CHARGE');
    }

    if (/ussd charge/i.test(raw)) {
      return this.buildPayload(raw, 'USSD Service Charge', 'TELECOM PROVIDER', null, true, null, 'SYSTEM_CHARGE');
    }

    // Stage 3: Slash-separated counterparty parsing (NAME/ACCOUNT/BANK)
    const slashResult = this.extractFromSlashFormat(raw);
    if (slashResult) {
      const exactMerchantName = this.toTitleCase(slashResult.merchantName);
      return this.buildPayload(
        raw,
        exactMerchantName,
        slashResult.institution,
        slashResult.accountOrPhone,
        false,
        null,
        'DIRECT_TRANSFER'
      );
    }

    // Stage 4: Entity extraction by grammar patterns
    const entityByGrammar = this.extractByGrammar(raw);
    if (entityByGrammar) {
      return this.buildPayload(raw, entityByGrammar, null, null, false, null, 'DIRECT_TRANSFER');
    }

    // Stage 5: Entity extraction by legal suffixes
    const entityBySuffix = this.extractByEntityAnchors(raw);
    if (entityBySuffix) {
      return this.buildPayload(raw, entityBySuffix, null, null, false, null, 'DIRECT_TRANSFER');
    }

    // Stage 6: Structure Delimitation & Slash Parsing
    let candidateName = '';
    let institution: string | null = null;
    let accountOrPhone: string | null = null;
    let memo: string | null = null;
    let channelTag: 'POS_AGENT' | 'DIRECT_TRANSFER' | 'GATEWAY' = 'DIRECT_TRANSFER';

    // Handle Kuda slash-separated format ("Name/Account/Bank | Memo" or "Name/Bank | Memo")
    if (raw.includes('/')) {
      const pipeSplit = raw.split('|').map(p => p.trim());
      const counterpartyPart = pipeSplit[0];
      if (pipeSplit.length > 1) {
        memo = pipeSplit.slice(1).join(' | ');
      }

      const slashParts = counterpartyPart.split('/').map(p => p.trim());
      if (slashParts.length >= 3) {
        candidateName = slashParts[0];
        accountOrPhone = slashParts[1].replace(/\*/g, '');
        institution = slashParts.slice(2).join(' / ').toUpperCase();
      } else if (slashParts.length === 2) {
        candidateName = slashParts[0];
        if (/^\d{6,}$/.test(slashParts[1])) {
          accountOrPhone = slashParts[1];
        } else {
          institution = slashParts[1].toUpperCase();
        }
      } else {
        candidateName = counterpartyPart;
      }
    } else if (raw.includes('|')) {
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

    // Prefix & Suffix Cleaning
    candidateName = candidateName.replace(this.PREFIX_REGEX, '').trim();
    candidateName = candidateName.replace(this.GATEWAY_PREFIX_REGEX, '').trim();
    candidateName = candidateName.replace(/\s*-\s*(inward|outward|transfer|card purchase|ussd|airtime|bills|loan)$/i, '').trim();

    // Outlet, Branch & Terminal Suffix Cleaning
    if (candidateName.includes(' - ')) {
      const subParts = candidateName.split(' - ').map(p => p.trim());
      candidateName = subParts[0];
    }

    candidateName = candidateName.replace(/\s*\([\s\S]*?\)$/, '').trim();

    // Formatting & Title-Casing
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

  private static extractFromSlashFormat(str: string): {
    merchantName: string;
    institution: string | null;
    accountOrPhone: string | null;
  } | null {
    if (!str.includes('/')) return null;

    const parts = str.split('/').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return null;

    let merchantName: string | null = null;
    let institution: string | null = null;
    let accountOrPhone: string | null = null;

    const bankPattern = /bank|opay|palmpay|moniepoint|paga|9psb|paycom|gtb|access|zenith|uba|firstbank|wema|kuda|interswitch|quickteller/i;
    const phoneOrAccountPattern = /^\d{7,14}$/;

    for (const part of parts) {
      if (phoneOrAccountPattern.test(part)) {
        accountOrPhone = part;
      } else if (bankPattern.test(part) && !institution) {
        institution = part;
      } else if (!merchantName && part.length >= 3 && !/^(transfer|trf|paid|sent|received|outward|inward|local funds)$/i.test(part)) {
        merchantName = part;
      }
    }

    if (merchantName) {
      return { merchantName, institution, accountOrPhone };
    }
    return null;
  }

  private static extractByGrammar(narration: string): string | null {
    const patterns = [
      // Kuda hypenated patterns: "OLADEJI ISAIAH OLADIPUPO - Inward Transfer", "SportyBet - Outward Transfer"
      /^([A-Za-z0-9_\s.\-&]+?)\s*-\s*(?:Inward|Outward|Transfer|Card Purchase|USSD|POS|Airtime|Bills|Loan)/i,
      // "Inward Transfer from OLADEJI ISAIAH OLADIPUPO", "Transfer to SPORTYBET"
      /(?:Inward|Outward|Transfer|Card Purchase|USSD Payment)\s+(?:from|to)\s+([A-Za-z0-9_\s.\-&]+?)(?=\s+REF|\s+VIA|\d{10}|$)/i,
      // "POS/WEB - Merchant Name"
      /(?:POS\/WEB|WEB PURCHASE|PURCHASE TRANSACTION)[^\-]*\-[^\-]*\-([A-Za-z0-9_\s\&]+?)(?:\s+LANG|\s+NG|\s+LA|$)/i,
      /\b(?:TO|TRF TO|TRANSFER TO)\s+([A-Za-z0-9_\s.\-&]+?)(?:\s+VIA|\s+REF|\s+FROM|\/|\d{10}|$)/i,
      /\b(?:FROM|TRF FROM)\s+([A-Za-z0-9_\s.\-&]+?)(?:\s+TO|\s+REF|\/|\d{10}|$)/i,
      /(?:MERCHANT PAYMENTS|SETTLEMENT ACCT)[^\n]*\bto\s+([A-Za-z0-9\s._\-&]+?)(?=\s+REF|\s+COMMISSION|$)/i,
    ];

    for (const pattern of patterns) {
      const match = narration.match(pattern);
      if (match && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }
    return null;
  }

  private static extractByEntityAnchors(narration: string): string | null {
    const words = narration.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const cleanWord = words[i].replace(/[^A-Za-z]/g, '').toUpperCase();
      if (LEGAL_SUFFIXES.includes(cleanWord)) {
        const start = Math.max(0, i - 2);
        const entity = words.slice(start, i + 1).join(' ');
        const cleaned = entity.replace(/^[\-\/|]+|[\-\/|]+$/g, '').trim();
        if (cleaned.length > 3) return cleaned;
      }
    }
    return null;
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
