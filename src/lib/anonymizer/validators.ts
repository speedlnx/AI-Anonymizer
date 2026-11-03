// Validation utilities for Italian standards and international data formats

/**
 * Validates Italian Codice Fiscale (CF).
 * By default in a privacy anonymization context, any 16-character string adhering to
 * the official Agenzia delle Entrate structural pattern (surname, name, year, month A-EHLMPR-T,
 * day/gender, cadastral code and omocodia) must be protected.
 * If strictCheckChar is true, the 16th control character is strictly verified.
 */
export function isValidCodiceFiscale(cf: string, strictCheckChar: boolean = false): boolean {
  if (!cf) return false;
  const cleanCf = cf.trim().toUpperCase();
  if (cleanCf.length !== 16) return false;

  // Strict regex according to Italian DM 23/12/1976 and omocodia rules
  const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
  if (!cfRegex.test(cleanCf)) return false;

  if (!strictCheckChar) {
    return true;
  }

  const oddValues: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };

  const evenValues: Record<string, number> = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  };

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = cleanCf[i];
    // 0-indexed: i=0 is 1st (odd position), i=1 is 2nd (even position)
    if (i % 2 === 0) {
      sum += oddValues[char] ?? 0;
    } else {
      sum += evenValues[char] ?? 0;
    }
  }

  const expectedCheckChar = String.fromCharCode(65 + (sum % 26));
  return cleanCf[15] === expectedCheckChar;
}

/**
 * Validates Italian Partita IVA (11 digits, with Luhn-like checksum).
 */
export function isValidPartitaIva(piva: string, strictChecksum: boolean = false): boolean {
  if (!piva) return false;
  const clean = piva.replace(/^IT/i, '').replace(/\s+/g, '');
  if (!/^\d{11}$/.test(clean)) return false;

  if (!strictChecksum) return true;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = parseInt(clean[i], 10);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(clean[10], 10);
}

/**
 * Validates Luhn formula for credit cards.
 */
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validates IBAN with MOD-97 algorithm.
 * Protects Italian IBAN (27 chars starting with IT) or valid international IBANs.
 */
export function isValidIBAN(iban: string, strictMod97: boolean = false): boolean {
  const clean = iban.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;

  // Italian IBAN format check
  if (clean.startsWith('IT') && clean.length === 27) {
    if (!strictMod97) return true;
  }

  // Rearrange for MOD-97
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  let numeric = '';
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else {
      numeric += rearranged[i];
    }
  }

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = remainder.toString() + numeric.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

/**
 * Validates IPv4 address string
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255 && (p === '0' || !p.startsWith('0'));
  });
}

/**
 * Validates Italian Document ID formats
 * - CIE (Carta d'Identità Elettronica): 2 letters, 5 digits, 2 letters (e.g. CA12345AA)
 * - Carta d'Identità cartacea: 2 letters, 7 digits (e.g. AA1234567 or AA 1234567)
 * - Patente di guida: standard 10 alphanumeric characters (often U1 followed by 7 alphanumeric, or format like TO1234567A)
 * - Passaporto: 2 letters + 7 numbers (e.g. YA1234567)
 */
export function isValidItalianDocument(doc: string): { isValid: boolean; docType?: string } {
  const clean = doc.replace(/\s+/g, '').toUpperCase();

  // CIE 3.0: CA00000AA
  if (/^[A-Z]{2}\d{5}[A-Z]{2}$/.test(clean)) {
    return { isValid: true, docType: "Carta d'Identità Elettronica (CIE)" };
  }

  // Passaporto italiano: 2 letters + 7 digits
  if (/^[A-Z]{2}\d{7}$/.test(clean)) {
    return { isValid: true, docType: "Passaporto / Carta d'Identità Cartacea" };
  }

  // Patente di guida italiana
  if (/^(?:[A-Z]{2}\d{7}[A-Z]|U1[A-Z0-9]{7})$/.test(clean)) {
    return { isValid: true, docType: 'Patente di Guida' };
  }

  return { isValid: false };
}
