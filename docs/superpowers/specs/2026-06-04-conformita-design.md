# Spec — Conformità (Rapportino d'intervento) — Piano 5

Data: 2026-06-04
Modulo nuovo, costruito da zero (a differenza della fattura non esiste nulla).

## Scopo

Generare il "Rapportino d'intervento" (documento di conformità del dispositivo
medico su misura). Documento **indipendente dalla fattura**: nessun progressivo,
nessun collegamento di numero. Ricerca per **paziente / data**.

Vincolo ferreo: il PDF deve essere **copia fedele** degli esempi Danea, in
**due versioni**:
- **CON intestazione** laboratorio → consegnata al medico
- **SENZA intestazione** → consegnata al paziente

Unica differenza tra le due versioni = presenza/assenza del blocco header
laboratorio (nome lab + indirizzo + tel + CF/PIva) in alto. Tutto il resto identico.

## Struttura del documento ("3 documenti in 1")

1. **Header**: `N° MINISTERO DELLA SANITA'` + numero (fisso) e `R.E.A` (fisso).
   Se CON intestazione, sopra: blocco laboratorio (riuso `LAB`).
2. **Due box affiancati**:
   - **DICHIARAZIONE DEL FABBRICANTE**: Data, Data consegna, Descrizione
     dispositivo, blocco Prescrivente (medico da anagrafica), "Con riferimento
     ... riguardante il/la Sig./sig.ra: <paziente>", testo legale fisso
     "Siamo in grado di dichiarare: 1)... 2)..." + "Regolari controlli...".
   - **ETICHETTATURA**: Cognome e Nome <paziente>, Prescrizione medica del,
     Data consegna, Dispositivo, "Codice Identificativo n." (label),
     "Condizioni specifiche di conservazione e manipolazione" + bullet **fissi**
     (Conservare in luogo asciutto / Maneggiare con cura / Conservare al riparo
     da fonti di calore / Non sterilizzare a caldo), Termini per l'utilizzazione
     (opzionale), "CONSERVAZIONE E MANIPOLAZIONE:" con Avvertenze / Prodotti
     consigliati / Note particolari (opzionali liberi).
3. **Tabella materiali**: colonne Tipo | Fabbricante | Modello | Lotto, N righe.
4. **Istruzioni d'uso tecniche (protesi mobile)**: blocco di **testo legale
   fisso** (paragrafi 1-5, responsabilità, effetti collaterali, avvertenze
   applicazione/rimozione, "Note particolari e prodotti consigliati vedi
   etichettatura").
5. **Footer firme**: "LA FIRMA CONVALIDA I TRE DOCUMENTI" — "FIRMA DEL MEDICO
   PER RICEVUTA".

## Campi variabili (editor) vs fissi (costanti)

### Variabili — input nell'editor
| Campo | Note |
|---|---|
| `data` | data documento (es. 11-11-21) |
| `dataConsegna` | data consegna (es. 11-12-21) |
| `prescrizioneMedicaDel` | "Prescrizione medica del" |
| `clienteId` + `clienteSnapshot` | **medico prescrivente**, da anagrafica clienti (riuso ClienteSelect, snapshot congelato: denominazione, indirizzo, cittaRiga, cfPiva) |
| `paziente` | **unico campo libero non in anagrafica** (es. "Botticelli Angela"). Compare in 2 punti del PDF (Etichettatura "Cognome e Nome" + Dichiarazione "riguardante il/la Sig./sig.ra") con lo **stesso** valore |
| `descrizioneDispositivo` | es. "4 corone provvisorie" |
| `terminiUtilizzazione` | opzionale (label "Termini per l'utilizzazione: giorni") |
| `avvertenze` | opzionale libero |
| `prodottiConsigliati` | opzionale libero |
| `noteParticolari` | opzionale libero |
| `materiali[]` | righe `{tipo, fabbricante, modello, lotto}`, autocomplete da anagrafica prodotti |

### Fissi — costanti nel codice (mai editabili)
- `LAB.ministero = 'ITCA01027879'`, `LAB.rea = '147477'`, `LAB.nomeUpper = 'BOROMEI PIETRO'` (in `templates/lab.js`).
- Blocco lab (nome/indirizzo/tel/cfPiva): già in `LAB`.
- Bullet conservazione/manipolazione (4, fissi).
- Testo "Siamo in grado di dichiarare 1)/2)" + "Regolari controlli...".
- Tutto il blocco "Istruzioni d'uso tecniche".
- Etichette dei box.

## Data model (Firestore — collection `conformita`)

```js
{
  data: '',                  // string come la fattura
  dataConsegna: '',
  prescrizioneMedicaDel: '',
  clienteId: null,
  clienteSnapshot: { denominazione, indirizzo, cittaRiga, cfPiva } | null,
  paziente: '',
  descrizioneDispositivo: '',
  terminiUtilizzazione: '',
  avvertenze: '',
  prodottiConsigliati: '',
  noteParticolari: '',
  materiali: [ { tipo: '', fabbricante: '', modello: '', lotto: '' } ],
  creatoIl, aggiornatoIl,       // serverTimestamp
}
```

Nessun campo `stato`/`numero`. **Sempre modificabile**: niente guard sola-lettura.

## Componenti / file nuovi

### Logica / dati
- `templates/lab.js` — **estendere** con `ministero`, `rea`, `nomeUpper`.
- `templates/conformita.fixed.js` — testi legali fissi (bullet, dichiarazione, istruzioni d'uso) come costanti/array. Unico punto di verità.
- `templates/conformita.format.js` (**puro, testato**): `conformitaToProps(doc)` →
  props formattate: date passthrough (string), `paziente` trim, `prescrivente`
  dal `clienteSnapshot` (fallback campi vuoti), `materiali` puliti (riga vuota
  scartata se tutti i campi vuoti). Nessuna money math.
- `lib/db/conformita.js`: `crea(dati)`, `getOne(id)`, `aggiorna(id, dati)`,
  `elimina(id)`, `listAll()` (orderBy `data` desc). CRUD pieno, niente guard.

### PDF
- `templates/conformitaPdf.styles.js` — stili @react-pdf (copia layout esempio).
- `templates/ConformitaPDF.jsx` — `<ConformitaPDF conformita={...} intestazione={bool} />`.
  `intestazione=true` → render blocco lab header. `false` → omesso. Una sola differenza.
- `components/conformita/PulsanteScaricaPdfConformita.jsx` — prop `conformita` +
  `intestazione`. `PDFDownloadLink`. Nome file:
  `Rapporto_<data>_<paziente>.pdf` (intestazione) /
  `Rapporto_<data>_<paziente>_paziente.pdf` (senza). Slug come PulsanteScaricaPdf.

### UI / pagine
- `pages/Conformita/EditorConformita.jsx` — form: ClienteSelect (medico),
  input paziente / descrizione dispositivo / data / dataConsegna /
  prescrizioneMedicaDel / campi opzionali, lista righe materiali (RigaMateriale),
  Salva. Crea o modifica (`/conformita/nuova`, `/conformita/:id/modifica`).
- `components/conformita/RigaMateriale.jsx` — 4 input (tipo/fabbricante/modello/
  lotto) + autocomplete prodotti: cerca per descrizione, su select prefill
  `tipo=descrizione`, `fabbricante=produttore`, `modello=descrizione` (editabili),
  `lotto` a mano. Riusa il pattern di `RigaFattura`.
- `pages/Conformita/ListaConformita.jsx` — tabella (data, paziente, dispositivo),
  ricerca per **paziente/data**. Link a dettaglio.
- `pages/Conformita/DettaglioConformita.jsx` — visualizza i dati +
  **2 bottoni PDF**: "Scarica PDF (per medico)" e "Scarica PDF (per paziente)".
  Bottoni Modifica/Elimina (ConfirmDialog).
- Routing in `App`/router: `/conformita`, `/conformita/nuova`,
  `/conformita/:id`, `/conformita/:id/modifica`. Link da `Home`.

## Testing (TDD)
- `conformita.format.test.js`: passthrough date, fallback prescrivente da
  snapshot mancante, paziente trim, scarto riga materiali vuota, materiali
  conservati.
- `ConformitaPDF` smoke: render con/senza intestazione non lancia.
- `lib/db/conformita`: mock firestore come per `fatture` (crea/get/aggiorna/
  elimina/listAll).
- **Verifica visiva manuale**: generare PDF di prova coi dati dell'esempio
  (Botticelli Angela / Dott. Sacripante / 2 righe Ivoclar) e confrontare
  fianco-a-fianco con i due PDF esempio.

## Riuso esplicito
- `LAB` (esteso), `ClienteSelect`, pattern `RigaFattura`, pattern
  `PulsanteScaricaPdf`, `ConfirmDialog`, struttura pagine Fatture.
- `vite.config.js` workbox limit già a 5 MiB (ok per @react-pdf).

## Fuori scope
- Collegamento conformità↔fattura.
- Progressivo / numerazione.
- Bullet conservazione editabili (fissi nel MVP).
- Materiali come sub-tabella persistente in anagrafica (solo righe nel doc).
