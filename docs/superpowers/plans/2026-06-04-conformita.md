# Conformità (Rapportino d'intervento) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modulo Conformità: data model + editor + PDF (copia fedele esempio Danea, 2 versioni con/senza intestazione).

**Architecture:** Specchio del modulo fatture. Logica pura testabile (`conformita.format.js`), costanti fisse (`lab.js` esteso + `conformita.fixed.js`), data layer Firestore CRUD pieno (`lib/db/conformita.js`), PDF @react-pdf con prop `intestazione`, UI a pagine (editor/lista/dettaglio) con riuso di `ClienteSelect`, pattern `RigaFattura`, `ConfirmDialog`, `PulsanteScaricaPdf`.

**Tech Stack:** React + Vite, Firestore, @react-pdf/renderer, Vitest, Tailwind.

**Spec:** `docs/superpowers/specs/2026-06-04-conformita-design.md`

**Branch:** `conformita` (già creato).

---

## File Structure

- `src/templates/lab.js` — **modificare**: aggiungere `ministero`, `rea`, `nomeUpper`.
- `src/templates/conformita.fixed.js` — **creare**: testi legali fissi.
- `src/templates/conformita.format.js` (+ `.test.js`) — **creare**: formatter puri.
- `src/lib/db/conformita.js` (+ `__tests__/conformita.test.js`) — **creare**: CRUD.
- `src/templates/conformitaPdf.styles.js` — **creare**: stili PDF.
- `src/templates/ConformitaPDF.jsx` (+ `.test.jsx`) — **creare**: documento PDF.
- `src/components/conformita/PulsanteScaricaPdfConformita.jsx` — **creare**.
- `src/components/conformita/RigaMateriale.jsx` — **creare**.
- `src/pages/Conformita/EditorConformita.jsx` — **creare**.
- `src/pages/Conformita/ListaConformita.jsx` — **creare**.
- `src/pages/Conformita/DettaglioConformita.jsx` — **creare**.
- `src/App.jsx` — **modificare**: rotte conformità.
- `src/pages/Home.jsx` — **modificare**: link Conformità attivo.

---

### Task 0: Costanti fisse (lab.js esteso + conformita.fixed.js)

**Files:**
- Modify: `src/templates/lab.js`
- Create: `src/templates/conformita.fixed.js`

- [ ] **Step 1: Estendere lab.js**

`src/templates/lab.js` diventa:

```js
// Intestazione tecnico — unico punto di verità. Estratto dall'esempio Danea.
export const LAB = {
  nome: 'LABORATORIO ODONTOTECNICO Boromei Pietro',
  nomeUpper: 'BOROMEI PIETRO',
  indirizzo: 'Colle Caruno Castagneto - 64100 TERAMO (TE)',
  tel: 'Tel. 368-7876100',
  cfPiva: 'C.F. BRM PTR 63M23 L103O   P.Iva 01725020679',
  ministero: 'ITCA01027879',
  rea: '147477',
}
```

- [ ] **Step 2: Creare conformita.fixed.js**

`src/templates/conformita.fixed.js` (testi fissi, copia fedele dell'esempio, refusi inclusi per fedeltà al documento stampato):

```js
// Testi legali fissi del rapportino di conformità. Copia fedele dell'esempio Danea.
export const BULLET_CONSERVAZIONE = [
  'Conservare in luogo asciutto',
  'Maneggiare con cura',
  'Conservare al riparo da fonti di calore',
  'Non sterilizzare a caldo',
]

export const DICHIARAZIONE = [
  'Siamo in grado di dichiarare:',
  '1) che il dispositivo in oggetto è destinato in via esclusiva al paziente su indicato.',
  "2) che lo stesso risulta conforme a quanto previsto dall'allegato della MDD 93/94 CEE e suo decreto di recepimento n° 46 24/02/97",
  'Regolari controlli del vostro medico sono indispensabili per assicurare la funzionaltà e la sicurezza.',
]

export const ISTRUZIONI_TITOLO = "ISTRUZIONI D'USO TECNICHE (PROTESI MOBILE)"
export const ISTRUZIONI_SOTTOTITOLO = 'Prescrivente, paziente, dispositivo come indicato nella dichiarazione del fabbricante.'

export const ISTRUZIONI_INTRO =
  "Il dispositivo fornitole è stato sviluppato e prodotto per assicurare la massima funzionalità, confortevolezza, sicurezza ed azione in funzione delle caratteristiche del caso specifico e compatibilmente con l'attuale sviluppo tecnologico. Come per tutti i tipi di dispositivi medico dentale, esistono alcune regole base da seguire, per proteggere ed accrescere la qualità delle Vostre funzioni masticatorie."

export const ISTRUZIONI_NUMERATE = [
  "1) E' necessario mantenere un buon livello di igiene orale per garantire un uso sicuro della pretesi.",
  '2) Eseguire con regolarità le operazioni di manutenzione previste e la corretta, se prevista, rimozione e applicazione nonchè attivazione della stessa secondo le indicazioni ricevute.',
  '3) Eseguire i controlli periodici come previsto dal medico.',
  '4) Utilizzare per la pulizia solo i prodotti consigliati.',
  '5) Nel caso di percezione di un problema, rivolgersi immediatamente al proprio medico di fiducia.',
]

export const ISTRUZIONI_RESPONSABILITA =
  "Risulta pertanto essenziale la VOSTRA RESPONSABILITA' NEL SEGUIRE CORRETTAMENTE LE NORME DI UTILIZZO, COSI' COME I SUGGERIMENTI DEL VOSTRO MEDICO E QUELLI CONTENTI IN QUESTE ISTRUZIONI D'USO. Eventuali effetti collaterali non desiderati."

export const ISTRUZIONI_EFFETTI = [
  'Potrebbero verificarsi decolorazioni dei materiali, in tal caso rivolgersi al proprio',
  'Se si riscontra una usura eccessiva ed anomalia dei materiali, rivolgersi al proprio medico.',
  'Con apparecchi rimovibili possono manifestarsi decubiti; in tal caso sarà necesario pronto ricontrollo medico.',
  'Predisporsi al fatto che potrebbero manifestarsi sintomi di rigetto.',
  'Per effetti collaterali non contemplati rivolgersi immediatamente al proprio medico per una verifica dei disturbi.',
]

export const ISTRUZIONI_AVVERTENZE_TITOLO =
  "Avvertenze per l'applicazione e la rimozione del dispositivo ortodontico mobile:"

export const ISTRUZIONI_AVVERTENZE = [
  'Manipolare con attenzione per evitare la caduta del dispositivo, se cade può rompersi; nel caso questo avenga rivolgersi al proprio dentista evitando riparazioni con materiali tipo cianac rilato.',
  "Assicurarsi di inserire la protesi superiore nell'arcata superiore e quella inferiore nell'arcata inferiore.",
  "Inserire con ambedue le mani la protesi in sito, se si tratta di protesi con ganci premere alternativamente sugli stessi sino all'inserimento della protesi, secondo la sequenza riportata di seguito.",
  'Se si percepiscono dolori o pressioni eccessive, rimuovere e correggere il piano di inserzione.',
  'Disinserire la protesi con ambedue le mani, se con ganci, seguendouna procedura inversa rispetto a quella riportata per l\'inserzione.',
  'Evitare qualsiasi intervento sul dispositivo senza interpellare il medico.',
  'Evitare di serrare i denti per inserire o posizionare il dispositivo.',
]

export const ISTRUZIONI_NOTA = 'Note particolari e prodotti consigliati vedi etichettatura.'

export const FOOTER_FIRMA_SX = 'LA FIRMA CONVALIDA I TRE DOCUMENTI'
export const FOOTER_FIRMA_DX = 'FIRMA DEL MEDICO PER RICEVUTA'
```

- [ ] **Step 3: Build per verificare nessun errore di sintassi**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/templates/lab.js src/templates/conformita.fixed.js
git commit -m "feat: costanti conformità (lab esteso + testi fissi)"
```

---

### Task 1: Formatter puri conformita.format.js (TDD)

**Files:**
- Create: `src/templates/conformita.format.js`
- Test: `src/templates/conformita.format.test.js`

- [ ] **Step 1: Write the failing test**

`src/templates/conformita.format.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { pulisciMateriali, conformitaToProps } from './conformita.format.js'

describe('pulisciMateriali', () => {
  it('scarta le righe completamente vuote', () => {
    const out = pulisciMateriali([
      { tipo: 'Ivocron', fabbricante: 'Ivoclar', modello: 'Ivocron', lotto: 'J14491' },
      { tipo: '', fabbricante: '', modello: '', lotto: '' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({ tipo: 'Ivocron', fabbricante: 'Ivoclar', modello: 'Ivocron', lotto: 'J14491' })
  })
  it('tiene una riga se almeno un campo è valorizzato', () => {
    const out = pulisciMateriali([{ tipo: '', fabbricante: '', modello: '', lotto: 'X1' }])
    expect(out).toHaveLength(1)
  })
  it('gestisce array mancante', () => {
    expect(pulisciMateriali()).toEqual([])
  })
})

describe('conformitaToProps', () => {
  const doc = {
    data: '11-11-21',
    dataConsegna: '11-12-21',
    prescrizioneMedicaDel: '11-11-21',
    paziente: '  Botticelli Angela  ',
    descrizioneDispositivo: '4 corone provvisorie',
    terminiUtilizzazione: '',
    avvertenze: '', prodottiConsigliati: '', noteParticolari: '',
    clienteSnapshot: {
      denominazione: 'Dott. Pascquale Sacripante', indirizzo: 'Via M. Capuani',
      cap: '64100', citta: 'Teramo', prov: 'TE',
      cf: 'SCRPQL62C10C517H', piva: '00731940672',
    },
    materiali: [
      { tipo: 'Ivoclar-vivadent Ivocron', fabbricante: 'Ivoclar-vivadent', modello: 'Ivocron', lotto: 'J14491' },
      { tipo: '', fabbricante: '', modello: '', lotto: '' },
    ],
  }

  it('trimma il paziente', () => {
    expect(conformitaToProps(doc).paziente).toBe('Botticelli Angela')
  })
  it('mappa il prescrivente dal clienteSnapshot', () => {
    const p = conformitaToProps(doc).prescrivente
    expect(p.denominazione).toBe('Dott. Pascquale Sacripante')
    expect(p.cittaRiga).toBe('64100 Teramo (TE)')
    expect(p.cfPiva).toBe('C.F. SCRPQL62C10C517H   P.Iva 00731940672')
  })
  it('pulisce i materiali scartando le righe vuote', () => {
    expect(conformitaToProps(doc).materiali).toHaveLength(1)
  })
  it('prescrivente vuoto se clienteSnapshot manca', () => {
    const p = conformitaToProps({ ...doc, clienteSnapshot: null }).prescrivente
    expect(p.denominazione).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/templates/conformita.format.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Write minimal implementation**

`src/templates/conformita.format.js`:

```js
// Formatter puri per il PDF conformità. Niente JSX → unit-testabile.
function anagraficaToProps(a = {}) {
  return {
    denominazione: a.denominazione ?? '',
    indirizzo: a.indirizzo ?? '',
    cittaRiga: `${a.cap ?? ''} ${a.citta ?? ''} (${a.prov ?? ''})`.trim(),
    cfPiva: `C.F. ${a.cf ?? ''}   P.Iva ${a.piva ?? ''}`,
  }
}

export function pulisciMateriali(materiali = []) {
  return (materiali ?? [])
    .map((m) => ({
      tipo: m.tipo ?? '', fabbricante: m.fabbricante ?? '',
      modello: m.modello ?? '', lotto: m.lotto ?? '',
    }))
    .filter((m) => m.tipo || m.fabbricante || m.modello || m.lotto)
}

export function conformitaToProps(doc) {
  return {
    data: doc.data ?? '',
    dataConsegna: doc.dataConsegna ?? '',
    prescrizioneMedicaDel: doc.prescrizioneMedicaDel ?? '',
    paziente: (doc.paziente ?? '').trim(),
    descrizioneDispositivo: doc.descrizioneDispositivo ?? '',
    terminiUtilizzazione: doc.terminiUtilizzazione ?? '',
    avvertenze: doc.avvertenze ?? '',
    prodottiConsigliati: doc.prodottiConsigliati ?? '',
    noteParticolari: doc.noteParticolari ?? '',
    prescrivente: anagraficaToProps(doc.clienteSnapshot ?? {}),
    materiali: pulisciMateriali(doc.materiali),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/templates/conformita.format.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/templates/conformita.format.js src/templates/conformita.format.test.js
git commit -m "feat: formatter puri conformità (conformitaToProps + pulisciMateriali)"
```

---

### Task 2: Data layer lib/db/conformita.js (TDD)

**Files:**
- Create: `src/lib/db/conformita.js`
- Test: `src/lib/db/__tests__/conformita.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/db/__tests__/conformita.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = { writes: [], deletes: [], doc: null }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => ({ name }),
  doc: (colOrDb, id) => ({ id: id ?? 'auto-id' }),
  addDoc: vi.fn((col, data) => { store.writes.push({ data }); return Promise.resolve({ id: 'new-id' }) }),
  updateDoc: vi.fn((ref, data) => { store.writes.push({ ref, data }); return Promise.resolve() }),
  deleteDoc: vi.fn((ref) => { store.deletes.push(ref); return Promise.resolve() }),
  getDoc: vi.fn((ref) => Promise.resolve({
    exists: () => store.doc != null, id: ref.id, data: () => store.doc,
  })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [{ id: 'c1', data: () => ({ paziente: 'Botticelli Angela', data: '11-11-21' }) }],
  })),
  query: (col) => col,
  orderBy: () => ({}),
  serverTimestamp: () => 'TS',
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

beforeEach(() => { store.writes = []; store.deletes = []; store.doc = null })

describe('conformita db', () => {
  it('crea scrive il documento con i timestamp', async () => {
    const { crea } = await import('../conformita.js')
    const id = await crea({ paziente: 'Botticelli Angela', materiali: [] })
    expect(id).toBe('new-id')
    expect(store.writes[0].data.paziente).toBe('Botticelli Angela')
    expect(store.writes[0].data.creatoIl).toBe('TS')
  })

  it('getOne ritorna il doc con id', async () => {
    store.doc = { paziente: 'X' }
    const { getOne } = await import('../conformita.js')
    expect(await getOne('c1')).toEqual({ id: 'c1', paziente: 'X' })
  })

  it('getOne ritorna null se non esiste', async () => {
    store.doc = null
    const { getOne } = await import('../conformita.js')
    expect(await getOne('c1')).toBeNull()
  })

  it('aggiorna scrive i campi + aggiornatoIl', async () => {
    const { aggiorna } = await import('../conformita.js')
    await aggiorna('c1', { paziente: 'Y' })
    expect(store.writes[0].data.paziente).toBe('Y')
    expect(store.writes[0].data.aggiornatoIl).toBe('TS')
  })

  it('elimina cancella il documento', async () => {
    const { elimina } = await import('../conformita.js')
    await elimina('c1')
    expect(store.deletes).toHaveLength(1)
  })

  it('listAll ritorna i docs con id', async () => {
    const { listAll } = await import('../conformita.js')
    const out = await listAll()
    expect(out).toEqual([{ id: 'c1', paziente: 'Botticelli Angela', data: '11-11-21' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/db/__tests__/conformita.test.js`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Write minimal implementation**

`src/lib/db/conformita.js`:

```js
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const col = () => collection(db, 'conformita')

export async function crea(dati) {
  const ref = await addDoc(col(), {
    data: dati.data ?? '',
    dataConsegna: dati.dataConsegna ?? '',
    prescrizioneMedicaDel: dati.prescrizioneMedicaDel ?? '',
    clienteId: dati.clienteId ?? null,
    clienteSnapshot: dati.clienteSnapshot ?? null,
    paziente: dati.paziente ?? '',
    descrizioneDispositivo: dati.descrizioneDispositivo ?? '',
    terminiUtilizzazione: dati.terminiUtilizzazione ?? '',
    avvertenze: dati.avvertenze ?? '',
    prodottiConsigliati: dati.prodottiConsigliati ?? '',
    noteParticolari: dati.noteParticolari ?? '',
    materiali: dati.materiali ?? [],
    creatoIl: serverTimestamp(),
    aggiornatoIl: serverTimestamp(),
  })
  return ref.id
}

export async function getOne(id) {
  const snap = await getDoc(doc(col(), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function aggiorna(id, dati) {
  await updateDoc(doc(col(), id), { ...dati, aggiornatoIl: serverTimestamp() })
}

export async function elimina(id) {
  await deleteDoc(doc(col(), id))
}

export async function listAll() {
  const snap = await getDocs(query(col(), orderBy('data', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/db/__tests__/conformita.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/conformita.js src/lib/db/__tests__/conformita.test.js
git commit -m "feat: data layer conformità (CRUD Firestore)"
```

---

### Task 3: Stili PDF conformitaPdf.styles.js

**Files:**
- Create: `src/templates/conformitaPdf.styles.js`

- [ ] **Step 1: Creare il file stili**

`src/templates/conformitaPdf.styles.js`:

```js
import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 30, paddingHorizontal: 28, fontSize: 8, fontFamily: 'Helvetica', color: '#000' },

  // Header laboratorio (solo versione CON intestazione)
  labHeader: { textAlign: 'center', marginBottom: 4 },
  labNome: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  labNomeUpper: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  labRiga: { fontSize: 7 },

  // Riga Ministero / REA
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  ministero: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  ministeroNum: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginLeft: 16 },
  rea: { borderWidth: 1, borderColor: '#000', paddingVertical: 3, paddingHorizontal: 6, fontFamily: 'Helvetica-Bold' },

  // Box affiancati Dichiarazione | Etichettatura
  boxes: { flexDirection: 'row', borderWidth: 1, borderColor: '#000' },
  boxCol: { flex: 1, padding: 5 },
  boxColSep: { borderLeftWidth: 1, borderLeftColor: '#000' },
  boxTitolo: { fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  riga: { marginBottom: 2 },
  rigaSpazio: { marginTop: 6 },
  underline: { textDecoration: 'underline' },
  bullet: { marginLeft: 8 },
  sezioneTitolo: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginTop: 6 },

  // Tabella materiali
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 3, marginTop: 8, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 1 },
  cTipo: { width: '30%' },
  cFabbricante: { width: '28%' },
  cModello: { width: '20%' },
  cLotto: { width: '22%' },

  // Istruzioni d'uso
  istrTitolo: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginTop: 12, fontSize: 8 },
  istrPar: { marginTop: 4, fontSize: 7, lineHeight: 1.3 },
  istrItem: { marginTop: 2, fontSize: 7, lineHeight: 1.3 },
  istrBullet: { marginTop: 2, marginLeft: 8, fontSize: 7, lineHeight: 1.3 },

  // Footer firme
  firme: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, fontSize: 8 },
})
```

- [ ] **Step 2: Build per verificare sintassi**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/templates/conformitaPdf.styles.js
git commit -m "feat: stili PDF conformità"
```

---

### Task 4: Componente ConformitaPDF.jsx (+ smoke test)

**Files:**
- Create: `src/templates/ConformitaPDF.jsx`
- Test: `src/templates/ConformitaPDF.test.jsx`

- [ ] **Step 1: Write the failing smoke test**

`src/templates/ConformitaPDF.test.jsx`:

```js
import { describe, it, expect } from 'vitest'
import ConformitaPDF from './ConformitaPDF.jsx'

const doc = {
  data: '11-11-21', dataConsegna: '11-12-21', prescrizioneMedicaDel: '11-11-21',
  paziente: 'Botticelli Angela', descrizioneDispositivo: '4 corone provvisorie',
  terminiUtilizzazione: '', avvertenze: '', prodottiConsigliati: '', noteParticolari: '',
  clienteSnapshot: {
    denominazione: 'Dott. Pascquale Sacripante', indirizzo: 'Via M. Capuani',
    cap: '64100', citta: 'Teramo', prov: 'TE', cf: 'SCRPQL62C10C517H', piva: '00731940672',
  },
  materiali: [{ tipo: 'Ivoclar-vivadent Ivocron', fabbricante: 'Ivoclar-vivadent', modello: 'Ivocron', lotto: 'J14491' }],
}

describe('ConformitaPDF', () => {
  it('si istanzia con intestazione senza lanciare', () => {
    expect(() => ConformitaPDF({ conformita: doc, intestazione: true })).not.toThrow()
  })
  it('si istanzia senza intestazione senza lanciare', () => {
    expect(() => ConformitaPDF({ conformita: doc, intestazione: false })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/templates/ConformitaPDF.test.jsx`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Write implementation**

`src/templates/ConformitaPDF.jsx`:

```jsx
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LAB } from './lab.js'
import { styles } from './conformitaPdf.styles.js'
import { conformitaToProps } from './conformita.format.js'
import {
  BULLET_CONSERVAZIONE, DICHIARAZIONE,
  ISTRUZIONI_TITOLO, ISTRUZIONI_SOTTOTITOLO, ISTRUZIONI_INTRO, ISTRUZIONI_NUMERATE,
  ISTRUZIONI_RESPONSABILITA, ISTRUZIONI_EFFETTI, ISTRUZIONI_AVVERTENZE_TITOLO,
  ISTRUZIONI_AVVERTENZE, ISTRUZIONI_NOTA, FOOTER_FIRMA_SX, FOOTER_FIRMA_DX,
} from './conformita.fixed.js'

function LabHeader() {
  return (
    <View style={styles.labHeader}>
      <Text style={styles.labNome}>{LAB.nome}</Text>
      <Text style={styles.labNomeUpper}>{LAB.nomeUpper}</Text>
      <Text style={styles.labRiga}>{LAB.indirizzo}</Text>
      <Text style={styles.labRiga}>{LAB.tel}</Text>
      <Text style={styles.labRiga}>{LAB.cfPiva}</Text>
    </View>
  )
}

function BoxDichiarazione({ p }) {
  return (
    <View style={styles.boxCol}>
      <Text style={styles.boxTitolo}>DICHIARAZIONE DEL FABBRICANTE</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Data: </Text>{p.data}    <Text style={styles.bold}>Data consegna: </Text>{p.dataConsegna}</Text>
      <Text style={[styles.bold, styles.rigaSpazio]}>Descrizione del dispositivo:</Text>
      <Text style={styles.riga}>{p.descrizioneDispositivo}</Text>
      <View style={styles.rigaSpazio}>
        <Text><Text style={styles.bold}>Prescrivente: </Text>{p.prescrivente.denominazione}</Text>
        <Text>{p.prescrivente.indirizzo}</Text>
        <Text>{p.prescrivente.cittaRiga}</Text>
        <Text style={styles.underline}>{p.prescrivente.cfPiva}</Text>
      </View>
      <Text style={styles.rigaSpazio}>Con riferimento alla Vs. prescrizione riguardante il/la Sig./sig.ra:</Text>
      <Text style={styles.bold}>{p.paziente}</Text>
      <View style={styles.rigaSpazio}>
        {DICHIARAZIONE.map((t, i) => <Text key={i} style={styles.riga}>{t}</Text>)}
      </View>
    </View>
  )
}

function BoxEtichettatura({ p }) {
  return (
    <View style={[styles.boxCol, styles.boxColSep]}>
      <Text style={styles.boxTitolo}>ETICHETTATURA</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Cognome e Nome: </Text>{p.paziente}</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Prescrizione medica del: </Text>{p.prescrizioneMedicaDel}</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Data consegna: </Text>{p.dataConsegna}</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Dispositivo: </Text>{p.descrizioneDispositivo}</Text>
      <Text style={styles.rigaSpazio}>Codice          Identificativo n.</Text>
      <Text>Condizioni specifiche di conservazione e manipolazione</Text>
      {BULLET_CONSERVAZIONE.map((b, i) => <Text key={i} style={styles.bullet}>• {b}</Text>)}
      <Text style={styles.riga}>Termini per l'utilizzazione: {p.terminiUtilizzazione} giorni</Text>
      <Text style={styles.sezioneTitolo}>CONSERVAZIONE E MANIPOLAZIONE:</Text>
      <Text style={styles.riga}>Avvertenze: {p.avvertenze}</Text>
      <Text style={styles.riga}>Prodotti consigliati per pulizia e manutenzione: {p.prodottiConsigliati}</Text>
      <Text style={styles.riga}>Note particolari per la eventuale attivazione: {p.noteParticolari}</Text>
    </View>
  )
}

function TabellaMateriali({ materiali }) {
  return (
    <View>
      <View style={styles.tableHead}>
        <Text style={styles.cTipo}>Tipo</Text>
        <Text style={styles.cFabbricante}>Fabbricante</Text>
        <Text style={styles.cModello}>Modello</Text>
        <Text style={styles.cLotto}>Lotto</Text>
      </View>
      {materiali.map((m, i) => (
        <View style={styles.tableRow} key={i}>
          <Text style={styles.cTipo}>{m.tipo}</Text>
          <Text style={styles.cFabbricante}>{m.fabbricante}</Text>
          <Text style={styles.cModello}>{m.modello}</Text>
          <Text style={styles.cLotto}>{m.lotto}</Text>
        </View>
      ))}
    </View>
  )
}

function Istruzioni() {
  return (
    <View>
      <Text style={styles.istrTitolo}>{ISTRUZIONI_TITOLO} <Text style={{ fontFamily: 'Helvetica' }}>{ISTRUZIONI_SOTTOTITOLO}</Text></Text>
      <Text style={styles.istrPar}>{ISTRUZIONI_INTRO}</Text>
      {ISTRUZIONI_NUMERATE.map((t, i) => <Text key={i} style={styles.istrItem}>{t}</Text>)}
      <Text style={styles.istrPar}>{ISTRUZIONI_RESPONSABILITA}</Text>
      {ISTRUZIONI_EFFETTI.map((t, i) => <Text key={i} style={styles.istrBullet}>- {t}</Text>)}
      <Text style={styles.istrPar}>{ISTRUZIONI_AVVERTENZE_TITOLO}</Text>
      {ISTRUZIONI_AVVERTENZE.map((t, i) => <Text key={i} style={styles.istrBullet}>- {t}</Text>)}
      <Text style={styles.istrItem}>{ISTRUZIONI_NOTA}</Text>
    </View>
  )
}

export default function ConformitaPDF({ conformita, intestazione = true }) {
  const p = conformitaToProps(conformita)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {intestazione && <LabHeader />}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.ministero}>N° MINISTERO DELLA SANITA'</Text>
            <Text style={styles.ministeroNum}>{LAB.ministero}</Text>
          </View>
          <Text style={styles.rea}>R.E.A {LAB.rea}</Text>
        </View>
        <View style={styles.boxes}>
          <BoxDichiarazione p={p} />
          <BoxEtichettatura p={p} />
        </View>
        <TabellaMateriali materiali={p.materiali} />
        <Istruzioni />
        <View style={styles.firme}>
          <Text>{FOOTER_FIRMA_SX}</Text>
          <Text>{FOOTER_FIRMA_DX}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/templates/ConformitaPDF.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/templates/ConformitaPDF.jsx src/templates/ConformitaPDF.test.jsx
git commit -m "feat: componente ConformitaPDF (@react-pdf, prop intestazione)"
```

---

### Task 5: PulsanteScaricaPdfConformita.jsx

**Files:**
- Create: `src/components/conformita/PulsanteScaricaPdfConformita.jsx`

- [ ] **Step 1: Creare il componente**

`src/components/conformita/PulsanteScaricaPdfConformita.jsx`:

```jsx
import { PDFDownloadLink } from '@react-pdf/renderer'
import ConformitaPDF from '../../templates/ConformitaPDF.jsx'

function slug(s = '') {
  return s.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
}

export default function PulsanteScaricaPdfConformita({ conformita, intestazione, label }) {
  const data = (conformita.data ?? '').replace(/\//g, '-')
  const paziente = slug(conformita.paziente)
  const suffix = intestazione ? '' : '_paziente'
  const fileName = `Rapporto_${data}_${paziente}${suffix}.pdf`
  return (
    <PDFDownloadLink
      document={<ConformitaPDF conformita={conformita} intestazione={intestazione} />}
      fileName={fileName}
      className="inline-block bg-blue-600 text-white rounded px-4 py-2"
    >
      {({ loading }) => (loading ? 'Preparo PDF…' : label)}
    </PDFDownloadLink>
  )
}
```

- [ ] **Step 2: Build per verificare sintassi**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/conformita/PulsanteScaricaPdfConformita.jsx
git commit -m "feat: bottone scarica PDF conformità (con/senza intestazione)"
```

---

### Task 6: RigaMateriale.jsx (riga materiale con autocomplete prodotti)

**Files:**
- Create: `src/components/conformita/RigaMateriale.jsx`

- [ ] **Step 1: Creare il componente**

`src/components/conformita/RigaMateriale.jsx`. L'autocomplete usa la datalist `prodotti-materiale-list` (definita nell'editor, Task 7). Selezionando un prodotto per descrizione prefilla tipo/fabbricante/modello; il lotto resta a mano; tutti i campi restano editabili.

```jsx
export default function RigaMateriale({ riga, prodotti, onChange, onRemove }) {
  function set(field, value) {
    onChange({ ...riga, [field]: value })
  }
  function onTipo(tipo) {
    const p = prodotti.find((x) => (x.descrizione ?? '') === tipo)
    if (p) {
      onChange({
        ...riga,
        tipo,
        fabbricante: p.produttore ?? '',
        modello: p.descrizione ?? '',
      })
    } else {
      onChange({ ...riga, tipo })
    }
  }
  return (
    <tr className="border-t">
      <td className="p-1"><input list="prodotti-materiale-list" className="border rounded p-1 w-full" value={riga.tipo ?? ''} onChange={(e) => onTipo(e.target.value)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.fabbricante ?? ''} onChange={(e) => set('fabbricante', e.target.value)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.modello ?? ''} onChange={(e) => set('modello', e.target.value)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.lotto ?? ''} onChange={(e) => set('lotto', e.target.value)} /></td>
      <td className="p-1"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
```

- [ ] **Step 2: Build per verificare sintassi**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/conformita/RigaMateriale.jsx
git commit -m "feat: RigaMateriale con autocomplete prodotti"
```

---

### Task 7: EditorConformita.jsx

**Files:**
- Create: `src/pages/Conformita/EditorConformita.jsx`

- [ ] **Step 1: Creare la pagina editor**

`src/pages/Conformita/EditorConformita.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listAll as listAnagrafica } from '../../lib/db/anagrafiche.js'
import { crea, getOne, aggiorna, elimina } from '../../lib/db/conformita.js'
import ClienteSelect from '../../components/ClienteSelect.jsx'
import RigaMateriale from '../../components/conformita/RigaMateriale.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

const materialeVuoto = () => ({ tipo: '', fabbricante: '', modello: '', lotto: '' })
const vuota = () => ({
  data: '', dataConsegna: '', prescrizioneMedicaDel: '',
  clienteId: null, clienteSnapshot: null, paziente: '',
  descrizioneDispositivo: '', terminiUtilizzazione: '',
  avvertenze: '', prodottiConsigliati: '', noteParticolari: '',
  materiali: [materialeVuoto()],
})

export default function EditorConformita() {
  const { id } = useParams()
  const nav = useNavigate()
  const [doc, setDoc] = useState(vuota())
  const [prodotti, setProdotti] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => { listAnagrafica('prodotti').then(setProdotti) }, [])
  useEffect(() => { if (id) getOne(id).then((d) => { if (d) setDoc(d) }) }, [id])

  const set = (field, value) => setDoc((d) => ({ ...d, [field]: value }))
  const setMateriale = (i, m) => setDoc((d) => ({ ...d, materiali: d.materiali.map((x, j) => (j === i ? m : x)) }))
  const addMateriale = () => setDoc((d) => ({ ...d, materiali: [...d.materiali, materialeVuoto()] }))
  const removeMateriale = (i) => setDoc((d) => ({ ...d, materiali: d.materiali.filter((_, j) => j !== i) }))

  async function salva() {
    setError(''); setBusy(true)
    try {
      if (id) { await aggiorna(id, doc); nav(`/conformita/${id}`) }
      else {
        const newId = await crea(doc)
        nav(`/conformita/${newId}`)
      }
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-bold mb-4">{id ? 'Modifica rapportino' : 'Nuovo rapportino'}</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <label className="block">Medico prescrivente
          <ClienteSelect value={doc.clienteId} onChange={(sel) => setDoc((d) => ({ ...d, ...sel }))} />
        </label>
        <label className="block">Paziente
          <input className="border rounded p-2 w-full" value={doc.paziente} onChange={(e) => set('paziente', e.target.value)} />
        </label>
        <label className="block">Descrizione dispositivo
          <input className="border rounded p-2 w-full" value={doc.descrizioneDispositivo} onChange={(e) => set('descrizioneDispositivo', e.target.value)} />
        </label>
        <label className="block">Prescrizione medica del
          <input className="border rounded p-2 w-full" value={doc.prescrizioneMedicaDel} onChange={(e) => set('prescrizioneMedicaDel', e.target.value)} />
        </label>
        <label className="block">Data
          <input className="border rounded p-2 w-full" value={doc.data} onChange={(e) => set('data', e.target.value)} />
        </label>
        <label className="block">Data consegna
          <input className="border rounded p-2 w-full" value={doc.dataConsegna} onChange={(e) => set('dataConsegna', e.target.value)} />
        </label>
        <label className="block">Termini per l'utilizzazione (giorni)
          <input className="border rounded p-2 w-full" value={doc.terminiUtilizzazione} onChange={(e) => set('terminiUtilizzazione', e.target.value)} />
        </label>
        <label className="block">Avvertenze
          <input className="border rounded p-2 w-full" value={doc.avvertenze} onChange={(e) => set('avvertenze', e.target.value)} />
        </label>
        <label className="block">Prodotti consigliati
          <input className="border rounded p-2 w-full" value={doc.prodottiConsigliati} onChange={(e) => set('prodottiConsigliati', e.target.value)} />
        </label>
        <label className="block">Note particolari
          <input className="border rounded p-2 w-full" value={doc.noteParticolari} onChange={(e) => set('noteParticolari', e.target.value)} />
        </label>
      </div>

      <datalist id="prodotti-materiale-list">
        {prodotti.map((p) => <option key={p.id} value={p.descrizione}>{p.cod}</option>)}
      </datalist>
      <h3 className="font-bold mb-2">Materiali</h3>
      <table className="w-full text-sm mb-2">
        <thead className="bg-gray-50"><tr>
          <th className="p-1 text-left">Tipo</th><th className="p-1 text-left">Fabbricante</th>
          <th className="p-1 text-left">Modello</th><th className="p-1 text-left">Lotto</th><th></th>
        </tr></thead>
        <tbody>
          {doc.materiali.map((m, i) => (
            <RigaMateriale key={i} riga={m} prodotti={prodotti} onChange={(nm) => setMateriale(i, nm)} onRemove={() => removeMateriale(i)} />
          ))}
        </tbody>
      </table>
      <button type="button" className="text-blue-600 mb-4" onClick={addMateriale}>+ Aggiungi materiale</button>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50" onClick={salva}>Salva</button>
        {id && <button type="button" disabled={busy} className="text-red-600 ml-auto" onClick={() => setConfirmDelete(true)}>Elimina</button>}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message="Eliminare questo rapportino?"
          confirmLabel="Elimina"
          onConfirm={async () => { await elimina(id); nav('/conformita') }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build per verificare sintassi**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Conformita/EditorConformita.jsx
git commit -m "feat: EditorConformita (form + materiali + salva/elimina)"
```

---

### Task 8: ListaConformita.jsx + DettaglioConformita.jsx

**Files:**
- Create: `src/pages/Conformita/ListaConformita.jsx`
- Create: `src/pages/Conformita/DettaglioConformita.jsx`

- [ ] **Step 1: Creare ListaConformita.jsx**

`src/pages/Conformita/ListaConformita.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAll } from '../../lib/db/conformita.js'

export default function ListaConformita() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { listAll().then((d) => { setRows(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) =>
      [r.paziente, r.data, r.clienteSnapshot?.denominazione]
        .some((v) => String(v ?? '').toLowerCase().includes(n)))
  }, [rows, q])

  if (loading) return <p className="p-6">Caricamento…</p>
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Conformità</h2>
        <Link to="/conformita/nuova" className="bg-blue-600 text-white rounded px-3 py-1">Nuovo</Link>
        <input className="border rounded p-2 ml-auto w-64" placeholder="Cerca paziente/data…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Data</th><th className="text-left p-2">Paziente</th>
          <th className="text-left p-2">Dispositivo</th><th className="text-left p-2">Medico</th>
        </tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2"><Link className="text-blue-600" to={`/conformita/${r.id}`}>{r.data || '—'}</Link></td>
              <td className="p-2">{r.paziente}</td>
              <td className="p-2">{r.descrizioneDispositivo}</td>
              <td className="p-2">{r.clienteSnapshot?.denominazione ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun rapportino.</p>}
    </div>
  )
}
```

- [ ] **Step 2: Creare DettaglioConformita.jsx**

`src/pages/Conformita/DettaglioConformita.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOne } from '../../lib/db/conformita.js'
import PulsanteScaricaPdfConformita from '../../components/conformita/PulsanteScaricaPdfConformita.jsx'

export default function DettaglioConformita() {
  const { id } = useParams()
  const [doc, setDoc] = useState(undefined)
  useEffect(() => { getOne(id).then(setDoc) }, [id])

  if (doc === undefined) return <p className="p-6">Caricamento…</p>
  if (doc === null) return <p className="p-6">Rapportino non trovato.</p>

  const c = doc.clienteSnapshot ?? {}
  return (
    <div className="p-6 max-w-3xl">
      <Link to="/conformita" className="text-blue-600">← Conformità</Link>
      <h2 className="text-xl font-bold my-3">Rapportino — {doc.paziente}</h2>
      <p>Data: {doc.data} · Consegna: {doc.dataConsegna}</p>
      <p className="mt-2">Dispositivo: {doc.descrizioneDispositivo}</p>
      <p className="mt-2 font-medium">{c.denominazione}</p>
      <p className="text-sm text-gray-600">{c.indirizzo} — {c.cap} {c.citta} ({c.prov})</p>
      <table className="w-full text-sm my-4">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Tipo</th><th className="text-left p-2">Fabbricante</th>
          <th className="text-left p-2">Modello</th><th className="text-left p-2">Lotto</th>
        </tr></thead>
        <tbody>
          {(doc.materiali ?? []).map((m, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{m.tipo}</td><td className="p-2">{m.fabbricante}</td>
              <td className="p-2">{m.modello}</td><td className="p-2">{m.lotto}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-3 items-center">
        <PulsanteScaricaPdfConformita conformita={doc} intestazione label="Scarica PDF (per medico)" />
        <PulsanteScaricaPdfConformita conformita={doc} intestazione={false} label="Scarica PDF (per paziente)" />
        <Link to={`/conformita/${id}/modifica`} className="text-blue-600 ml-auto">Modifica</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build per verificare sintassi**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Conformita/ListaConformita.jsx src/pages/Conformita/DettaglioConformita.jsx
git commit -m "feat: lista + dettaglio conformità (2 bottoni PDF)"
```

---

### Task 9: Routing + link Home

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Aggiungere import e rotte in App.jsx**

In `src/App.jsx`, aggiungere agli import (dopo la riga `import DettaglioFattura ...`):

```jsx
import ListaConformita from './pages/Conformita/ListaConformita.jsx'
import EditorConformita from './pages/Conformita/EditorConformita.jsx'
import DettaglioConformita from './pages/Conformita/DettaglioConformita.jsx'
```

E aggiungere le rotte dentro `<Routes>` (dopo la rotta `/fatture/:id/modifica`):

```jsx
        <Route path="/conformita" element={<ListaConformita />} />
        <Route path="/conformita/nuova" element={<EditorConformita />} />
        <Route path="/conformita/:id" element={<DettaglioConformita />} />
        <Route path="/conformita/:id/modifica" element={<EditorConformita />} />
```

- [ ] **Step 2: Attivare il link in Home.jsx**

In `src/pages/Home.jsx`, sostituire:

```jsx
        <span className="text-gray-400">Conformità</span>
```

con:

```jsx
        <Link to="/conformita" className="text-blue-600">Conformità</Link>
```

- [ ] **Step 3: Run full test suite + build**

Run: `npx vitest run && npm run build`
Expected: tutti i test verdi (73 precedenti + nuovi), build OK.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/pages/Home.jsx
git commit -m "feat: routing conformità + link Home"
```

---

### Task 10: Verifica visiva PDF (manuale, copia fedele)

**Files:** nessuna modifica (eventuali fix di layout in `conformitaPdf.styles.js` / `ConformitaPDF.jsx`).

- [ ] **Step 1: Generare un PDF di prova coi dati dell'esempio**

Creare uno script temporaneo `tmp-gen-conformita.mjs` nella root del progetto che renda il PDF coi dati dell'esempio (Botticelli Angela, Dott. Sacripante, 2 righe Ivoclar-vivadent Ivocron lotti J14491/M73957) in **entrambe** le versioni (`intestazione: true` → `tmp_conformita_medico.pdf`, `intestazione: false` → `tmp_conformita_paziente.pdf`), usando `@react-pdf/renderer` `renderToFile`. Dati materiali:
- `{ tipo: 'Ivoclar-vivadent Ivocron', fabbricante: 'Ivoclar-vivadent', modello: 'Ivocron', lotto: 'J14491' }`
- `{ tipo: 'Ivoclar-vivadent Ivocron', fabbricante: 'Ivoclar-vivadent', modello: 'Ivocron', lotto: 'M73957' }`

Run: `node tmp-gen-conformita.mjs`
Expected: i due PDF generati.

- [ ] **Step 2: Leggere i PDF generati e confrontarli con gli esempi**

Usare lo strumento Read sui due PDF generati e sui due esempi:
- `Rapporto d_intervento del 21-12-2023  Dott Pascquale Sacripante.pdf` (CON intestazione)
- `Rapporto d_intervento del 21-12-2023  Dott Pascquale Sacripante senza intestazione - per paziente.pdf` (SENZA)

Confronto fianco-a-fianco: header (Ministero+REA, lab solo nella versione medico), box Dichiarazione|Etichettatura affiancati, bullet conservazione, tabella materiali, blocco istruzioni d'uso, footer firme. Verificare che la versione paziente NON abbia il blocco laboratorio e quella medico SÌ.

- [ ] **Step 3: Correggere eventuali scostamenti di layout**

Se ci sono differenze visive (spaziature, posizioni, font), aggiustare `conformitaPdf.styles.js` / `ConformitaPDF.jsx` e rigenerare finché la resa è una copia fedele. Iterare Step 1-3.

- [ ] **Step 4: Pulizia file temporanei**

```bash
rm tmp-gen-conformita.mjs tmp_conformita_medico.pdf tmp_conformita_paziente.pdf
```

- [ ] **Step 5: Commit eventuali fix layout**

```bash
git add src/templates/conformitaPdf.styles.js src/templates/ConformitaPDF.jsx
git commit -m "fix: layout PDF conformità fedele all'esempio"
```

---

## Note finali (fuori dalle task)

- A fine piano: chiedere conferma per merge `conformita` → `main` + deploy.
- Aggiornare `CLAUDE.md` (changelog sessione 6 + decisione conformità), wiki, log.
- E2e reale dell'utente: crea rapportino → scarica entrambi i PDF.
