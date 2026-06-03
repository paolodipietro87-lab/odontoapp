# OdontoApp — Design Spec

> Data: 2026-06-03
> Stato: approvato in brainstorming, in attesa review utente
> Progetto: gestionale PWA per Laboratorio Odontotecnico Boromei Pietro (sostituto Danea Easyfatt)

---

## 1. Obiettivo e scope

App gestionale **PWA** per odontotecnico. Scope deliberatamente ridotto: solo **fatture** e
**conformità** (rapportini d'intervento). Niente contabilità, niente trasmissione SDI.

**Priorità non negoziabili:**
1. Costo = €0 (stack, hosting, servizi)
2. Stabilità e affidabilità
3. Tolleranza zero sugli errori dei progressivi fattura

**Fuori scope MVP:** trasmissione SDI/AdE, contabilità, magazzino avanzato, nota di credito,
multi-utente, app nativa, migrazione storico `.bef`.

---

## 2. Decisioni prese (brainstorming 2026-06-03)

| Tema | Decisione |
|---|---|
| Storage/sync | **Firebase Firestore** (account esistente utente, **progetto nuovo dedicato**, piano Spark gratuito) |
| Sync | Reale multi-device: PC + tablet + telefono |
| Offline | **Offline-first** (Firestore offline persistence). Eccezione: numero fattura solo online |
| Regime IVA | **Fuori Campo IVA (FC)** su tutto. Imponibile €0, IVA €0 |
| Bollo | €2,00 automatico se totale documento > €77,47 |
| Progressivo fattura | Formato **`NNN/ANNO`** (zero-pad 3 cifre). Parte da **001/2026**. Reset annuale |
| Storico `.bef` | **No migrazione**. App parte pulita dal 2026 |
| Conformità | Boilerplate fisso + campi editabili con autocomplete. **Nessun numero interno** |
| Export Excel | **Manuale on-demand** |
| PDF | `@react-pdf/renderer`, template = copia fedele degli esempi forniti |
| Auth | Firebase Auth, **1 solo account** (Pietro, admin) per security rules |

**Da chiudere a tempo debito (non bloccanti):** account/repo GitHub (#2), path Obsidian vault (#5).

---

## 3. Dati estratti dagli esempi cliente

### Intestazione tecnico (header documenti)
```
LABORATORIO ODONTOTECNICO Boromei Pietro
Colle Caruno Castagneto - 64100 TERAMO (TE)
Tel. 368-7876100
C.F. BRM PTR 63M23 L103O   P.Iva 01725020679
```
Conformità aggiunge: `N° MINISTERO DELLA SANITA' ITCA01027879` · `R.E.A 147477`

### Fattura esempio (nr. 9 del 29/12/2024)
- Tutte le righe IVA = **FC** (Fuori campo IVA)
- Box affiancati: Destinatario / Destinazione
- Righe: Codice, Descrizione, Quantità+UM, Prezzo, Sconto, Importo, IVA
- Footer: Tot. imponibile €0, Tot. IVA €0, Tot. fuori campo, Bolli €2,00, Tot. documento
- Pagamento "A vista fattura" + Scadenze; note legali fisse (D.Lgs 196/2003, CONAI)

### Conformità esempio (3 documenti in 1)
- Dichiarazione del fabbricante + Etichettatura + Istruzioni d'uso
- Versione con intestazione (per medico) / senza intestazione (per paziente)
- Campi variabili: paziente, prescrivente, dispositivo, descrizione, date, tabella
  materiali (Tipo/Fabbricante/Modello/Lotto), N° Min. Sanità
- Testo istruzioni d'uso = boilerplate fisso lungo
- Footer: "LA FIRMA CONVALIDA I TRE DOCUMENTI" / "FIRMA DEL MEDICO PER RICEVUTA"

### Excel anagrafiche (export Danea, encoding latin1)
- Clienti/Fornitori: Cod, Denominazione, Indirizzo, Cap, Città, Prov, CF, P.Iva, Pagamento (resto vuoto)
- Prodotti (70 righe): Cod, Descrizione, Tipologia, UdM, Cod.Iva (FC), Listino 1
- ⚠️ Import deve gestire latin1 (es. `Città`)

---

## 4. Stack tecnologico

| Layer | Scelta |
|---|---|
| Frontend | React + Vite (PWA) |
| Hosting | GitHub Pages (CI/CD GitHub Actions) |
| CSS | Tailwind CSS |
| DB / sync | Firebase Firestore (offline persistence nativa) |
| Auth | Firebase Auth (1 account email/password) |
| PDF | `@react-pdf/renderer` |
| Excel | SheetJS (xlsx), import/export client-side |
| Test | Vitest + emulatore Firestore |

---

## 5. Modello dati (Firestore)

```
contatori/
  <anno>           → { ultimoNumero: number }          // transaction-locked

fatture/
  <id>             → { stato: "bozza"|"emessa",
                       numero: number, anno: number,
                       numeroFormattato: "012/2026",
                       data, clienteId,
                       clienteSnapshot { denominazione, indirizzo, cap, citta, prov, cf, piva },
                       destinazione { ... },
                       righe: [{ cod, descrizione, qta, um, prezzo, sconto, importo, iva: "FC" }],
                       bollo: number, totale: number,
                       pagamento, scadenze: [...],
                       creatoIl, emessoIl }

conformita/
  <id>             → { paziente, prescrivente { denominazione, indirizzo, cf, piva },
                       dispositivo, descrizione, data, dataConsegna,
                       materiali: [{ tipo, fabbricante, modello, lotto }],
                       nMinSanita, creatoIl }

clienti/   <id>    → { cod, denominazione, indirizzo, cap, citta, prov, cf, piva, pagamento }
fornitori/ <id>    → { ...stessi campi }
prodotti/  <id>    → { cod, descrizione, tipologia, um, codIva: "FC", listino1 }
```

**Punti chiave:**
- `clienteSnapshot`: la fattura emessa congela i dati cliente (immutabilità fiscale).
- `contatori/<anno>`: aggiornato **solo** via transaction.
- Security rules: accesso solo all'unico utente autenticato.

---

## 6. Struttura applicazione

```
src/
├── lib/
│   ├── firebase.js          # init + offline persistence
│   ├── auth.js
│   └── db/{fatture,conformita,anagrafiche}.js
├── services/
│   ├── progressivo.js       # CRITICO — transaction contatore
│   ├── pdf/{FatturaPDF,ConformitaPDF,header}.jsx
│   └── excel.js             # import latin1 + export on-demand
├── pages/
│   ├── Home.jsx
│   ├── Fatture/{Lista,Editor,Dettaglio}.jsx
│   ├── Conformita/{Lista,Editor}.jsx
│   └── Anagrafiche/{Clienti,Fornitori,Prodotti,Import}.jsx
├── components/
│   ├── RigaFattura.jsx
│   ├── AutocompleteField.jsx
│   ├── ClienteSelect.jsx
│   ├── SyncStatusBadge.jsx
│   └── ui/
└── utils/{calcoli,formato}.js
```

`header.jsx` condiviso fattura+conformità. `SyncStatusBadge` sempre visibile (online/offline + bozze in attesa).

---

## 7. Flussi

### 7.1 Emissione fattura (critico)
```
1. Crea fattura → stato BOZZA (nessun numero)
2. Compila cliente (→ snapshot) + righe (autocomplete prodotti)
3. Calcolo auto: importi FC, totale, bollo +2€ se totale > 77,47
4. "Emetti":
   ├─ ONLINE  → transaction Firestore: leggi contatori/<anno> → +1 →
   │            scrivi numero + numeroFormattato + stato EMESSA (atomico)
   └─ OFFLINE → blocco: resta BOZZA, badge "verrà numerata online"
5. Emessa → PDF (con/senza intestazione), download/condivisione
```
**Regola ferrea:** il numero si scrive solo dentro la transaction, mai lato client prima.

### 7.2 Conformità
```
1. Nuovo rapporto → boilerplate fisso precaricato
2. Campi variabili con autocomplete (storico paziente/medico/dispositivo/materiali)
3. Salva → 2 PDF: con intestazione (medico) + senza (paziente)
4. Nessun numero; ricerca per paziente/data
```

### 7.3 Import Excel (una tantum + re-import)
```
1. Carica .xlsx (SheetJS, gestione latin1)
2. Mappa colonne Danea → campi app (subset utile)
3. Anteprima + dedup per Cod. → conferma → scrive Firestore
```

### 7.4 Sync / offline
Firestore offline persistence nativa: letture/bozze offline, scritture in coda, sync auto al
ritorno online. Solo l'emissione numero richiede rete.

---

## 8. Template PDF (copia fedele degli esempi)

I template devono coincidere visivamente con i PDF forniti; cambiano solo i dati variabili.

**FatturaPDF.jsx** — prop `conIntestazione`:
header tecnico opzionale · "Fattura nr. X del data" · box Destinatario|Destinazione ·
tabella righe (Cod/Descr/Qtà+UM/Prezzo/Sconto/Importo/IVA) · footer riepilogo IVA (FC,
imponibile/imposta €0) · Tot. fuori campo · Bolli €2,00 · Tot. documento · pagamento/scadenze ·
note legali fisse.

**ConformitaPDF.jsx** — prop `conIntestazione` (true=medico / false=paziente):
header tecnico opzionale + N° Min. Sanità + REA · riquadri Dichiarazione fabbricante|Etichettatura ·
tabella materiali (Tipo/Fabbricante/Modello/Lotto) · blocco Istruzioni d'uso (testo fisso) ·
footer firme.

Verifica fedeltà: confronto fianco-a-fianco con gli esempi durante l'implementazione.

---

## 9. Test e garanzia progressivi

`progressivo.js` con suite test **prima** della UI (Vitest + emulatore Firestore):
- Prima fattura 2026 → `001/2026`
- Sequenza senza buchi (`001`, `002`, `003`)
- Due emissioni simultanee (race) → numeri diversi, mai duplicati
- Nuovo anno → contatore `<anno>` riparte da `001`
- Offline → emissione bloccata, resta bozza, nessun numero bruciato
- Errore rete in transaction → rollback, contatore intatto
- Formato sempre `NNN/ANNO`, zero-pad 3 cifre

`calcoli.js`: bollo €2 solo se totale > 77,47; totali FC corretti.

---

## 10. Open items (non bloccanti)

- Account/repo GitHub per deploy (#2)
- Path Obsidian vault per sync CLAUDE.md (#5)
- Numero esatto fattura di partenza confermato (001/2026 salvo fatture 2026 già emesse)
