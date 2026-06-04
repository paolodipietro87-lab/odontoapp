# Piano 3 — Fatture + Progressivo — Design Spec

> Data: 2026-06-04
> Stato: approvato in brainstorming, in attesa review utente
> Progetto: OdontoApp (Laboratorio Odontotecnico Boromei Pietro)
> Prerequisito: spec base `2026-06-03-odontoapp-design.md` (sez. 5, 7.1, 9)

---

## 1. Obiettivo e scope

Implementare il modulo **Fatture** con assegnazione **progressivo** annuale.
È il pezzo CRITICO: tolleranza zero sugli errori del numero fattura.

**In scope (Piano 3):**
- Modello dati `fatture/` + `contatori/{anno}` su Firestore
- `services/progressivo.js` — assegnazione numero via transaction atomica
- `utils/calcoli.js` — importi riga, totali FC, bollo €2
- `lib/db/fatture.js` — CRUD bozze (no numero)
- UI: lista, editor bozza, dettaglio sola-lettura, riga con autocomplete, select cliente
- Emissione fattura (bozza → emessa) online-only

**Fuori scope (rimandato):**
- **PDF fattura → Piano 4** (insieme a ConformitaPDF, sez. 8 spec base).
  In DettaglioFattura il bottone PDF resta placeholder/disabilitato.
- Nota di credito, annullamento, trasmissione SDI (fuori MVP).

---

## 2. Decisioni di brainstorming (2026-06-04)

| Tema | Decisione |
|---|---|
| Numero di partenza 2026 | **001/2026** — nessuna fattura 2026 emessa con altri sistemi, parte pulita |
| Fattura emessa | **Sola lettura, mai modificabile** (immutabilità fiscale). Correzioni = nota di credito (fuori MVP) |
| Anno del contatore | **Anno della DATA fattura** (non data di sistema). Contatore keyed per `contatori/{annoDataFattura}` |
| Numero in bozza | **Nessuno**. Numero assegnato SOLO all'"Emetti". Bozza cancellabile senza bruciare numeri |
| Meccanica emissione | **Approccio A** — transaction unica: contatore + fattura aggiornati nello stesso atto atomico |
| Online detection | Non `navigator.onLine`. Il **fallimento della transaction** offline è il segnale → resta bozza |

**Nota rischio (anno = data fattura):** consente di emettere a gennaio una fattura datata
dicembre dell'anno precedente, riaprendo di fatto un anno. Accettato dall'utente. L'unicità
resta comunque garantita dal contatore per-anno (continua dall'ultimo numero di quell'anno).

---

## 3. Modello dati (Firestore)

```
contatori/{anno}        → { ultimoNumero: number }      // es. contatori/2026 → { ultimoNumero: 12 }

fatture/{autoId}        → {
    stato: "bozza" | "emessa",
    numero: number | null,            // null finché bozza
    anno: number | null,              // null finché bozza
    numeroFormattato: string | null,  // "001/2026", null finché bozza
    data: "YYYY-MM-DD",               // data fattura → decide anno contatore
    clienteId: string,
    clienteSnapshot: { denominazione, indirizzo, cap, citta, prov, cf, piva },
    destinazione: { denominazione, indirizzo, cap, citta, prov } | null,
    righe: [{ cod, descrizione, qta, um, prezzo, sconto, importo, iva: "FC" }],
    imponibile: 0,
    imposta: 0,
    totaleFuoriCampo: number,
    bollo: number,                    // 0 oppure 2.00
    totale: number,                   // totaleFuoriCampo + bollo
    pagamento: string,
    scadenze: [ ... ] | null,
    creatoIl, aggiornatoIl,
    emessoIl: timestamp | null
}
```

**Invarianti:**
- In stato `bozza`: `numero = anno = numeroFormattato = null`.
- In stato `emessa`: i tre campi valorizzati, mai più modificabili.
- `clienteSnapshot` congela i dati cliente all'emissione (immutabilità).
- `contatori/{anno}` modificato **solo** dentro la transaction di emissione.

---

## 4. `services/progressivo.js` (CRITICO)

```js
// PURA — testabile a secco, nessuna dipendenza Firestore
formattaNumero(numero, anno)  // (1, 2026) -> "001/2026"  (zero-pad 3 cifre)

// Transaction atomica — ritorna { numero, anno, numeroFormattato }
async emettiFattura(fatturaId)
```

`emettiFattura` dentro `runTransaction(db, async (tx) => { ... })`:
1. `tx.get(fattura)` → se non esiste → errore.
2. Verifica `stato === "bozza"` → altrimenti errore "già emessa" (no doppia emissione).
3. `anno = Number(data.slice(0,4))` (anno dalla data fattura).
4. `tx.get(contatori/{anno})` → `ultimo = ultimoNumero ?? 0`.
5. `nuovo = ultimo + 1`.
6. **Stessa transaction**:
   - `tx.set(contatori/{anno}, { ultimoNumero: nuovo }, { merge: true })`
   - `tx.update(fattura, { stato:"emessa", numero:nuovo, anno, numeroFormattato: formattaNumero(nuovo, anno), emessoIl: serverTimestamp() })`
7. Commit atomico (tutto o niente).

**Garanzie:**
- Race: Firestore ri-esegue la transaction se `contatori` cambia sotto → mai duplicati.
- Rollback: se la scrittura fattura fallisce, il contatore NON avanza → zero buchi.
- Offline: `runTransaction` fallisce (non accoda) → catch lato chiamante → fattura resta bozza.

---

## 5. `utils/calcoli.js` (puro)

```js
importoRiga(qta, prezzo, sconto)   // sconto in % ; -> qta*prezzo*(1 - sconto/100), arrotondato 2 dec
calcolaTotali(righe)               // -> { imponibile:0, imposta:0, totaleFuoriCampo, bollo, totale }
```

- Tutto **Fuori Campo IVA**: `imponibile = 0`, `imposta = 0`.
- `totaleFuoriCampo = somma importi righe`.
- `bollo = 2.00` se `totaleFuoriCampo > 77.47`, altrimenti `0`. Confine stretto `>`.
- `totale = totaleFuoriCampo + bollo`.

---

## 6. `lib/db/fatture.js`

```js
creaBozza(dati)         // crea doc stato:"bozza", numero/anno/numeroFormattato = null
getOne(id)
aggiornaBozza(id, dati) // SOLO se stato === "bozza" (guard), aggiorna aggiornatoIl
listAll()               // ordinate per data desc; bozze in cima/marcate
deleteBozza(id)         // SOLO se stato === "bozza" (guard)
```

`emettiFattura` vive in `progressivo.js` (non qui) per tenere la logica critica isolata.
Le emesse non hanno funzione di update/delete: sola lettura by design.

---

## 7. UI

```
pages/Fatture/
  ListaFatture.jsx     # elenco: numeroFormattato o "BOZZA", data, cliente, totale; ricerca; nuovo/apri
  EditorFattura.jsx    # crea/modifica BOZZA: ClienteSelect, righe (RigaFattura), totali live, salva, Emetti
  DettaglioFattura.jsx # fattura EMESSA = sola lettura + bottone PDF (placeholder Piano 4)
components/
  RigaFattura.jsx      # riga editabile; autocomplete prodotto (cod→descrizione/prezzo/um); importo live
  ClienteSelect.jsx    # seleziona cliente da anagrafica → congela clienteSnapshot
```

**Flusso emissione:**
1. Nuova → bozza editabile.
2. Compila cliente (snapshot) + righe; totali e bollo ricalcolati live (`calcoli.js`).
3. "Emetti" → **ConfirmDialog** (zero-tolleranza, conferma esplicita).
4. `emettiFattura(id)`:
   - successo → fattura emessa, redirect a DettaglioFattura (sola lettura).
   - fallimento (offline/errore) → resta bozza, messaggio "Numerazione richiede connessione".
5. Bozza cancellabile (ConfirmDialog esistente). Emessa mai cancellabile/modificabile.

Routing react-router già presente: aggiungere rotte `/fatture`, `/fatture/nuova`, `/fatture/:id`.

---

## 8. Test (Vitest + emulatore Firestore)

`progressivo.js` — suite PRIMA della UI:
- prima fattura 2026 → `001/2026`
- sequenza senza buchi: `001, 002, 003`
- due emissioni simultanee (race) → numeri diversi, mai duplicati
- nuovo anno (data 2027) → contatore `2027` riparte da `001`
- anno preso dalla DATA fattura, non da oggi (fattura datata 2026 emessa "nel 2027" → usa 2026)
- offline → emissione fallisce, resta bozza, contatore intatto
- errore in transaction → rollback, contatore intatto
- doppia emissione stessa fattura → seconda chiamata errore "già emessa", numero non cambia
- `formattaNumero`: zero-pad 3 cifre, `(1,2026)->"001/2026"`, `(12,2026)->"012/2026"`, `(123,2026)->"123/2026"`

`calcoli.js`:
- `importoRiga` con sconto 0 e con sconto %
- bollo: totale 77,47 → 0 ; 77,48 → 2,00 ; 100 → 2,00 ; 50 → 0 (confine stretto)
- totali FC: imponibile/imposta sempre 0

`fatture.js`:
- `aggiornaBozza`/`deleteBozza` su fattura emessa → errore (guard rispettata)

---

## 9. Ordine di implementazione (TDD, subagent-driven, 1 commit/task)

1. `utils/calcoli.js` + test (puro, nessuna dipendenza)
2. `services/progressivo.js` `formattaNumero` + test (puro)
3. `lib/db/fatture.js` CRUD bozze + guard + test
4. `services/progressivo.js` `emettiFattura` (transaction) + test emulatore (CRITICO, revisione doppia)
5. UI: ClienteSelect + RigaFattura + EditorFattura
6. UI: ListaFatture + DettaglioFattura (sola lettura) + routing
7. Verifica manuale end-to-end (crea bozza → emetti → sola lettura)

PDF rimandato a Piano 4.
