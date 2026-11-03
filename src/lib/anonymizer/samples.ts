export interface SamplePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  customRules?: { text: string; categoryLabel: string }[];
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'banking-support',
    title: 'Assistenza Bancaria & Fiscale (Completo Standard IT)',
    description: 'Include Codice Fiscale, CIE, IBAN italiano, Carta di Credito, Email e Telefono',
    prompt: `Gentile operatore,
devo richiedere la verifica del bonifico bancario per il cliente Mario Rossi, Codice Fiscale RSSMRA85M01H501Z.
Il documento di identità allegato è la CIE numero CA12345AA.
I recapiti di contatto sono l'email mario.rossi@aziendaitalia.it e il cellulare +39 347 1234567 oppure il fisso 02 89012345.
L'accredito deve essere effettuato sul conto corrente avente IBAN IT60X0542811101000000123456 con ABI 05428 e CAB 11101.
Per il pagamento della quota di gestione di 15 euro si autorizza l'addebito sulla Carta di Credito Visa 4532 0151 1283 0366 con scadenza 12/28.
Potete confermarmi la ricezione e predisporre il saldo?`,
    customRules: [
      { text: 'Mario Rossi', categoryLabel: 'Nome Cliente' },
      { text: 'Azienda Italia', categoryLabel: 'Azienda' },
    ],
  },
  {
    id: 'devops-incident',
    title: 'Incident DevOps & Sicurezza Cloud',
    description: 'Include API Key OpenAI, AWS, IP address, MAC address, UUID e URL interni',
    prompt: `Report di incidente sul cluster di produzione Kubernetes:
L'host con indirizzo IP 192.168.1.145 e MAC address 00:1B:44:11:3A:B7 non risponde al nodo master.
L'UUID del pod compromesso è 123e4567-e89b-12d3-a456-426614174000.
Nei log sono state individuate chiamate anomale verso https://internal-api.securenets.it/v1/auth/export?token=admin.
Nel file di configurazione sono rimaste esposte la chiave AWS AKIAIOSFODNN7EXAMPLE e la OpenAI key sk-proj-abC123Def456Ghi789Jkl012Mno345Pqr678Stu901VwxYz.
Si richiede di analizzare la gravità dell'incidente e suggerire le patch di remediation.`,
    customRules: [
      { text: 'Kubernetes', categoryLabel: 'Tecnologia' },
      { text: 'securenets.it', categoryLabel: 'Dominio Interno' },
    ],
  },
  {
    id: 'legal-contract',
    title: 'Contratto Commerciale & Partita IVA',
    description: 'Include Partita IVA italiana, Passaporto, SWIFT/BIC e clausole riservate',
    prompt: `Si trasmette per revisione legale la bozza del contratto di fornitura tra Servizi Digitali SpA (P.IVA 01234567897) e il fornitore estero.
Il rappresentante legale si è identificato mediante passaporto italiano YA1234567.
Per le transazioni internazionali si farà riferimento al codice bancario SWIFT UNCRITM1XXX.
Inviare le controdeduzioni e l'analisi di conformità al recapito legale-team@servizidigitali.com.`,
    customRules: [
      { text: 'Servizi Digitali SpA', categoryLabel: 'Ragione Sociale' },
    ],
  },
];

