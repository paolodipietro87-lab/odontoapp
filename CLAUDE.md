# CLAUDE.md — Progetto OdontoApp

> Cervello del progetto. Aggiornare a ogni sessione conclusa.
> Ultima modifica: 2026-06-05 (sessione 7)

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
| 12 | Numero in bozza | ✅ Nessuno: numero assegnato solo all'"Emetti" (bozza cancellabile senza bruciare numeri) |
| 13 | Fattura emessa | ✅ Sola lettura, mai modificabile (correzioni = nota credito, fuori MVP) |
| 14 | Anno del contatore | ✅ Anno della DATA fattura (non data di sistema) |
| 15 | Meccanica emissione | ✅ Approccio A: transaction unica contatore+fattura (atomica, zero buchi). Offline → resta bozza |
| 16 | Versioni PDF fattura | ✅ Una sola versione CON intestazione (unico esempio fornito). PDF solo da fattura emessa. Libreria `@react-pdf/renderer` |
| 17 | Modello conformità | ✅ Medico = anagrafica clienti (snapshot); paziente = unico campo libero (2 punti, stesso valore); bullet conservazione + Ministero/REA fissi; avvertenze/prodotti/note/termini opzionali liberi; materiali con autocomplete prodotti; sempre modificabile (no progressivo). PDF 2 versioni (prop `intestazione`: medico con header / paziente senza) |

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

### 2026-06-04 — Sessione 4 (Piano 3: Fatture + progressivo)

- **Brainstorming nodi critici progressivo** → nuove decisioni 12-15 (vedi tabella).
- **Spec + Piano scritti:** `docs/superpowers/specs/2026-06-04-fatture-progressivo-design.md`, `docs/superpowers/plans/2026-06-04-fatture-progressivo.md`.
- **Piano 3 eseguito** (subagent-driven + TDD, 6 task codice, branch `fatture`):
  - `utils/calcoli.js` (puro): `importoRiga`, `calcolaTotali` → totali FC (imponibile/imposta=0) + bollo €2 se totale > 77,47 (confine stretto `>`).
  - `services/progressivo.js`: `formattaNumero` (NNN/ANNO zero-pad) + `emettiFattura` (**transaction atomica** contatore+fattura nello stesso atto → zero buchi, numero solo online).
  - `lib/db/fatture.js`: CRUD bozze (`creaBozza/getOne/aggiornaBozza/deleteBozza/listAll`) con guard sola-lettura sulle emesse.
  - UI: `ClienteSelect` (congela snapshot), `RigaFattura` (autocomplete prodotto), `EditorFattura` (totali live + Emetti con conferma), `ListaFatture`, `DettaglioFattura` (sola lettura, bottone PDF placeholder). Routing `/fatture[/nuova|/:id|/:id/modifica]`, link da Home.
  - **62 test verdi**, build OK. Test progressivo con fake fedele di `runTransaction` (sequenza/no-buchi/anno-da-data/reject-emessa). **Nota:** progetto NON usa emulatore Firestore → mock di `firebase/firestore`; atomicità reale da confermare in e2e.
- **PDF rimandato a Piano 4** (FatturaPDF + ConformitaPDF insieme).
- **Da fare prossima sessione:** (1) **Task 7 e2e manuale** (utente: avvia app, crea bozza → Emetti → verifica 001/2026, contatore Firestore, offline blocca, delete bozza non brucia numero); (2) merge branch `fatture` → `main` + deploy; (3) Piano 4 PDF.

### 2026-06-04 — Sessione 5 (Piano 4: Fattura PDF)

- **Scope deciso:** Piano 4 = **solo Fattura PDF** (la fattura ha già i dati). Conformità (modulo da zero: data model + editor + PDF) rimandata a **Piano 5**.
- **Decisioni PDF (brainstorming):** libreria `@react-pdf/renderer`; **una sola versione CON intestazione** (unico esempio fornito, niente "senza intestazione"); PDF **solo da fattura emessa** (dettaglio sola-lettura).
- **Spec + Piano:** `docs/superpowers/specs/2026-06-04-fattura-pdf-design.md`, `docs/superpowers/plans/2026-06-04-fattura-pdf.md`.
- **Eseguito** (subagent-driven + TDD, 6 task, branch `pdf-fattura`):
  - `templates/lab.js`: costanti intestazione tecnico (unico punto di verità, estratte dall'esempio).
  - `templates/fattura.format.js` (puro, testato): `formatEuro` (it-IT, virgola, `useGrouping`), `formatPrezzo` (3 dec.), `quantitaLabel`, `risolviDestinazione` (fallback destinazione→clienteSnapshot), `fatturaToProps` (doc Firestore → props formattate). **Riusa `importoRiga` da `utils/calcoli.js`** (no duplicato money math).
  - `templates/fatturaPdf.styles.js` + `templates/FatturaPDF.jsx`: layout @react-pdf copia fedele (header, box nr/data, Destinatario|Destinazione, tabella righe, riepilogo FC, box totali, note legali, Pag.1).
  - `components/fatture/PulsanteScaricaPdf.jsx`: `PDFDownloadLink`, file `Fattura_NNN-ANNO_denominazione.pdf`. Sostituito il placeholder in `DettaglioFattura`.
  - `vite.config.js`: alzato `workbox.maximumFileSizeToCacheInBytes` a 5 MiB (bundle @react-pdf ~2,5 MB > default 2 MiB).
- **Verifica fedeltà:** generato PDF di prova coi dati dell'esempio 9 e confrontato fianco-a-fianco → **copia fedele**. Unica differenza voluta: numero `009/2024` (formato nostro NNN/ANNO) vs `9` secco di Danea.
- **73 test verdi**, build OK. Code review passata (fix DRY money math applicato).
- **Da fare prossima sessione:** (1) merge `pdf-fattura` → `main` + deploy; (2) e2e reale dell'utente (scarica PDF da una fattura emessa live); (3) **Piano 5 Conformità** (modulo completo: data model rapportino + editor + PDF con/senza intestazione, 3 doc in 1).

### 2026-06-05 — Sessione 6 (Piano 5: Conformità completo)

- **Decisione #17** (brainstorming): medico = anagrafica clienti (snapshot); paziente = unico campo libero (non in anagrafica, compare in 2 punti col stesso valore); bullet conservazione + N° Ministero/REA fissi; avvertenze/prodotti/note/termini opzionali liberi; materiali con autocomplete prodotti (Tipo←descrizione, Fabbricante←produttore, Modello←descrizione, Lotto a mano); **sempre modificabile** (no progressivo, no stato).
- **Spec + Piano:** `docs/superpowers/specs/2026-06-04-conformita-design.md`, `docs/superpowers/plans/2026-06-04-conformita.md`.
- **Piano 5 eseguito** (TDD, 11 task, branch `conformita`, poi merge `main`):
  - `templates/lab.js` esteso (`nomeUpper/ministero/rea`) + `templates/conformita.fixed.js` (testi legali fissi: bullet, dichiarazione, istruzioni d'uso, footer firme).
  - `templates/conformita.format.js` (puro, testato): `conformitaToProps` (date passthrough, paziente trim, prescrivente da clienteSnapshot) + `pulisciMateriali` (scarta righe vuote).
  - `lib/db/conformita.js`: CRUD pieno (`crea/getOne/aggiorna/elimina/listAll`), niente guard (sempre editabile), collection `conformita`, ordine `data desc`.
  - `templates/conformitaPdf.styles.js` + `templates/ConformitaPDF.jsx`: copia fedele @react-pdf. **Prop `intestazione`**: `true` = render header lab (per medico), `false` = senza (per paziente). Layout: Ministero+REA, box Dichiarazione|Etichettatura affiancati, tabella materiali, istruzioni d'uso fisse, footer firme.
  - `components/conformita/PulsanteScaricaPdfConformita.jsx` (prop `intestazione`+`label`, file `Rapporto_<data>_<paziente>[_paziente].pdf`) + `RigaMateriale.jsx` (autocomplete prodotti).
  - UI: `pages/Conformita/{EditorConformita,ListaConformita,DettaglioConformita}.jsx`. Editor riusa `ClienteSelect`. Lista ricerca paziente/data. Dettaglio = **2 bottoni PDF** (per medico / per paziente). Routing `/conformita[/nuova|/:id|/:id/modifica]`, link Home attivo.
- **Verifica fedeltà:** generati i 2 PDF di prova (dati esempio Botticelli Angela / Dott. Sacripante / 2 righe Ivoclar) e letti → **copia fedele** di entrambi gli esempi. Versione paziente correttamente senza header lab.
- **88 test verdi**, build OK. Merge `conformita` → `main` + deploy GitHub Pages.
- **Nota processo:** i subagent hanno colpito il limite di sessione a metà; task implementati direttamente, ognuno verificato (test+build verdi, fedeltà PDF confermata).
- **Da fare prossima sessione:** (1) **e2e reale utente** (crea rapportino live → scarica i 2 PDF, verifica fedeltà su stampa); (2) feedback su layout/campi; (3) **pre-consegna: azzerare fatture test + contatore** prima di Pietro.

### 2026-06-05 — Sessione 7 (e2e conformità + e2e fattura + fix offline)

- **Conformità e2e dal vivo: OK.** Utente ha creato rapportino live + scaricato i 2 PDF → "tutto perfetto". Modulo Conformità chiuso al 100%.
- **e2e fattura (Task 7) dal vivo: OK** su tutti i passi (bozza senza numero → Emetti → `001/2026` → contatore Firestore → delete bozza no buco). Unico nodo: passo 5 offline.
- **Bug offline trovato + fixato (2 commit):**
  - Sintomo: offline → Emetti non emette (giusto) ma **nessun messaggio** e al rientro online la fattura si **auto-emetteva senza click** (violava decisione #15).
  - Causa reale: `salvaSilenzioso` chiama `addDoc`/`updateDoc` (`lib/db/fatture.js`); **offline la promise di scrittura Firestore non si risolve** → resta appesa, la guardia dentro `emettiFattura` non veniva mai raggiunta, spinner infinito.
  - Fix: **check `navigator.onLine` in cima a `emetti()`** (`pages/Fatture/EditorFattura.jsx`), PRIMA di toccare Firestore → messaggio immediato, niente scrittura appesa, niente auto-emit. Guardia in `services/progressivo.js` mantenuta come difesa-in-profondità (rete cade a metà transaction) + 1 test offline.
  - **89 test verdi**, build OK, deploy GitHub Pages verde, ritest live utente: **funziona**.
- **Lezione (offline-first Firestore):** le write offline NON rigettano né risolvono finché non torni online. Per azioni che richiedono rete (es. emissione numero) **guardare `navigator.onLine` PRIMA della prima scrittura**, non dopo.
- **Da fare prossima sessione:** **pre-consegna** (su richiesta utente): azzerare fatture test + doc `contatori/{anno}` in Firestore prima di Pietro. Resto MVP completo e live.
