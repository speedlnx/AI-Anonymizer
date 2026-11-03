import { EntityType, EntityMatch } from './types';
import {
  isValidCodiceFiscale,
  isValidPartitaIva,
  isValidLuhn,
  isValidIBAN,
  isValidIPv4,
  isValidItalianDocument,
} from './validators';

export interface DetectionRule {
  type: EntityType;
  name: string;
  priority: number; // Higher runs or claims first
  pattern: RegExp;
  validate?: (match: string, fullMatch: RegExpExecArray) => boolean | { valid: boolean; value?: string; details?: Record<string, unknown> };
  transformMatch?: (match: string) => string;
}

export const DETECTION_RULES: DetectionRule[] = [
  // 1. API KEYS & TOKENS (High priority to avoid catching pieces as words/hashes)
  {
    type: 'API_KEY',
    name: 'OpenAI API Key',
    priority: 100,
    pattern: /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    type: 'API_KEY',
    name: 'Anthropic API Key',
    priority: 100,
    pattern: /\bsk-ant-(?:api03-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    type: 'API_KEY',
    name: 'GitHub Token',
    priority: 100,
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g,
  },
  {
    type: 'API_KEY',
    name: 'AWS Access Key',
    priority: 95,
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    type: 'API_KEY',
    name: 'Stripe API Key',
    priority: 95,
    pattern: /\b[sr]k_(?:test|live)_[0-9a-zA-Z]{24,}\b/g,
  },
  {
    type: 'API_KEY',
    name: 'JWT Bearer Token',
    priority: 90,
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    type: 'API_KEY',
    name: 'Generic API Key / Secret Assignment',
    priority: 85,
    pattern: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key|password)\s*[:=]\s*["']?([A-Za-z0-9/+=_\-]{16,})["']?/gi,
    transformMatch: (match) => {
      // Capture the key value itself
      const parts = match.split(/[:=]/);
      if (parts.length >= 2) {
        return parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
      return match;
    },
  },

  // 2. URLs (must be high priority before IP addresses or paths get split)
  {
    type: 'URL',
    name: 'Web URL',
    priority: 80,
    pattern: /\b(?:https?|ftp|file):\/\/[^\s<>"'{}|\\^`[\]]+|(?:www\.)[^\s<>"'{}|\\^`[\]]+/gi,
    validate: (val) => {
      // Avoid trailing punctuation like dot or comma at end of sentence
      const trimmed = val.replace(/[.,;:!?)]+$/, '');
      return trimmed.length > 5;
    },
    transformMatch: (val) => val.replace(/[.,;:!?)]+$/, ''),
  },

  // 3. EMAIL ADDRESSES
  {
    type: 'EMAIL',
    name: 'Email Address',
    priority: 75,
    pattern: /\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\b/g,
  },

  // 4. UUID / GUID
  {
    type: 'UUID',
    name: 'UUID / GUID',
    priority: 70,
    pattern: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
  },

  // 5. CODICE FISCALE (Italian Tax Code)
  {
    type: 'CODICE_FISCALE',
    name: 'Codice Fiscale Italiano',
    priority: 65,
    pattern: /\b[A-Za-z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Za-z][0-9LMNPQRSTUV]{3}[A-Za-z]\b/g,
    validate: (val) => isValidCodiceFiscale(val),
  },

  // 5b. PARTITA IVA (Italian VAT)
  {
    type: 'PARTITA_IVA',
    name: 'Partita IVA Italiana',
    priority: 64,
    pattern: /\b(?:IT\s*)?[0-9]{11}\b/gi,
    validate: (val) => isValidPartitaIva(val),
  },

  // 6. IBAN & BANK CODES
  {
    type: 'IBAN',
    name: 'IBAN (Italian / International)',
    priority: 60,
    // IT IBAN: IT + 2 digits + 1 char + 5 digits (ABI) + 5 digits (CAB) + 12 chars (Conto)
    pattern: /\b[A-Za-z]{2}[0-9]{2}[A-Za-z0-9]{4}[0-9]{5,26}\b/g,
    validate: (val) => isValidIBAN(val),
  },
  {
    type: 'BANK_CODE',
    name: 'Codici Bancari ABI / CAB',
    priority: 58,
    pattern: /\b(?:ABI\s*[:.]?\s*(\d{5})|CAB\s*[:.]?\s*(\d{5}))\b/gi,
  },
  {
    type: 'BANK_CODE',
    name: 'Codice SWIFT / BIC',
    priority: 57,
    pattern: /\b(?:SWIFT|BIC)?\s*[:.]?\s*([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/g,
    validate: (val) => {
      const clean = val.replace(/^(?:SWIFT|BIC)\s*[:.]?\s*/i, '').trim();
      return clean.length === 8 || clean.length === 11;
    },
  },

  // 7. CREDIT CARD NUMBERS (with Luhn algorithm check)
  {
    type: 'CREDIT_CARD',
    name: 'Carta di Credito',
    priority: 55,
    // Matches 13 to 19 digits separated by spaces or hyphens
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
    validate: (val) => {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) return false;
      return isValidLuhn(digits);
    },
  },

  // 8. ITALIAN DOCUMENT IDs (CIE, Passaporto, Patente)
  {
    type: 'DOCUMENT_ID',
    name: 'Documento Identità Italiano',
    priority: 50,
    // CIE: 2 letters, 5 digits, 2 letters; Passaporto: 2 letters, 7 digits
    pattern: /\b(?:[A-Za-z]{2}\d{5}[A-Za-z]{2}|[A-Za-z]{2}\s?\d{7}|U1[A-Za-z0-9]{7})\b/g,
    validate: (val) => {
      const res = isValidItalianDocument(val);
      return res.isValid;
    },
  },

  // 9. IP ADDRESSES (IPv4 & IPv6)
  {
    type: 'IP_ADDRESS',
    name: 'Indirizzo IP',
    priority: 45,
    // IPv4 with boundary check
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?\b/g,
    validate: (val) => {
      const ipOnly = val.split(':')[0];
      return isValidIPv4(ipOnly);
    },
  },
  {
    type: 'IP_ADDRESS',
    name: 'Indirizzo IPv6',
    priority: 44,
    pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}\b/g,
  },

  // 10. MAC ADDRESSES
  {
    type: 'MAC_ADDRESS',
    name: 'MAC Address',
    priority: 40,
    pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b|\b(?:[0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}\b/g,
  },

  // 11. PHONE NUMBERS (Italian mobile + landline + international)
  {
    type: 'PHONE',
    name: 'Numero Telefonico',
    priority: 35,
    // Italian mobile (3xx) or landline (0xx) or int'l (+39 / 0039 or other +xx)
    pattern: /(?:(?:\+|00)39[\s./-]?)?(?:(?:3[1-9][0-9])[\s./-]?[0-9]{3}[\s./-]?[0-9]{4}|(?:0[1-9][0-9]{0,3})[\s./-]?[0-9]{4,8})\b|\b\+(?:[0-9][\s./-]?){8,14}[0-9]\b/g,
    validate: (val) => {
      const digits = val.replace(/\D/g, '');
      // Ensure it's not a pure 4-5 digit number or date like 2024
      return digits.length >= 7 && digits.length <= 15;
    },
  },
];

