# Fattura PDF — Design (Piano 4)

> Data: 2026-06-04
> Scope: generazione PDF della fattura emessa, copia fedele dell'esempio cliente.
> Esempio di riferimento: `Fattura 9 del 29-12-2024  Dott ssa Astolfi Silvia.pdf` (locale, gitignored).

---

## 1. Obiettivo

Generare il PDF di una fattura **emessa** (sola lettura) come **copia fedele** del layout
Danea fornito dal cliente. Cambiano solo i dati variabili; struttura, intestazione, box,
tabella, footer e note legali sono fissi.

**Decisioni chiuse (brainstorming 2026-06-04):**
- Libreria: **@react-pdf/renderer** (gratis, client-side, download nativo, layout a componenti).
- **Una sola versione**: CON intestazione tecnico (unico esempio fornito). Versione "senza
  intestazione" fuori scope (nessun esempio fattura senza header).
- PDF disponibile **solo per fatture emesse**, dal `DettaglioFattura` (sola lettura).
- Conformità: **fuori scope** → Piano 5 (modulo da costruire da zero).

---

## 2. Dati disponibili (già in Firestore, niente nuovi campi)

Documento fattura emessa (`src/lib/db/fatture.js`):
- `numeroFormattato` (es. `001/2026`), `data` (string), `pagamento`, `scadenze`
- `clienteSnapshot`: `denominazione, indirizzo, cap, citta, prov, cf, piva`
- `destinazione`: stesso shape di `clienteSnapshot` **oppure** `null` → fallback = destinatario
- `righe[]`: `cod, descrizione, qta, um, prezzo, sconto`
- totali: `imponibile (0)`, `imposta (0)`, `totaleFuoriCampo`, `bollo`, `totale`

Nessuna modifica al data layer. Il PDF è pura presentazione di dati esistenti.

---

## 3. Costanti intestazione tecnico

`src/templates/lab.js` — unico punto di verità (estratto dall'esempio):

```
nome:    "LABORATORIO ODONTOTECNICO Boromei Pietro"
sotto:   "BOROMEI PIETRO"   (riga sotto-titolo, presente su conformità; su fattura solo nome grande)
indirizzo: "Colle Caruno Castagneto - 64100 TERAMO (TE)"
tel:     "Tel. 368-7876100"
cfPiva:  "C.F. BRM PTR 63M23 L103O   P.Iva 01725020679"
```

---

## 4. Layout FatturaPDF (copia fedele)

Ordine verticale, una pagina A4:

1. **Banda header** (centrata): nome lab grande in bold, sotto indirizzo / tel / CF+P.IVA piccoli.
2. **Riga documento** (destra): `Fattura nr. [N] del [data]` con N e data in box bordati.
3. **Due box affiancati** bordati:
   - **Destinatario**: denominazione, indirizzo, `cap citta (prov)`, riga CF+P.IVA sottolineata.
   - **Destinazione**: `fattura.destinazione` se presente, altrimenti copia del destinatario.
4. **Tabella righe** — colonne: `Codice` · `Descrizione` · `Quantità` (`qta um`, es. `1pz`) ·
   `Prezzo` (`€ X,XXX`, 3 decimali) · `Sconto` · `Importo` (`€ X,XX`) · `Iva` (`FC`).
   Header colonne con riga sottile sopra/sotto.
5. **Riepilogo IVA** (riga): `FC: Fuori campo IVA` | `Imponibile` (= totaleFuoriCampo) | `Imposta` (`€ 0,00`).
6. **Box totali** (destra): `Tot. imponibile € 0,00` · `Tot. Iva € 0,00` ·
   `Tot. importi fuori campo Iva [totaleFuoriCampo]` · `Bolli in fattura [bollo]` ·
   linea tratteggiata · **`Tot. documento [totale]`** in bold.
   A sinistra: `Pagamento: [pagamento]`, `Scadenze: [data] [totale]`.
7. **Footer fisso**: `Pag. 1` (sx) + note legali in piccolo (dx):
   - "Ai sensi del D.Lgs. 196/2003 Vi informiamo che i Vs. dati saranno utilizzati esclusivamente
     per i fini connessi ai rapporti commerciali tra di noi in essere."
   - "Contributo CONAI assolto ove dovuto - Vi preghiamo di controllare i Vs. dati anagrafici,
     la P. IVA e il Cod. Fiscale. Non ci riteniamo responsabili di eventuali errori."

**Formattazione importi:** stile italiano, virgola decimale, prefisso `€ ` (es. `€ 735,00`).
Prezzo unitario a 3 decimali (`€ 30,000`), importi/totali a 2 decimali.

---

## 5. Moduli e responsabilità

| File | Cosa fa | Dipende da |
|---|---|---|
| `src/templates/lab.js` | costanti intestazione | — |
| `src/templates/fattura.format.js` | formatter puri: `formatEuro(n)`, `formatPrezzo(n)`, `quantitaLabel(qta,um)`, `risolviDestinazione(fattura)`, `fatturaToProps(doc)` | — |
| `src/templates/fatturaPdf.styles.js` | `StyleSheet.create` (@react-pdf) | @react-pdf |
| `src/templates/FatturaPDF.jsx` | `<Document>` che rende le props formattate | @react-pdf, lab, styles |
| `src/components/fatture/PulsanteScaricaPdf.jsx` | `PDFDownloadLink` → file | @react-pdf, FatturaPDF |

`fatturaToProps(doc)`: trasforma il documento Firestore in props già formattate (stringhe pronte
da stampare) — così la logica testabile sta fuori dal JSX @react-pdf.

Nome file: `Fattura_NNN-ANNO_denominazione.pdf` (slash → trattino, denominazione slugificata).

---

## 6. Integrazione UI

Sostituire il bottone placeholder in `src/pages/Fatture/DettaglioFattura.jsx` (riga ~44) con
`<PulsanteScaricaPdf fattura={fattura} />`. Visibile solo se `stato === 'emessa'` (il dettaglio
già reindirizza le bozze all'editor, quindi qui la fattura è sempre emessa).

---

## 7. Test (TDD)

**Unit puri** (`fattura.format.js`) — testabili senza rendering:
- `formatEuro(735)` → `"€ 735,00"`; `formatEuro(0)` → `"€ 0,00"`; `formatEuro(737)` → `"€ 737,00"`.
- `formatPrezzo(30)` → `"€ 30,000"` (3 decimali).
- `quantitaLabel(1,'pz')` → `"1pz"`; gestione um mancante.
- `risolviDestinazione`: se `destinazione` null → ritorna `clienteSnapshot`; se presente → la usa.
- `fatturaToProps`: mappa numero/data/righe/totali; calcola importo riga; FC su ogni riga;
  bollo presente solo se >0; replica l'esempio (4 righe → totaleFuoriCampo 735, bollo 2, totale 737).

**Rendering @react-pdf**: NON unit-test a pixel (fragile). Verifica = **confronto manuale
fianco-a-fianco** con l'esempio (task e2e finale). Opzionale: smoke test che `FatturaPDF`
si monti senza throw con props valide.

---

## 8. Fuori scope (Piano 4)

- Versione senza intestazione fattura (nessun esempio).
- Anteprima PDF in bozza.
- Modulo conformità (data model + editor + PDF) → **Piano 5**.
- Condivisione nativa / Web Share API (download basta per MVP; commercialista riceve il file).

---

## 9. Rischi

- **Fedeltà layout**: @react-pdf usa flexbox, non identico al PDF Danea. Mitigazione: confronto
  visivo iterativo, tolleranza su micro-spaziature (i dati e la struttura devono coincidere).
- **Font**: default Helvetica @react-pdf ≈ Arial dell'esempio. Accettabile, no font custom (€0, no fetch).
