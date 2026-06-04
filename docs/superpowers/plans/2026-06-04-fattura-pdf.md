# Fattura PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generare il PDF di una fattura emessa come copia fedele dell'esempio Danea, scaricabile dal dettaglio fattura.

**Architecture:** Logica di formattazione pura e testabile (`fattura.format.js`) separata dal layout @react-pdf (`FatturaPDF.jsx`). Costanti intestazione tecnico in un solo file (`lab.js`). Bottone download via `PDFDownloadLink` che sostituisce il placeholder in `DettaglioFattura`. Nessuna modifica al data layer.

**Tech Stack:** React, Vite, @react-pdf/renderer, Vitest.

Riferimenti:
- Spec: `docs/superpowers/specs/2026-06-04-fattura-pdf-design.md`
- Esempio PDF (locale, gitignored): `Fattura 9 del 29-12-2024  Dott ssa Astolfi Silvia.pdf`

---

## File Structure

- `src/templates/lab.js` (Create) — costanti intestazione tecnico.
- `src/templates/fattura.format.js` (Create) — formatter puri + `fatturaToProps`.
- `src/templates/fattura.format.test.js` (Create) — unit test formatter.
- `src/templates/fatturaPdf.styles.js` (Create) — StyleSheet @react-pdf.
- `src/templates/FatturaPDF.jsx` (Create) — Document @react-pdf.
- `src/components/fatture/PulsanteScaricaPdf.jsx` (Create) — bottone download.
- `src/pages/Fatture/DettaglioFattura.jsx` (Modify) — sostituisce placeholder.

---

## Task 1: Installare @react-pdf/renderer

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installare la libreria**

Run: `npm install @react-pdf/renderer`
Expected: dipendenza aggiunta a `package.json`, nessun errore.

- [ ] **Step 2: Verificare build invariata**

Run: `npm run build`
Expected: build verde (la nuova dipendenza non rompe nulla).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: aggiunge @react-pdf/renderer"
```

---

## Task 2: Costanti intestazione tecnico

**Files:**
- Create: `src/templates/lab.js`

Nessun test (sole costanti). Valori estratti dall'esempio fattura.

- [ ] **Step 1: Creare il file costanti**

```js
// Intestazione tecnico — unico punto di verità. Estratto dall'esempio Danea.
export const LAB = {
  nome: 'LABORATORIO ODONTOTECNICO Boromei Pietro',
  indirizzo: 'Colle Caruno Castagneto - 64100 TERAMO (TE)',
  tel: 'Tel. 368-7876100',
  cfPiva: 'C.F. BRM PTR 63M23 L103O   P.Iva 01725020679',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/templates/lab.js
git commit -m "feat: costanti intestazione tecnico per PDF"
```

---

## Task 3: Formatter puri + fatturaToProps (TDD)

**Files:**
- Create: `src/templates/fattura.format.test.js`
- Create: `src/templates/fattura.format.js`

- [ ] **Step 1: Scrivere i test che falliscono**

```js
import { describe, it, expect } from 'vitest'
import {
  formatEuro, formatPrezzo, quantitaLabel, risolviDestinazione, fatturaToProps,
} from './fattura.format.js'

describe('formatEuro', () => {
  it('formatta con virgola e due decimali', () => {
    expect(formatEuro(735)).toBe('€ 735,00')
    expect(formatEuro(0)).toBe('€ 0,00')
    expect(formatEuro(737)).toBe('€ 737,00')
    expect(formatEuro(1234.5)).toBe('€ 1.234,50')
  })
})

describe('formatPrezzo', () => {
  it('formatta a tre decimali', () => {
    expect(formatPrezzo(30)).toBe('€ 30,000')
    expect(formatPrezzo(25.5)).toBe('€ 25,500')
  })
})

describe('quantitaLabel', () => {
  it('unisce quantità e unità di misura', () => {
    expect(quantitaLabel(1, 'pz')).toBe('1pz')
    expect(quantitaLabel(20, 'pz')).toBe('20pz')
  })
  it('gestisce um mancante', () => {
    expect(quantitaLabel(5, '')).toBe('5')
    expect(quantitaLabel(5, undefined)).toBe('5')
  })
})

describe('risolviDestinazione', () => {
  const snap = { denominazione: 'Dott.ssa Astolfi Silvia', indirizzo: 'Via Fonte Regina 28' }
  it('usa clienteSnapshot se destinazione è null', () => {
    expect(risolviDestinazione({ clienteSnapshot: snap, destinazione: null })).toEqual(snap)
  })
  it('usa destinazione se presente', () => {
    const dest = { denominazione: 'Altro' }
    expect(risolviDestinazione({ clienteSnapshot: snap, destinazione: dest })).toEqual(dest)
  })
})

describe('fatturaToProps', () => {
  const doc = {
    numeroFormattato: '009/2024',
    data: '29/12/2024',
    pagamento: 'A vista fattura',
    scadenze: null,
    clienteSnapshot: {
      denominazione: 'Dott.ssa Astolfi Silvia', indirizzo: 'Via Fonte Regina 28',
      cap: '64100', citta: 'Teramo', prov: 'TE',
      cf: 'STLSLV78S42L103M', piva: '01682660673',
    },
    destinazione: null,
    righe: [
      { cod: '0029', descrizione: 'Riparazione', qta: 1, um: 'pz', prezzo: 30, sconto: 0 },
      { cod: '0030', descrizione: 'Aggiunta dente', qta: 5, um: 'pz', prezzo: 35, sconto: 0 },
      { cod: '0031', descrizione: 'Aggiunta gancio', qta: 1, um: 'pz', prezzo: 30, sconto: 0 },
      { cod: '0041', descrizione: 'Mascherina', qta: 20, um: 'pz', prezzo: 25, sconto: 0 },
    ],
    totaleFuoriCampo: 735, bollo: 2, totale: 737,
  }

  it('mappa intestazione documento', () => {
    const p = fatturaToProps(doc)
    expect(p.numero).toBe('009/2024')
    expect(p.data).toBe('29/12/2024')
    expect(p.pagamento).toBe('A vista fattura')
  })

  it('formatta righe con importo, prezzo e iva FC', () => {
    const p = fatturaToProps(doc)
    expect(p.righe).toHaveLength(4)
    expect(p.righe[1]).toMatchObject({
      cod: '0030', descrizione: 'Aggiunta dente',
      quantita: '5pz', prezzo: '€ 35,000', sconto: '', importo: '€ 175,00', iva: 'FC',
    })
  })

  it('formatta i totali come l’esempio', () => {
    const p = fatturaToProps(doc)
    expect(p.totali.imponibile).toBe('€ 0,00')
    expect(p.totali.imposta).toBe('€ 0,00')
    expect(p.totali.fuoriCampo).toBe('€ 735,00')
    expect(p.totali.bollo).toBe('€ 2,00')
    expect(p.totali.documento).toBe('€ 737,00')
  })

  it('destinatario e destinazione coincidono quando destinazione è null', () => {
    const p = fatturaToProps(doc)
    expect(p.destinazione).toEqual(p.destinatario)
    expect(p.destinatario.denominazione).toBe('Dott.ssa Astolfi Silvia')
  })
})
```

- [ ] **Step 2: Eseguire i test per verificare che falliscano**

Run: `npm test -- fattura.format`
Expected: FAIL ("does not provide an export named ...").

- [ ] **Step 3: Implementare i formatter**

```js
// Formatter puri per il PDF fattura. Niente JSX qui → tutto unit-testabile.

const eurFmt = (decimali) => new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: decimali, maximumFractionDigits: decimali,
})

export function formatEuro(n) {
  return `€ ${eurFmt(2).format(Number(n) || 0)}`
}

export function formatPrezzo(n) {
  return `€ ${eurFmt(3).format(Number(n) || 0)}`
}

export function quantitaLabel(qta, um) {
  return `${qta}${um ?? ''}`
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function importoRiga(r) {
  const q = Number(r.qta) || 0
  const p = Number(r.prezzo) || 0
  const s = Number(r.sconto) || 0
  return round2(q * p * (1 - s / 100))
}

export function risolviDestinazione(fattura) {
  return fattura.destinazione ?? fattura.clienteSnapshot
}

function anagraficaToProps(a = {}) {
  return {
    denominazione: a.denominazione ?? '',
    indirizzo: a.indirizzo ?? '',
    cittaRiga: `${a.cap ?? ''} ${a.citta ?? ''} (${a.prov ?? ''})`.trim(),
    cfPiva: `C.F. ${a.cf ?? ''}   P.Iva ${a.piva ?? ''}`,
  }
}

export function fatturaToProps(doc) {
  const destinatario = anagraficaToProps(doc.clienteSnapshot)
  const destinazione = anagraficaToProps(risolviDestinazione(doc))
  return {
    numero: doc.numeroFormattato ?? '',
    data: doc.data ?? '',
    pagamento: doc.pagamento ?? '',
    scadenze: doc.scadenze ?? null,
    destinatario,
    destinazione,
    righe: (doc.righe ?? []).map((r) => ({
      cod: r.cod ?? '',
      descrizione: r.descrizione ?? '',
      quantita: quantitaLabel(r.qta, r.um),
      prezzo: formatPrezzo(r.prezzo),
      sconto: r.sconto ? `${r.sconto}%` : '',
      importo: formatEuro(importoRiga(r)),
      iva: 'FC',
    })),
    totali: {
      imponibile: formatEuro(0),
      imposta: formatEuro(0),
      fuoriCampo: formatEuro(doc.totaleFuoriCampo),
      bollo: formatEuro(doc.bollo),
      documento: formatEuro(doc.totale),
    },
  }
}
```

- [ ] **Step 4: Eseguire i test**

Run: `npm test -- fattura.format`
Expected: PASS (tutti i test verdi).

- [ ] **Step 5: Commit**

```bash
git add src/templates/fattura.format.js src/templates/fattura.format.test.js
git commit -m "feat: formatter puri fattura PDF (formatEuro/fatturaToProps)"
```

---

## Task 4: StyleSheet @react-pdf

**Files:**
- Create: `src/templates/fatturaPdf.styles.js`

Nessun test (solo stili). Replica spaziature/bordi dell'esempio.

- [ ] **Step 1: Creare gli stili**

```js
import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#000' },

  header: { textAlign: 'center', marginBottom: 16 },
  labNome: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  labRiga: { fontSize: 8, marginTop: 1 },

  docRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 },
  docLabel: { fontSize: 10 },
  docBox: { borderWidth: 1, borderColor: '#000', paddingVertical: 2, paddingHorizontal: 8, marginHorizontal: 4, fontFamily: 'Helvetica-Bold' },

  boxes: { flexDirection: 'row', marginBottom: 12 },
  box: { flex: 1, borderWidth: 1, borderColor: '#000', padding: 6, marginRight: 8, minHeight: 70 },
  boxLast: { marginRight: 0 },
  boxTitolo: { fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  cfRiga: { marginTop: 8, textDecoration: 'underline' },

  tableHead: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 3, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 2 },
  cCod: { width: '8%' },
  cDescr: { width: '44%' },
  cQta: { width: '10%', textAlign: 'right' },
  cPrezzo: { width: '13%', textAlign: 'right' },
  cSconto: { width: '8%', textAlign: 'right' },
  cImporto: { width: '13%', textAlign: 'right' },
  cIva: { width: '4%', textAlign: 'right' },

  ivaRecap: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', paddingTop: 4, marginTop: 24 },
  ivaRecapCol: { flex: 1 },
  ivaRecapBold: { fontFamily: 'Helvetica-Bold' },

  bottom: { flexDirection: 'row', marginTop: 12 },
  bottomLeft: { flex: 1 },
  bottomRight: { width: '45%' },
  totLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totDoc: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#000', marginTop: 4, paddingTop: 4, fontFamily: 'Helvetica-Bold', fontSize: 12 },

  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerPag: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  footerNote: { width: '85%', fontSize: 6, textAlign: 'right' },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/templates/fatturaPdf.styles.js
git commit -m "feat: stili PDF fattura"
```

---

## Task 5: Componente FatturaPDF

**Files:**
- Create: `src/templates/FatturaPDF.jsx`
- Create: `src/templates/FatturaPDF.test.jsx`

- [ ] **Step 1: Scrivere uno smoke test che fallisce**

```jsx
import { describe, it, expect } from 'vitest'
import FatturaPDF from './FatturaPDF.jsx'

describe('FatturaPDF', () => {
  it('è un componente che si crea senza errori con props minime', () => {
    const fattura = {
      numeroFormattato: '001/2026', data: '01/01/2026', pagamento: 'A vista fattura',
      clienteSnapshot: { denominazione: 'Test', indirizzo: '', cap: '', citta: '', prov: '', cf: '', piva: '' },
      destinazione: null, righe: [], totaleFuoriCampo: 0, bollo: 0, totale: 0,
    }
    expect(() => FatturaPDF({ fattura })).not.toThrow()
  })
})
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `npm test -- FatturaPDF`
Expected: FAIL ("Cannot find module './FatturaPDF.jsx'").

- [ ] **Step 3: Implementare il componente**

```jsx
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LAB } from './lab.js'
import { styles } from './fatturaPdf.styles.js'
import { fatturaToProps } from './fattura.format.js'

const NOTE_1 = 'Ai sensi del D.Lgs. 196/2003 Vi informiamo che i Vs. dati saranno utilizzati esclusivamente per i fini connessi ai rapporti commerciali tra di noi in essere.'
const NOTE_2 = 'Contributo CONAI assolto ove dovuto - Vi preghiamo di controllare i Vs. dati anagrafici, la P. IVA e il Cod. Fiscale. Non ci riteniamo responsabili di eventuali errori.'

function BoxAnagrafica({ titolo, a, last }) {
  return (
    <View style={[styles.box, last && styles.boxLast]}>
      <Text style={styles.boxTitolo}>{titolo}</Text>
      <Text>{a.denominazione}</Text>
      <Text>{a.indirizzo}</Text>
      <Text>{a.cittaRiga}</Text>
      <Text style={styles.cfRiga}>{a.cfPiva}</Text>
    </View>
  )
}

export default function FatturaPDF({ fattura }) {
  const p = fatturaToProps(fattura)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.labNome}>{LAB.nome}</Text>
          <Text style={styles.labRiga}>{LAB.indirizzo}</Text>
          <Text style={styles.labRiga}>{LAB.tel}</Text>
          <Text style={styles.labRiga}>{LAB.cfPiva}</Text>
        </View>

        <View style={styles.docRow}>
          <Text style={styles.docLabel}>Fattura nr.</Text>
          <Text style={styles.docBox}>{p.numero}</Text>
          <Text style={styles.docLabel}>del</Text>
          <Text style={styles.docBox}>{p.data}</Text>
        </View>

        <View style={styles.boxes}>
          <BoxAnagrafica titolo="Destinatario" a={p.destinatario} />
          <BoxAnagrafica titolo="Destinazione" a={p.destinazione} last />
        </View>

        <View style={styles.tableHead}>
          <Text style={styles.cCod}>Codice</Text>
          <Text style={styles.cDescr}>Descrizione</Text>
          <Text style={styles.cQta}>Quantità</Text>
          <Text style={styles.cPrezzo}>Prezzo</Text>
          <Text style={styles.cSconto}>Sconto</Text>
          <Text style={styles.cImporto}>Importo</Text>
          <Text style={styles.cIva}>Iva</Text>
        </View>
        {p.righe.map((r, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.cCod}>{r.cod}</Text>
            <Text style={styles.cDescr}>{r.descrizione}</Text>
            <Text style={styles.cQta}>{r.quantita}</Text>
            <Text style={styles.cPrezzo}>{r.prezzo}</Text>
            <Text style={styles.cSconto}>{r.sconto}</Text>
            <Text style={styles.cImporto}>{r.importo}</Text>
            <Text style={styles.cIva}>{r.iva}</Text>
          </View>
        ))}

        <View style={styles.ivaRecap}>
          <Text style={styles.ivaRecapCol}>FC: Fuori campo IVA</Text>
          <Text style={styles.ivaRecapCol}>Imponibile {p.totali.fuoriCampo}</Text>
          <Text style={styles.ivaRecapCol}>Imposta {p.totali.imposta}</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomLeft}>
            <Text><Text style={styles.ivaRecapBold}>Pagamento: </Text>{p.pagamento}</Text>
            {p.scadenze && <Text><Text style={styles.ivaRecapBold}>Scadenze: </Text>{p.data}   {p.totali.documento}</Text>}
          </View>
          <View style={styles.bottomRight}>
            <View style={styles.totLine}><Text>Tot. imponibile</Text><Text>{p.totali.imponibile}</Text></View>
            <View style={styles.totLine}><Text>Tot. Iva</Text><Text>{p.totali.imposta}</Text></View>
            <View style={styles.totLine}><Text>Tot. importi fuori campo Iva</Text><Text>{p.totali.fuoriCampo}</Text></View>
            <View style={styles.totLine}><Text>Bolli in fattura</Text><Text>{p.totali.bollo}</Text></View>
            <View style={styles.totDoc}><Text>Tot. documento</Text><Text>{p.totali.documento}</Text></View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerPag}>Pag. 1</Text>
          <View style={styles.footerNote}>
            <Text>{NOTE_1}</Text>
            <Text>{NOTE_2}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 4: Eseguire il test**

Run: `npm test -- FatturaPDF`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/templates/FatturaPDF.jsx src/templates/FatturaPDF.test.jsx
git commit -m "feat: componente FatturaPDF (@react-pdf)"
```

---

## Task 6: Bottone scarica PDF + integrazione dettaglio

**Files:**
- Create: `src/components/fatture/PulsanteScaricaPdf.jsx`
- Modify: `src/pages/Fatture/DettaglioFattura.jsx:44-46`

- [ ] **Step 1: Creare il bottone**

```jsx
import { PDFDownloadLink } from '@react-pdf/renderer'
import FatturaPDF from '../../templates/FatturaPDF.jsx'

function slug(s = '') {
  return s.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
}

export default function PulsanteScaricaPdf({ fattura }) {
  const numero = (fattura.numeroFormattato ?? '').replace('/', '-')
  const nome = slug(fattura.clienteSnapshot?.denominazione)
  const fileName = `Fattura_${numero}_${nome}.pdf`
  return (
    <PDFDownloadLink
      document={<FatturaPDF fattura={fattura} />}
      fileName={fileName}
      className="mt-4 inline-block bg-blue-600 text-white rounded px-4 py-2"
    >
      {({ loading }) => (loading ? 'Preparo PDF…' : 'Scarica PDF')}
    </PDFDownloadLink>
  )
}
```

- [ ] **Step 2: Sostituire il placeholder nel dettaglio**

In `src/pages/Fatture/DettaglioFattura.jsx` aggiungere l'import in cima:

```jsx
import PulsanteScaricaPdf from '../../components/fatture/PulsanteScaricaPdf.jsx'
```

E sostituire il blocco bottone (righe ~44-46):

```jsx
      <button type="button" disabled className="mt-4 bg-gray-200 rounded px-4 py-2 cursor-not-allowed" title="Disponibile nel Piano 4">
        Scarica PDF (in arrivo)
      </button>
```

con:

```jsx
      <PulsanteScaricaPdf fattura={fattura} />
```

- [ ] **Step 3: Eseguire l'intera suite e la build**

Run: `npm test`
Expected: tutti i test verdi (62 esistenti + nuovi).

Run: `npm run build`
Expected: build verde.

- [ ] **Step 4: Commit**

```bash
git add src/components/fatture/PulsanteScaricaPdf.jsx src/pages/Fatture/DettaglioFattura.jsx
git commit -m "feat: bottone Scarica PDF nel dettaglio fattura"
```

---

## Task 7: Verifica fedeltà manuale (e2e)

**Files:** nessuno (verifica umana).

- [ ] **Step 1: Avviare l'app**

Run: `npm run dev`

- [ ] **Step 2: Aprire una fattura emessa**

Navigare in `/fatture`, aprire una fattura emessa (o emetterne una di test), cliccare **Scarica PDF**.

- [ ] **Step 3: Confronto fianco-a-fianco**

Aprire il PDF generato accanto a `Fattura 9 del 29-12-2024  Dott ssa Astolfi Silvia.pdf` e verificare:
- [ ] Intestazione tecnico (nome, indirizzo, tel, CF/P.IVA) corretta e centrata.
- [ ] `Fattura nr. N del data` con box numero/data.
- [ ] Box Destinatario / Destinazione con CF+P.IVA sottolineato.
- [ ] Tabella righe: codice, descrizione, quantità `Npz`, prezzo 3 decimali, importo 2 decimali, `FC`.
- [ ] Riepilogo IVA `FC: Fuori campo IVA` + imponibile/imposta.
- [ ] Box totali: imponibile €0,00, Iva €0,00, fuori campo, bolli, Tot. documento bold.
- [ ] Footer: `Pag. 1` + due note legali.
- [ ] Nome file `Fattura_NNN-ANNO_denominazione.pdf`.

- [ ] **Step 4: Annotare eventuali scostamenti**

Se ci sono differenze di layout, aggiustare `fatturaPdf.styles.js` / `FatturaPDF.jsx` e ripetere. Niente da committare se tutto già fedele.

---

## Self-Review note

- Spec coverage: §3 intestazione → Task 2; §4 layout → Task 4+5; §5 moduli → Task 2-6; §6 integrazione → Task 6; §7 test → Task 3 (unit) + Task 5 (smoke) + Task 7 (e2e). Tutto coperto.
- Versione senza intestazione / bozza / conformità: fuori scope confermato (Piano 5).
- Tipi coerenti: `fatturaToProps` produce `{numero,data,pagamento,scadenze,destinatario,destinazione,righe[],totali{}}`, consumato identico in `FatturaPDF.jsx`.
