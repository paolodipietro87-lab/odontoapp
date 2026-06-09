# Spec — Magazzino + scarico da conformità (2026-06-09)

## Obiettivo
Nuova sezione **Magazzino** in OdontoApp. Le quantità disponibili dei prodotti
scalano quando una conformità viene "scaricata". Stato visivo + reminder all'apertura.
Più micro-feature: Sottocategoria nelle tendine prodotto.

## Sorgente colonne Excel prodotti (verificate dal foglio reale)
- A = Cod. · B = Descrizione · C = Tipologia · D = Categoria · E = Sottocategoria
- AJ = Q.tà disponibile · AU = Stato magazzino (NON usato: stato lo calcoliamo noi)
- AD = Scorta min. (tutta a 0 nel foglio reale → inutilizzabile come soglia)

## Decisioni prese (brainstorming)
1. **Riga materiale conformità**: aggiungo campo numerico `qta` ("Quantità utilizzata")
   + salvo `prodottoId` nascosto quando il materiale è scelto dalla tendina.
   Solo le righe con `prodottoId` + `qta>0` scaricano. Righe a mano → ignorate.
2. **Trigger scarico**: nuovo bottone **"Conferma scarico"** sul dettaglio conformità
   (la conformità NON ha "Emetti", è sempre modificabile). One-shot: flag `scaricata=true`
   sul doc → editare dopo non riscala, niente doppio scarico.
3. **Stato magazzino**: 2 stati calcolati da `qtaDisponibile`:
   - `disp <= 0` → 🔴 "Esaurito"
   - altrimenti → 🟢 "Disponibile"
   (niente giallo "in esaurimento" per ora — nessuna soglia sensata, unità diverse.
   Eventuale 3° stato con soglia per-prodotto rimandato a futuro.)
4. **Carica (restock)**: solo nel Magazzino, un bottone per riga → dialog quantità →
   `qtaDisponibile += qta`.
5. **Quantità utilizzata**: serve SOLO al magazzino. NON entra nel PDF/documento finale
   (`conformitaToProps`/`pulisciMateriali` non la includono).

## Componenti / file

### Dati
- `services/excel.js` — `mapProdottoRow`: + `qtaDisponibile: numOrNull(pick(row,'Q.tà disponibile'))`.
- `pages/Anagrafiche/schema.js` — prodotti: + `{ name:'qtaDisponibile', label:'Q.tà disponibile', type:'number' }`.
- Re-import Excel **resetta** `qtaDisponibile` al valore del foglio (atteso: foglio = sorgente).
  Prodotti già importati prima di questo deploy non hanno il campo → re-import necessario.

### Logica pura (TDD) — `utils/magazzino.js`
- `statoMagazzino(disp)` → `'esaurito' | 'disponibile'` (disp null/undefined trattato come 0).
- `isServizio(prodotto)` → tipologia === 'Servizio' (case-insensitive, trim).
- `filtroMagazzino(prodotti)` → esclude i Servizio.
- `righeScarico(materiali)` → da materiali conformità a `[{prodottoId, qta}]`
  (solo righe con prodottoId e qta>0; somma per prodottoId se ripetuto).
- `applicaDelta(disp, delta)` → nuova disponibilità (numero; clamp non necessario, può andare negativo? no: scarico può portare sotto 0, lo permettiamo ma stato resta esaurito).

### Data layer — `lib/db/magazzino.js` (o estensione `lib/db/fatture`-style)
- `caricaProdotto(id, qta)` → transaction: leggi `qtaDisponibile`, scrivi `+= qta`.
- `scaricaConformita(conformitaId)` → transaction: se `scaricata` già true → no-op/throw;
  per ogni riga di `righeScarico`, decrementa il prodotto; setta `scaricata=true`.
  (Best-effort sui prodotti mancanti: salta id non trovati.)

### UI
- `pages/Magazzino/ListaMagazzino.jsx` — vista prodotti non-Servizio.
  Colonne: **Descrizione** (bold) · Cod · Categoria · Sottocategoria · **Stato** (badge) · **Disponibile**.
  Ricerca descrizione/codice. Bottone **Carica** per riga → `ConfirmDialog`-like con input numero.
- `components/conformita/RigaMateriale.jsx` — + colonna **Quantità** (input number) +
  salva `prodottoId` in `fillFromProdotto` (p.id). Header tabella materiali: + "Q.tà".
- `pages/Conformita/DettaglioConformita.jsx` — + bottone **"Conferma scarico"**:
  chiama `scaricaConformita`, disabilitato/avviso se `doc.scaricata` (mostra "Già scaricato").
- `components/MagazzinoReminder.jsx` (Home) — banner prodotti esauriti (`disp<=0`, no Servizio).
  Nessun esaurito → niente banner.
- `pages/Home` — + card "Magazzino" + render `<MagazzinoReminder/>`.
- Routing `/magazzino`.

### Tendine prodotto (micro-feature)
- `components/fatture/RigaFattura.jsx` e `components/conformita/RigaMateriale.jsx`:
  nel `detail` delle opzioni prodotto aggiungo **sottocategoria** (E) accanto a produttore/categoria.

## Non-goal
- Giallo "in esaurimento" / soglie per prodotto (futuro).
- Storico movimenti magazzino (carico/scarico log) — non richiesto.
- Scarico da fatture (solo conformità).
- Annullo scarico / reso.

## Test
- `utils/magazzino.js`: statoMagazzino, isServizio, filtroMagazzino, righeScarico (somma, scarto vuote), applicaDelta.
- `lib/db/magazzino.js`: scarico one-shot (no doppio), carico incrementale (fake runTransaction come progressivo).
- `conformita.format.js`: confermo che `qta`/`prodottoId` NON finiscono nei props PDF.
