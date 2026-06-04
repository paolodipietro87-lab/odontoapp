# CLAUDE.md — Progetto OdontoApp

> Cervello del progetto. Aggiornare a ogni sessione conclusa.
> Ultima modifica: 2026-06-01

---

## Identità del progetto

App gestionale PWA per odontotecnico, sostituta di Danea Easyfatt (versione crackato in dismissione).
Scope ridotto e deliberato: solo **fatture** e **conformità**. Niente contabilità, niente trasmissione SDI.

**Priorità assolute (non negoziabili):**
1. Costo = €0 (stack, hosting, servizi)
2. Stabilità e affidabilità del prodotto
3. Tolleranza zero sugli errori dei progressivi fattura

---

## Stack tecnologico (decisioni prese)

| Layer | Scelta | Motivazione |
|---|---|---|
| Frontend | React + Vite | Ecosistema maturo, PWA-ready, ottimo tooling |
| Hosting | GitHub Pages | Gratuito, CI/CD via GitHub Actions |
| CSS | Tailwind CSS | Produttività UI, nessun costo |
| PDF generation | react-pdf / jsPDF | Gratuiti, funzionano lato client |
| Excel import | SheetJS (xlsx) | Parsing lato client, nessun server |

**⚠️ DECISIONE APERTA — Storage e sincronizzazione:**
Il requisito è "dati in locale + sincronizzati su più dispositivi". Queste due cose si escludono con il puro localStorage/IndexedDB. Opzioni valutate:

- **Firebase Firestore free tier** → 1 GB storage, 50k letture/giorno, 20k scritture/giorno. Zero server. **Opzione preferita.**
- **Supabase free tier** → alternativa open-source, 500 MB DB, 2 GB bandwidth.
- **GitHub come backend** → store JSON su repo privato via API. Lento, hacky, sconsigliato.

**Quando il cliente porta i file di esempio, decidere definitivamente prima di scrivere il data layer.**

**Account GitHub:** verificare se il progetto può usare l'account esistente del cliente o se serve uno separato (es. per separare repository personali da quelli professionali). Chiedere all'inizio della prima sessione operativa.

---

## Funzionalità nel scope (MVP)

### 1. Fatture
- Creazione fattura con progressivo annuale automatico (formato: `NNN/ANNO`, es. `001/2026`)
- Progressivo gestito lato server/DB con lock per garantire unicità — **mai lato client puro**
- Bollo €2,00 automatico su fatture esenti IVA sopra €77,47
- Regime IVA: **da verificare sui PDF di esempio forniti dal cliente**
- Intestazione tecnico: **da estrarre dai PDF di esempio**
- Output: PDF in due versioni (con/senza intestazione) — **no** trasmissione AdE
- Annullamento fattura: nota di credito (sviluppo futuro, non in MVP)
- Stampa / download PDF / condivisione con commercialista

### 2. Conformità (Rapportini d'intervento)
- Struttura **fissa** (da definire sui PDF di esempio)
- Documento **indipendente** dalla fattura (nessun collegamento di progressivo)
- Due versioni PDF:
  - Con intestazione del tecnico → per il medico richiedente
  - Senza intestazione → per il paziente
- Nessun progressivo obbligatorio (decidere se aggiungere un riferimento interno opzionale)

---

## Funzionalità fuori scope (MVP)

- Trasmissione fatture a SDI / Agenzia delle Entrate
- Contabilità e prima nota
- Gestione magazzino avanzata
- Nota di credito (sviluppo futuro)
- Multi-utente / permessi
- App mobile nativa (la PWA copre smartphone e tablet)

---

## Anagrafiche e dati

### Import iniziale da Excel
Il cliente ha file Excel pronti (colonne standard) per:
- **Clienti** (medici/studi dentistici)
- **Fornitori**
- **Prodotti/Listino**

Import una-tantum via interfaccia dedicata. Funzione di re-import manuale disponibile all'occorrenza.

### Archivio storico (.bef)
Il cliente ha l'archivio Danea in formato `.bef` (database proprietario).
Importare solo se serve migrare fatture storiche — da valutare. Tenere disponibile ma non bloccare l'MVP su questo.

### Export automatico
- Export Excel automatico (frequenza da definire — es. ogni salvataggio, o giornaliero)
- Export manuale su richiesta

---

## File di riferimento (forniti dal cliente)

Da inserire nella cartella `/reference` del progetto all'inizio della prima sessione operativa:
- [ ] PDF fattura di esempio → definisce layout, intestazione, regime IVA, bollo
- [ ] PDF conformità di esempio → definisce struttura fissa del rapportino
- [ ] File Excel clienti
- [ ] File Excel fornitori
- [ ] File Excel prodotti/listino
- [ ] Archivio `.bef` (opzionale, solo per migrazione storico)
- [ ] Cartella installer Danea (opzionale, solo per reverse engineering formato)

**Non iniziare a sviluppare template PDF prima di analizzare questi file.**

---

## Workflow standard (regole di sessione)

1. **Domande prima di implementare** — mai iniziare a codificare senza aver chiarito i requisiti
2. **Verifica nel codice esistente** prima di proporre nuove feature o refactor
3. **Brainstorming** su decisioni architetturali importanti, proporre opzioni con pro/contro
4. **Aggiornare questo file** a ogni sessione conclusa (sezione Changelog)
5. **Obsidian vault:** percorso da comunicare dal cliente a tempo debito — sincronizzare CLAUDE.md anche lì
6. **Lingua:** italiano per comunicazione, inglese per codice e commenti
7. **Caveman mode:** spiegazioni semplici e dirette, zero fronzoli
8. **Zero tolleranza progressivi:** qualsiasi logica che tocca il numero fattura va revisionata due volte e testata esplicitamente

---

## Struttura repository (proposta)

```
odoapp/
├── public/
├── src/
│   ├── components/
│   │   ├── fatture/
│   │   ├── conformita/
│   │   └── anagrafiche/
│   ├── hooks/
│   ├── services/
│   │   ├── db.js          # layer storage (Firebase o alternativa)
│   │   ├── pdf.js         # generazione PDF
│   │   └── excel.js       # import/export Excel
│   ├── templates/
│   │   ├── fattura.jsx    # template PDF fattura
│   │   └── conformita.jsx # template PDF conformità
│   └── utils/
│       └── progressivo.js # logica progressivo fattura — CRITICA
├── reference/             # file di esempio cliente (gitignore se sensibili)
├── CLAUDE.md              # questo file
└── README.md
```

---

## Decisioni aperte (da risolvere in sessione)

| # | Decisione | Stato |
|---|---|---|
| 1 | Storage sync multi-device | ✅ Firebase Firestore (offline persistence nativa) |
| 2 | Account GitHub: stesso o nuovo? | ✅ Account `paolodipietro87-lab`, repo **pubblico** `odontoapp`, deploy GitHub Pages |
| 3 | Regime IVA esatto | ✅ Fuori Campo IVA (FC) su tutto, bollo €2 se >77,47 |
| 4 | Layout fattura e conformità | ✅ Estratti dagli esempi (conformità = 3 doc in 1) |
| 5 | Percorso Obsidian vault | ⏳ In attesa cliente |
| 6 | Migrazione storico .bef | ✅ No, parte pulita |
| 7 | Riferimento interno conformità | ✅ No numero, ricerca per paziente/data |
| 8 | Frequenza export Excel | ✅ Manuale on-demand |
| 9 | Formato progressivo | ✅ NNN/ANNO, da 001/2026, reset annuale |
| 10 | Offline behavior | ✅ Offline-first, numero fattura solo online (transaction) |
| 11 | Auth | ✅ Firebase Auth, 1 solo account (Pietro admin) |

---

## Changelog sessioni

### 2026-06-01 — Sessione 0 (brainstorming)
- Definiti requisiti core: PWA, fatture + conformità, costo zero
- Stack tecnologico definito (React+Vite, GitHub Pages, react-pdf, SheetJS)
- Identificata tensione locale/multi-device → proposta Firebase free tier
- Raccolte tutte le risposte al brainstorming iniziale
- Creato questo file CLAUDE.md
- **Prossimo passo:** cliente inserisce file di riferimento nella cartella progetto, si parte con l'analisi dei PDF e la decisione sullo storage

### 2026-06-03 — Sessione 1 (analisi file + design + piano)
- Analizzati tutti i file di riferimento (fattura, conformità x2, Excel clienti/fornitori/prodotti)
- Risolte decisioni 1,3,4,6,7,8 + nuove 9,10,11 (vedi tabella sopra)
- Scoperte chiave: regime tutto FC, conformità = 3 documenti in 1, Excel encoding latin1
- Scritto spec completo: `docs/superpowers/specs/2026-06-03-odontoapp-design.md`
- Progetto spezzato in 5 piani incrementali; scritto Piano 1 Foundation: `docs/superpowers/plans/2026-06-03-foundation.md`
- Iniziato Task 0 (setup Firebase): bloccato su limite progetti account → richiesto aumento a Google
- **Prossimo passo:** approvazione aumento Firebase → creare progetto `odontoapp-boromei` → catturare firebaseConfig → eseguire piano Foundation

### 2026-06-04 — Sessione 2 (Foundation + Anagrafiche + CRUD)
- Firebase creato: progetto `odontoapp-boromei` (piano Spark, eur3), Firestore + Auth Email/Password + regole (solo utente autenticato). `.env.local` popolato (gitignored). Admin = mail Paolo; Pietro da aggiungere dopo.
- Repo git inizializzato in `Peter/`, file cliente (PDF/xlsx/.bef/installer) gitignorati. Branch `foundation` poi `anagrafiche`.
- **Piano Foundation eseguito** (subagent-driven, 8 task): Vite+React+Tailwind+Vitest, Firebase init con offline persistence, auth hook + Login, SyncStatusBadge, app shell, PWA manifest/sw, workflow deploy GitHub Pages. App testata in locale: login + home OK.
- **Piano Anagrafiche eseguito**: parser Excel (mapping colonne Danea, header mojibake tollerato), data layer Firestore (importRows/listAll), import page (upload/preview/conferma), lista con ricerca, routing react-router. Import reale dei 3 file Danea verificato OK.
- **Piano Anagrafiche CRUD eseguito**: schema campi, getOne/upsertOne/deleteOne, ConfirmDialog, RecordEditor (cod immutabile in edit), azioni Modifica/Elimina con conferma. 31 test verdi, build OK.
- Nuova decisione: CRUD anagrafiche = solo record (campi fissi), delete con dialog conferma.
- **Da fare prossima sessione:** (1) avviare server → utente testa ricerca "intelligente" + CRUD; (2) decisione #2 account/repo GitHub → deploy online; (3) merge branch; (4) Piano 3 Fatture+progressivo.
- Spec: `docs/superpowers/specs/2026-06-03-odontoapp-design.md`. Piani: `docs/superpowers/plans/2026-06-0{3,4}-*.md`.

### 2026-06-04 — Sessione 3 (estensione campi anagrafiche)

- Verifica manuale ricerca lista + CRUD: OK (P2b Task 7 chiuso).
- Scoperto che gli Excel Danea hanno 44 colonne (clienti/fornitori) e 48 (prodotti); mapping iniziale ne teneva solo 9 e 6. Decisione: **set curato esteso** (no raw dump).
  - Clienti/Fornitori 9→21: + Referente, Tel, Cell, Fax, e-mail, Pec, Sconti, Listino, Fido, Agente, Note, Note doc.
  - Prodotti 6→16: + Categoria, Sottocategoria, Listino 2/3, Note, Cod. a barre, Produttore, Cod. fornitore, Fornitore, Prezzo forn.
  - Scartati di proposito: magazzino, SDD/banca, campi PA (fuori scope SDI), Extra 1-6, Regione/Nazione.
- File toccati: `src/pages/Anagrafiche/schema.js`, `src/services/excel.js` (+ test). `RecordEditor` rende i campi da `FIELDS[kind]` → nuovi campi automatici. 33 test verdi. Ri-import reale dei 3 Excel da UI: OK.
- **Deploy live (decisione #2 risolta):** account GitHub `paolodipietro87-lab`, repo **pubblico** `odontoapp` (Pages free non supporta repo privati su piano €0; chiavi Firebase non sono segrete → repo pubblico OK, sicurezza via regole Firestore+Auth). 6 secret `VITE_FB_*` caricati, branch `main` = tutto il lavoro. Workflow fixato (env Firebase passate anche allo step `npm test`, prima fallava `auth/invalid-api-key`). Deploy verde.
  - **URL live:** https://paolodipietro87-lab.github.io/odontoapp/
  - Aggiunto dominio `paolodipietro87-lab.github.io` agli Authorized domains Firebase Auth (necessario, altrimenti `auth/unauthorized-domain`). Login live verificato OK.
  - Branch locali `foundation`/`anagrafiche`/`master` eliminati (tutto in `main`).
- **Da fare:** Piano 3 Fatture + progressivo (critico, zero-tolleranza).
