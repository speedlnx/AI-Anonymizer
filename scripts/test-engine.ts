import { AnonymizerEngine } from '../src/lib/anonymizer/engine';
import {
  isValidCodiceFiscale,
  isValidPartitaIva,
  isValidLuhn,
  isValidIBAN,
  isValidIPv4,
  isValidItalianDocument,
} from '../src/lib/anonymizer/validators';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log('--- TEST 1: VALIDATORS ---');
// Codice Fiscale
assert(isValidCodiceFiscale('RSSMRA85M01H501Q', true), 'Strict Italian Codice Fiscale checksum');
assert(isValidCodiceFiscale('RSSMRA85M01H501Z', false), 'Structural Italian Codice Fiscale format (privacy mode)');
assert(!isValidCodiceFiscale('NOT_A_CF', false), 'Invalid format rejected');

// Partita IVA
assert(isValidPartitaIva('01234567897', true), 'Valid Italian Partita IVA');
assert(!isValidPartitaIva('01234567890', true), 'Invalid Partita IVA checksum rejected in strict mode');

// Luhn algorithm (Credit card)
assert(isValidLuhn('4532015112830366'), 'Valid Visa test card with Luhn');
assert(!isValidLuhn('4532015112830367'), 'Invalid credit card Luhn rejected');

// IBAN
assert(isValidIBAN('IT60X0542811101000000123456', true), 'Valid Italian IBAN with MOD-97');
assert(!isValidIBAN('IT60X0542811101000000123459', true), 'Invalid IBAN rejected in strict mode');

// Italian Documents
assert(isValidItalianDocument('CA12345AA').isValid, 'Valid Italian CIE');
assert(isValidItalianDocument('YA1234567').isValid, 'Valid Italian Passport');
assert(isValidItalianDocument('U1234567A').isValid, 'Valid Italian Driving License');

// IPv4
assert(isValidIPv4('192.168.1.1'), 'Valid IPv4');
assert(!isValidIPv4('256.1.1.1'), 'Invalid IPv4 256 rejected');

console.log('\n--- TEST 2: ALL REQUIRED ENTITY ANONYMIZATION ---');
const complexPrompt = `
Richiesta per cliente Mario Rossi:
- Email: mario.rossi@test.it
- Codice Fiscale: RSSMRA85M01H501Z
- Documento CIE: CA12345AA
- IBAN: IT60X0542811101000000123456
- ABI 05428 e CAB 11101
- Carta Credito: 4532 0151 1283 0366
- Telefono: +39 347 1234567 oppure 02 89012345
- IP: 192.168.1.100 e MAC: 00:1B:44:11:3A:B7
- UUID: 123e4567-e89b-12d3-a456-426614174000
- URL: https://portale-clienti.it/login?token=abc
- API Key OpenAI: sk-proj-abC123Def456Ghi789Jkl012Mno345Pqr678Stu901VwxYz
`;

const customRules = [
  { id: '1', text: 'Mario Rossi', isRegex: false, caseSensitive: false, categoryLabel: 'Nome Cliente' }
];

const result = AnonymizerEngine.anonymize(complexPrompt, customRules);
console.log('Anonymized Text Preview:\n', result.anonymizedText);

assert(result.anonymizedText.includes('[CUSTOM_1]'), 'Anonymized custom string "Mario Rossi"');
assert(result.anonymizedText.includes('[EMAIL_1]'), 'Anonymized email');
assert(result.anonymizedText.includes('[CODICE_FISCALE_1]'), 'Anonymized Codice Fiscale');
assert(result.anonymizedText.includes('[DOCUMENT_ID_1]'), 'Anonymized CIE document');
assert(result.anonymizedText.includes('[IBAN_1]'), 'Anonymized Italian IBAN');
assert(result.anonymizedText.includes('[CREDIT_CARD_1]'), 'Anonymized Credit Card');
assert(result.anonymizedText.includes('[PHONE_1]'), 'Anonymized Phone');
assert(result.anonymizedText.includes('[IP_ADDRESS_1]'), 'Anonymized IP');
assert(result.anonymizedText.includes('[MAC_ADDRESS_1]'), 'Anonymized MAC');
assert(result.anonymizedText.includes('[UUID_1]'), 'Anonymized UUID');
assert(result.anonymizedText.includes('[URL_1]'), 'Anonymized URL');
assert(result.anonymizedText.includes('[API_KEY_1]'), 'Anonymized API Key');

console.log('\n--- TEST 3: ZERO-LEAK AUDIT CHECK ---');
const leakCheckSafe = AnonymizerEngine.auditForDataLeak(result.anonymizedText, result.mappings);
assert(leakCheckSafe.safe, 'Anonymized text contains NO leaked secrets');

const textWithLeak = result.anonymizedText + ' Mario Rossi';
const leakCheckUnsafe = AnonymizerEngine.auditForDataLeak(textWithLeak, result.mappings);
assert(!leakCheckUnsafe.safe, 'Leak detector successfully caught injected secret "Mario Rossi"');

console.log('\n--- TEST 4: BIDIRECTIONAL DE-ANONYMIZATION (AI RESTITUTION) ---');
const simulatedAiResponse = `
Gentile operatore,
abbiamo verificato la richiesta per [CUSTOM_1].
Il codice fiscale [CODICE_FISCALE_1] risulta censito regolarmente.
L'accredito è stato autorizzato su IBAN [IBAN_1] ed inviata notifica all'indirizzo [EMAIL_1].
`;

const deanonymized = AnonymizerEngine.deanonymize(simulatedAiResponse, result.mappings);
console.log('Restored AI Response:\n', deanonymized.restoredText);

assert(deanonymized.restoredText.includes('Mario Rossi'), 'Restored Mario Rossi');
assert(deanonymized.restoredText.includes('RSSMRA85M01H501Z'), 'Restored Codice Fiscale');
assert(deanonymized.restoredText.includes('IT60X0542811101000000123456'), 'Restored IBAN');
assert(deanonymized.restoredText.includes('mario.rossi@test.it'), 'Restored Email');
assert(!deanonymized.restoredText.includes('[CODICE_FISCALE_1]'), 'No lingering placeholder tags in restored text');

console.log('\nALL ENGINE & SPEC TESTS PASSED PERFECTLY!');
