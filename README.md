# AI Anonymizer 🛡️🇮🇹

Applicativo web-based moderno progettato per **anonimizzare e de-anonimizzare bidirezionalmente i prompt inviati e ricevuti da e verso modelli di Intelligenza Artificiale** (es. OpenAI ChatGPT, Anthropic Claude).

Garantisce il rispetto rigoroso dei formati e standard italiani e internazionali con architettura **Zero-Leak**: nessun dato personale o sensibile in chiaro viene mai trasmesso all'esterno.

---

## 🚀 Caratteristiche Principali

- **Anonimizzazione Standard Italiani & Internazionali**:
  - 🔑 **API Keys & Tokens**: OpenAI (`sk-...`), Anthropic (`sk-ant-...`), AWS Access Keys (`AKIA...`), GitHub (`ghp_...`), JWT, Stripe, token bearer e chiavi generiche.
  - ✉️ **Email addresses**: Riconoscimento RFC 5322.
  - 🌐 **URLs**: Link web (http, https, ftp, domini).
  - 🖥️ **MAC addresses**: Formati standard esadecimale (`XX:XX:XX:XX:XX:XX`, `XXXX.XXXX.XXXX`).
  - 📡 **IP addresses**: Indirizzi IPv4 e IPv6 con validazione ottetti.
  - 🆔 **UUIDs**: UUID v1-v5 e GUID 8-4-4-4-12.
  - 🏦 **IBAN & Bank codes**: IBAN italiano (27 caratteri `IT...`), IBAN internazionali (con algoritmo MOD-97), codici bancari **ABI**, **CAB** e **SWIFT/BIC**.
  - 💳 **Credit card numbers**: Visa, MasterCard, American Express, Diners, con verifica **algoritmo di Luhn**.
  - 🏛️ **Codice Fiscale & Partita IVA**: Riconoscimento conforme alle specifiche dell'Agenzia delle Entrate, gestione omocodia, e verifica del carattere di controllo.
  - 📞 **Phone numbers**: Numeri italiani con o senza prefisso internazionale (`+39`, `0039`), cellulari (`3xx`) e numerazioni fisse (`0xx`).
  - 🪪 **Document ID italiani**: Carta d'Identità Elettronica (**CIE 3.0** es. `CA00000AA`), Carta d'Identità cartacea, Patente di Guida italiana e Passaporto.
  - 🏷️ **Stringhe Personalizzate**: Possibilità di definire parole, nomi di persone, aziende, codici interni o regex personalizzate.

- **Interfaccia Affiancata a 2 Text Box**:
  - **Box Sinistra**: Inserimento del prompt originale (dati in chiaro elaborati solo in locale).
  - **Box Destra**: Risultato sanificato e anonimizzato con etichette coerenti (es. `[CODICE_FISCALE_1]`, `[IBAN_1]`, `[EMAIL_1]`).

- **Funzionamento Bidirezionale con Ripristino Automatico**:
  - Tiene traccia nel dizionario di decodifica di ogni associazione tra entità originale e placeholder.
  - Quando l'AI risponde, l'applicazione riceve la risposta con le etichette e **riconverte il risultato risostituendo alle etichette il testo originale**.
  - Schede per visualizzare sia la *Risposta Ripristinata* sia la *Risposta Grezza* dell'AI.
  - Pulsante di conversione manuale inversa per de-anonimizzare qualsiasi testo.

- **Integrazione API AI (ChatGPT, Claude & Simulatore)**:
  - Collegamento facoltativo alle API ufficiali di **OpenAI** (GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5) e **Anthropic** (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus).
  - **Simulatore Locale Gratuito integrato**: permette di testare immediatamente l'intero ciclo di anonimizzazione e ripristino senza necessità di inserire chiavi API a pagamento.

- **Box Statistiche & Token Rimanenti Sempre Visibile**:
  - Scheda dashboard sempre visibile a schermo che riporta:
    - Provider e Modello AI attivo.
    - Token dell'ultima chiamata (Prompt e Risposta).
    - Token accumulati nella sessione.
    - **Finestra di contesto massima e Token rimanenti per quella specifica AI** (con barra di avanzamento percentuale).
    - Numero di richieste completate e stima del costo in dollari.

- **Garanzia Zero-Leak**:
  - Audit client-side e server-side pre-volo che scansiona il payload in uscita prima di inviarlo all'AI per assicurare che nessun dato grezzo sia presente nel testo trasmesso.

---

## 🛠️ Tecnologie Utilizzate

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icone**: [Lucide React](https://lucide.dev/)
- **Test Runner**: Test suite automatizzata (`scripts/test-engine.ts`) con `tsx`

---

## 💻 Come Avviare l'Applicativo

### 1. Avvio in modalità Sviluppo
```bash
npm run dev
```
L'applicazione sarà accessibile all'indirizzo: `http://localhost:3000`

### 2. Esecuzione dei Test di Validazione
Per verificare che tutti i controlli (Codice Fiscale, CIE, IBAN, Carte di Credito, Regex e Ripristino) passino con successo:
```bash
npm test
```

### 3. Build di Produzione
```bash
npm run build
npm start
```

---

## 📖 Guida all'Uso Rapido

1. **Inserisci il prompt** nella text box di sinistra (oppure clicca sul pulsante **"Carica Esempi"** nella barra superiore per caricare uno scenario di test realistico).
2. Il testo sanificato comparirà in tempo reale nella text box di destra, e la tabella in basso mostrerà tutte le entità rilevate.
3. Se desideri proteggere termini specifici (es. il nome della tua azienda o di un progetto), clicca su **"Stringhe Personalizzate"** e aggiungili.
4. Clicca su **"Invia Anonimizzato ad AI & Ripristina Risposta"**:
   - Di default è attivo il *Simulatore Locale*, che ti mostra istantaneamente la risposta dell'AI con i dati originali ripristinati.
   - Cliccando su **"AI: Configura"** puoi impostare la tua API Key di OpenAI o Anthropic per usare modelli reali (GPT-4o, Claude 3.5 Sonnet, ecc.).
5. Controlla in ogni momento il box sempre visibile delle statistiche con i **token rimanenti** per il modello selezionato.
