# Magazzino + scarico da conformità — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sezione Magazzino in OdontoApp; le quantità prodotto scalano quando una conformità viene scaricata, con stato visivo e reminder all'apertura.

**Architecture:** Il magazzino è una vista sulla collection Firestore `prodotti` (doc id = `cod`), con un nuovo campo `qtaDisponibile`. Logica pura in `utils/magazzino.js`; scritture atomiche (carico/scarico) in `lib/db/magazzino.js` via `runTransaction`. La conformità acquisisce per riga materiale `qta` + `prodottoId` (= cod prodotto), usati solo per il magazzino e mai stampati nel PDF.

**Tech Stack:** React + Vite, Firestore, Vitest, Tailwind, react-router.

---

## File Structure

- `src/services/excel.js` — modify: mappa `qtaDisponibile` da colonna AJ.
- `src/pages/Anagrafiche/schema.js` — modify: campo prodotti `qtaDisponibile`.
- `src/utils/magazzino.js` — create: logica pura (stato, filtro, righe scarico, delta).
- `src/utils/magazzino.test.js` — create.
- `src/lib/db/magazzino.js` — create: `caricaProdotto`, `scaricaConformita`.
- `src/lib/db/__tests__/magazzino.test.js` — create.
- `src/components/RigaFattura.jsx` — modify: + sottocategoria nel detail tendina.
- `src/components/conformita/RigaMateriale.jsx` — modify: + campo Quantità, + prodottoId, + sottocategoria detail.
- `src/pages/Conformita/EditorConformita.jsx` — modify: materialeVuoto con qta/prodottoId, header tabella + "Q.tà".
- `src/templates/conformita.format.js` — (verifica via test) qta/prodottoId NON nei props PDF.
- `src/pages/Magazzino/ListaMagazzino.jsx` — create.
- `src/pages/Conformita/DettaglioConformita.jsx` — modify: bottone "Conferma scarico".
- `src/components/MagazzinoReminder.jsx` — create.
- `src/pages/Home.jsx` — modify: card Magazzino + reminder.
- `src/App.jsx` — modify: route `/magazzino`.

---

### Task 1: Mappa qtaDisponibile da Excel + schema

**Files:**
- Modify: `src/services/excel.js` (funzione `mapProdottoRow`)
- Modify: `src/pages/Anagrafiche/schema.js` (array prodotti)
- Test: `src/services/__tests__/excel.test.js`

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungi in `src/services/__tests__/excel.test.js` (dentro il describe dei prodotti, o nuovo):

```js
import { mapProdottoRow } from '../excel.js'

describe('mapProdottoRow qtaDisponibile', () => {
  it('legge la Q.tà disponibile dalla colonna AJ', () => {
    const r = mapProdottoRow({ 'Cod.': 'P1', 'Descrizione': 'Resina', 'Q.tà disponibile': 12 })
    expect(r.qtaDisponibile).toBe(12)
  })
  it('qtaDisponibile null se vuota', () => {
    const r = mapProdottoRow({ 'Cod.': 'P2', 'Descrizione': 'X' })
    expect(r.qtaDisponibile).toBeNull()
  })
})
```

- [ ] **Step 2: Esegui e verifica che fallisca**

Run: `npm test -- excel`
Expected: FAIL (`qtaDisponibile` undefined).

- [ ] **Step 3: Implementa**

In `src/services/excel.js`, dentro l'oggetto ritornato da `mapProdottoRow`, dopo `prezzoForn`:

```js
    prezzoForn: numOrNull(pick(row, 'Prezzo forn.')),
    // Magazzino
    qtaDisponibile: numOrNull(pick(row, 'Q.tà disponibile')),
```

In `src/pages/Anagrafiche/schema.js`, in fondo all'array `prodotti` (dopo `prezzoForn`):

```js
    { name: 'prezzoForn', label: 'Prezzo fornitore', type: 'number' },
    // Magazzino
    { name: 'qtaDisponibile', label: 'Q.tà disponibile', type: 'number' },
  ],
```

- [ ] **Step 4: Esegui e verifica che passi**

Run: `npm test -- excel`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/excel.js src/pages/Anagrafiche/schema.js src/services/__tests__/excel.test.js
git commit -m "feat(magazzino): mappa qtaDisponibile da Excel (col AJ) + schema"
```

---

### Task 2: Logica pura magazzino (utils/magazzino.js)

**Files:**
- Create: `src/utils/magazzino.js`
- Test: `src/utils/magazzino.test.js`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `src/utils/magazzino.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { statoMagazzino, isServizio, filtroMagazzino, righeScarico, applicaDelta } from './magazzino.js'

describe('statoMagazzino', () => {
  it('disponibile se > 0', () => { expect(statoMagazzino(3)).toBe('disponibile') })
  it('esaurito se 0', () => { expect(statoMagazzino(0)).toBe('esaurito') })
  it('esaurito se negativo', () => { expect(statoMagazzino(-1)).toBe('esaurito') })
  it('esaurito se null/undefined', () => {
    expect(statoMagazzino(null)).toBe('esaurito')
    expect(statoMagazzino(undefined)).toBe('esaurito')
  })
})

describe('isServizio / filtroMagazzino', () => {
  it('riconosce Servizio (case/spazi insensibile)', () => {
    expect(isServizio({ tipologia: 'Servizio' })).toBe(true)
    expect(isServizio({ tipologia: ' servizio ' })).toBe(true)
    expect(isServizio({ tipologia: 'Prodotto' })).toBe(false)
    expect(isServizio({})).toBe(false)
  })
  it('filtroMagazzino esclude i Servizio', () => {
    const out = filtroMagazzino([{ cod: 'A', tipologia: 'Prodotto' }, { cod: 'B', tipologia: 'Servizio' }])
    expect(out.map((p) => p.cod)).toEqual(['A'])
  })
})

describe('righeScarico', () => {
  it('tiene solo righe con prodottoId e qta>0', () => {
    const out = righeScarico([
      { prodottoId: 'A', qta: 2 },
      { prodottoId: 'B', qta: 0 },
      { prodottoId: '', qta: 5 },
      { qta: 3 },
    ])
    expect(out).toEqual([{ prodottoId: 'A', qta: 2 }])
  })
  it('somma le quantità dello stesso prodotto', () => {
    const out = righeScarico([{ prodottoId: 'A', qta: 2 }, { prodottoId: 'A', qta: 3 }])
    expect(out).toEqual([{ prodottoId: 'A', qta: 5 }])
  })
  it('lista vuota / undefined => []', () => {
    expect(righeScarico([])).toEqual([])
    expect(righeScarico(undefined)).toEqual([])
  })
})

describe('applicaDelta', () => {
  it('somma algebrica', () => {
    expect(applicaDelta(10, -3)).toBe(7)
    expect(applicaDelta(5, 4)).toBe(9)
  })
  it('disp null trattato come 0', () => { expect(applicaDelta(null, 5)).toBe(5) })
  it('può andare sotto zero', () => { expect(applicaDelta(2, -5)).toBe(-3) })
})
```

- [ ] **Step 2: Esegui e verifica che fallisca**

Run: `npm test -- magazzino`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementa**

Crea `src/utils/magazzino.js`:

```js
// Logica pura magazzino — niente Firestore, unit-testabile.

export function statoMagazzino(disp) {
  const n = Number(disp)
  return Number.isFinite(n) && n > 0 ? 'disponibile' : 'esaurito'
}

export function isServizio(prodotto) {
  return String(prodotto?.tipologia ?? '').trim().toLowerCase() === 'servizio'
}

export function filtroMagazzino(prodotti) {
  return (prodotti ?? []).filter((p) => !isServizio(p))
}

// Da materiali conformità a [{prodottoId, qta}], solo righe valide, sommate per prodotto.
export function righeScarico(materiali) {
  const map = new Map()
  for (const m of materiali ?? []) {
    const id = m?.prodottoId
    const qta = Number(m?.qta)
    if (!id || !Number.isFinite(qta) || qta <= 0) continue
    map.set(id, (map.get(id) ?? 0) + qta)
  }
  return [...map.entries()].map(([prodottoId, qta]) => ({ prodottoId, qta }))
}

export function applicaDelta(disp, delta) {
  return (Number(disp) || 0) + (Number(delta) || 0)
}
```

- [ ] **Step 4: Esegui e verifica che passi**

Run: `npm test -- magazzino`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/magazzino.js src/utils/magazzino.test.js
git commit -m "feat(magazzino): logica pura stato/filtro/scarico/delta"
```

---

### Task 3: Data layer carico/scarico (lib/db/magazzino.js)

**Files:**
- Create: `src/lib/db/magazzino.js`
- Test: `src/lib/db/__tests__/magazzino.test.js`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `src/lib/db/__tests__/magazzino.test.js` (mock Firestore come progressivo.test.js):

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mem = { docs: {} }

vi.mock('firebase/firestore', () => ({
  doc: (db, coll, id) => ({ path: `${coll}/${id}` }),
  runTransaction: async (db, updateFn) => {
    const tx = {
      get: async (ref) => ({
        exists: () => mem.docs[ref.path] !== undefined,
        data: () => mem.docs[ref.path],
      }),
      update: (ref, data) => { mem.docs[ref.path] = { ...(mem.docs[ref.path] ?? {}), ...data } },
    }
    return updateFn(tx)
  },
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

describe('caricaProdotto', () => {
  beforeEach(() => { mem.docs = {} })
  it('aggiunge quantità', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    mem.docs['prodotti/P1'] = { cod: 'P1', qtaDisponibile: 5 }
    const nuova = await caricaProdotto('P1', 3)
    expect(nuova).toBe(8)
    expect(mem.docs['prodotti/P1'].qtaDisponibile).toBe(8)
  })
  it('parte da 0 se disponibile mancante', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    mem.docs['prodotti/P2'] = { cod: 'P2' }
    expect(await caricaProdotto('P2', 4)).toBe(4)
  })
  it('rifiuta quantità non positiva', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    await expect(caricaProdotto('P1', 0)).rejects.toThrow(/quantità/i)
  })
  it('rifiuta prodotto inesistente', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    await expect(caricaProdotto('nope', 2)).rejects.toThrow(/inesistente/i)
  })
})

describe('scaricaConformita', () => {
  beforeEach(() => { mem.docs = {} })
  it('scala i prodotti e segna scaricata', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    mem.docs['prodotti/A'] = { cod: 'A', qtaDisponibile: 10 }
    mem.docs['prodotti/B'] = { cod: 'B', qtaDisponibile: 4 }
    mem.docs['conformita/c1'] = { materiali: [
      { prodottoId: 'A', qta: 3 }, { prodottoId: 'B', qta: 1 }, { tipo: 'a mano' },
    ] }
    const n = await scaricaConformita('c1')
    expect(n).toBe(2)
    expect(mem.docs['prodotti/A'].qtaDisponibile).toBe(7)
    expect(mem.docs['prodotti/B'].qtaDisponibile).toBe(3)
    expect(mem.docs['conformita/c1'].scaricata).toBe(true)
  })
  it('rifiuta doppio scarico', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    mem.docs['conformita/c1'] = { scaricata: true, materiali: [] }
    await expect(scaricaConformita('c1')).rejects.toThrow(/già scaricat/i)
  })
  it('salta prodotti mancanti senza fallire', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    mem.docs['conformita/c2'] = { materiali: [{ prodottoId: 'X', qta: 2 }] }
    const n = await scaricaConformita('c2')
    expect(n).toBe(1)
    expect(mem.docs['conformita/c2'].scaricata).toBe(true)
  })
  it('rifiuta conformità inesistente', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    await expect(scaricaConformita('nope')).rejects.toThrow(/inesistente/i)
  })
})
```

- [ ] **Step 2: Esegui e verifica che fallisca**

Run: `npm test -- db/__tests__/magazzino`
Expected: FAIL (modulo inesistente).

- [ ] **Step 3: Implementa**

Crea `src/lib/db/magazzino.js`:

```js
import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase.js'
import { righeScarico, applicaDelta } from '../../utils/magazzino.js'

// Aggiunge `qta` alla disponibilità del prodotto (doc id = cod). Ritorna la nuova quantità.
export async function caricaProdotto(cod, qta) {
  const q = Number(qta)
  if (!Number.isFinite(q) || q <= 0) throw new Error('Quantità non valida')
  const ref = doc(db, 'prodotti', cod)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Prodotto inesistente')
    const nuova = applicaDelta(snap.data().qtaDisponibile, q)
    tx.update(ref, { qtaDisponibile: nuova })
    return nuova
  })
}

// Scala il magazzino in base ai materiali della conformità. One-shot (flag `scaricata`).
// Ritorna il numero di righe-prodotto scaricate.
export async function scaricaConformita(conformitaId) {
  const confRef = doc(db, 'conformita', conformitaId)
  return runTransaction(db, async (tx) => {
    const confSnap = await tx.get(confRef)
    if (!confSnap.exists()) throw new Error('Conformità inesistente')
    const conf = confSnap.data()
    if (conf.scaricata) throw new Error('Magazzino già scaricato per questa conformità')

    const righe = righeScarico(conf.materiali)
    // Firestore: tutte le letture PRIMA delle scritture.
    const letti = []
    for (const r of righe) {
      const pRef = doc(db, 'prodotti', r.prodottoId)
      letti.push({ ref: pRef, snap: await tx.get(pRef), qta: r.qta })
    }
    for (const l of letti) {
      if (!l.snap.exists()) continue
      tx.update(l.ref, { qtaDisponibile: applicaDelta(l.snap.data().qtaDisponibile, -l.qta) })
    }
    tx.update(confRef, { scaricata: true })
    return righe.length
  })
}
```

- [ ] **Step 4: Esegui e verifica che passi**

Run: `npm test -- db/__tests__/magazzino`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/magazzino.js src/lib/db/__tests__/magazzino.test.js
git commit -m "feat(magazzino): caricaProdotto + scaricaConformita (transaction)"
```

---

### Task 4: Riga materiale conformità — campo Quantità + prodottoId + sottocategoria

**Files:**
- Modify: `src/components/conformita/RigaMateriale.jsx`
- Modify: `src/pages/Conformita/EditorConformita.jsx`
- Modify: `src/components/RigaFattura.jsx` (sottocategoria nel detail)

Nessun test unitario (UI di display/input). Verifica con build + test esistenti.

- [ ] **Step 1: RigaMateriale — salva prodottoId, aggiungi colonna Quantità e sottocategoria nel detail**

Sostituisci il contenuto di `src/components/conformita/RigaMateriale.jsx`:

```jsx
import { useMemo } from 'react'
import Autocomplete from '../Autocomplete.jsx'

export default function RigaMateriale({ riga, prodotti, onChange, onRemove }) {
  function set(field, value) {
    onChange({ ...riga, [field]: value })
  }
  function fillFromProdotto(p) {
    onChange({
      ...riga,
      tipo: p.descrizione ?? '',
      fabbricante: p.produttore ?? '',
      modello: p.descrizione ?? '',
      prodottoId: p.cod ?? null,
    })
  }

  const opts = useMemo(
    () => prodotti.map((p) => ({
      key: p.id,
      label: p.descrizione ?? '',
      detail: [p.cod, p.produttore, p.categoria, p.sottocategoria].filter(Boolean).join(' — '),
      raw: p,
    })),
    [prodotti],
  )

  return (
    <tr className="border-t">
      <td className="p-1 align-top">
        <Autocomplete value={riga.tipo ?? ''} options={opts} onChangeText={(t) => set('tipo', t)} onSelect={(o) => fillFromProdotto(o.raw)} className="border rounded p-1 w-full min-w-[18rem]" />
      </td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-full" value={riga.fabbricante ?? ''} onChange={(e) => set('fabbricante', e.target.value)} /></td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-full" value={riga.modello ?? ''} onChange={(e) => set('modello', e.target.value)} /></td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-full" value={riga.lotto ?? ''} onChange={(e) => set('lotto', e.target.value)} /></td>
      <td className="p-1 align-top"><input type="number" step="any" className="border rounded p-1 w-20" value={riga.qta ?? ''} onChange={(e) => set('qta', e.target.value === '' ? '' : Number(e.target.value))} /></td>
      <td className="p-1 align-top"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
```

- [ ] **Step 2: EditorConformita — materialeVuoto con qta/prodottoId + header colonna Q.tà**

In `src/pages/Conformita/EditorConformita.jsx`:

Cambia `materialeVuoto`:

```js
const materialeVuoto = () => ({ tipo: '', fabbricante: '', modello: '', lotto: '', qta: '', prodottoId: null })
```

Nell'header tabella materiali, aggiungi la colonna "Q.tà" prima della cella vuota finale:

```jsx
          <th className="p-1 text-left">Modello</th><th className="p-1 text-left">Lotto</th><th className="p-1 text-left">Q.tà</th><th></th>
```

- [ ] **Step 3: RigaFattura — sottocategoria nel detail delle tendine**

In `src/components/RigaFattura.jsx`, aggiungi `p.sottocategoria` ai due `detail` (optsCod e optsDesc):

```js
  const optsCod = useMemo(
    () => prodotti.map((p) => ({ key: p.id, label: p.cod ?? '', detail: [p.descrizione, p.produttore, p.categoria, p.sottocategoria, prezzoLabel(p)].filter(Boolean).join(' — '), raw: p })),
    [prodotti],
  )
  const optsDesc = useMemo(
    () => prodotti.map((p) => ({ key: p.id, label: p.descrizione ?? '', detail: [p.cod, p.produttore, p.categoria, p.sottocategoria, prezzoLabel(p)].filter(Boolean).join(' — '), raw: p })),
    [prodotti],
  )
```

- [ ] **Step 4: Verifica test + build**

Run: `npm test`
Expected: PASS (tutti i test esistenti verdi).
Run: `npm run build`
Expected: build OK.

- [ ] **Step 5: Commit**

```bash
git add src/components/conformita/RigaMateriale.jsx src/pages/Conformita/EditorConformita.jsx src/components/RigaFattura.jsx
git commit -m "feat(magazzino): qta+prodottoId su riga materiale, sottocategoria nelle tendine"
```

---

### Task 5: Verifica che qta/prodottoId NON entrino nel PDF conformità

**Files:**
- Test: `src/templates/conformita.format.test.js` (file esistente; se assente, crea)

- [ ] **Step 1: Scrivi il test**

Aggiungi in `src/templates/conformita.format.test.js`:

```js
import { conformitaToProps, pulisciMateriali } from './conformita.format.js'

describe('materiali nel PDF non includono dati magazzino', () => {
  it('pulisciMateriali scarta qta e prodottoId', () => {
    const out = pulisciMateriali([{ tipo: 'Resina', fabbricante: 'Ivoclar', modello: 'X', lotto: 'L1', qta: 5, prodottoId: 'P1' }])
    expect(out).toEqual([{ tipo: 'Resina', fabbricante: 'Ivoclar', modello: 'X', lotto: 'L1' }])
  })
  it('conformitaToProps non espone qta/prodottoId', () => {
    const props = conformitaToProps({ materiali: [{ tipo: 'A', qta: 2, prodottoId: 'P' }] })
    expect(props.materiali[0]).not.toHaveProperty('qta')
    expect(props.materiali[0]).not.toHaveProperty('prodottoId')
  })
})
```

Verifica prima il nome reale del file test (`conformita.format.test.js` accanto a `conformita.format.js`); se i `describe` esistono già, inserisci solo i nuovi `it`/`describe`.

- [ ] **Step 2: Esegui**

Run: `npm test -- conformita.format`
Expected: PASS (pulisciMateriali già mappa solo tipo/fabbricante/modello/lotto → qta/prodottoId esclusi by design). Se FALLISCE, è un bug regressivo da correggere in `pulisciMateriali`.

- [ ] **Step 3: Commit**

```bash
git add src/templates/conformita.format.test.js
git commit -m "test(magazzino): conferma qta/prodottoId esclusi dal PDF conformità"
```

---

### Task 6: Pagina Magazzino + route + carico per riga

**Files:**
- Create: `src/pages/Magazzino/ListaMagazzino.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Crea la pagina**

Crea `src/pages/Magazzino/ListaMagazzino.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { listAll } from '../../lib/db/anagrafiche.js'
import { caricaProdotto } from '../../lib/db/magazzino.js'
import { filtroMagazzino, statoMagazzino } from '../../utils/magazzino.js'
import PageHeader from '../../components/PageHeader.jsx'

function Badge({ stato }) {
  const ok = stato === 'disponibile'
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {ok ? 'Disponibile' : 'Esaurito'}
    </span>
  )
}

export default function ListaMagazzino() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [carica, setCarica] = useState(null) // { cod, descrizione }
  const [qtaCarico, setQtaCarico] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function reload() {
    setLoading(true)
    listAll('prodotti').then((d) => { setRows(filtroMagazzino(d)); setLoading(false) })
  }
  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) => [r.descrizione, r.cod].some((v) => String(v ?? '').toLowerCase().includes(n)))
  }, [rows, q])

  async function confermaCarico() {
    setError(''); setBusy(true)
    try {
      await caricaProdotto(carica.cod, Number(qtaCarico))
      setCarica(null); setQtaCarico(''); reload()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  if (loading) return <p className="p-6">Caricamento…</p>
  return (
    <div className="p-6">
      <PageHeader title="Magazzino" />
      <div className="flex items-center gap-3 mb-4">
        <input className="border rounded p-2 ml-auto w-64" placeholder="Cerca descrizione/codice…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Descrizione</th><th className="text-left p-2">Cod.</th>
          <th className="text-left p-2">Categoria</th><th className="text-left p-2">Sottocategoria</th>
          <th className="text-left p-2">Stato</th><th className="text-right p-2">Disponibile</th><th></th>
        </tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2 font-bold">{r.descrizione}</td>
              <td className="p-2">{r.cod}</td>
              <td className="p-2">{r.categoria}</td>
              <td className="p-2">{r.sottocategoria}</td>
              <td className="p-2"><Badge stato={statoMagazzino(r.qtaDisponibile)} /></td>
              <td className="p-2 text-right">{r.qtaDisponibile ?? 0}</td>
              <td className="p-2"><button type="button" className="text-blue-600" onClick={() => { setCarica(r); setQtaCarico(''); setError('') }}>Carica</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun prodotto a magazzino.</p>}

      {carica && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <p className="mb-1 font-medium">Carica magazzino</p>
            <p className="mb-3 text-sm text-gray-600">{carica.descrizione} ({carica.cod})</p>
            <input type="number" step="any" autoFocus className="border rounded p-2 w-full mb-2" placeholder="Quantità da aggiungere" value={qtaCarico} onChange={(e) => setQtaCarico(e.target.value)} />
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setCarica(null)}>Annulla</button>
              <button disabled={busy} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50" onClick={confermaCarico}>Carica</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Route in App.jsx**

In `src/App.jsx`, aggiungi l'import:

```js
import ListaMagazzino from './pages/Magazzino/ListaMagazzino.jsx'
```

e la route (dopo le route conformità):

```jsx
        <Route path="/magazzino" element={<ListaMagazzino />} />
```

- [ ] **Step 3: Verifica build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Magazzino/ListaMagazzino.jsx src/App.jsx
git commit -m "feat(magazzino): pagina lista + carico per riga + route"
```

---

### Task 7: Bottone "Conferma scarico" nel dettaglio conformità

**Files:**
- Modify: `src/pages/Conformita/DettaglioConformita.jsx`

- [ ] **Step 1: Implementa**

In `src/pages/Conformita/DettaglioConformita.jsx`:

Aggiungi import:

```js
import { scaricaConformita } from '../../lib/db/magazzino.js'
```

Aggiungi stato dentro il componente (dopo `useEffect`):

```js
  const [scaricoMsg, setScaricoMsg] = useState('')
  const [scaricoBusy, setScaricoBusy] = useState(false)

  async function onScarico() {
    setScaricoMsg(''); setScaricoBusy(true)
    try {
      const n = await scaricaConformita(doc.id)
      setScaricoMsg(`Magazzino aggiornato (${n} prodotti scaricati).`)
      setDoc((d) => ({ ...d, scaricata: true }))
    } catch (e) { setScaricoMsg(e.message) }
    finally { setScaricoBusy(false) }
  }
```

Nella barra azioni (dentro il `div.flex.gap-3`), prima del link Modifica, aggiungi:

```jsx
        {doc.scaricata
          ? <span className="text-sm text-green-700">Magazzino già scaricato ✓</span>
          : <button type="button" disabled={scaricoBusy} className="bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-50" onClick={onScarico}>Conferma scarico</button>}
```

E sotto la barra azioni (dopo il `</div>` che chiude `flex gap-3`), il messaggio:

```jsx
      {scaricoMsg && <p className="text-sm mt-3 text-gray-700">{scaricoMsg}</p>}
```

Verifica che `useState` sia importato (riga 1: `import { useEffect, useState } from 'react'` — già presente).

- [ ] **Step 2: Verifica build + test**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Conformita/DettaglioConformita.jsx
git commit -m "feat(magazzino): bottone Conferma scarico nel dettaglio conformità"
```

---

### Task 8: Card Magazzino + reminder esauriti in Home

**Files:**
- Create: `src/components/MagazzinoReminder.jsx`
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Crea il reminder**

Crea `src/components/MagazzinoReminder.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAll } from '../lib/db/anagrafiche.js'
import { filtroMagazzino, statoMagazzino } from '../utils/magazzino.js'

export default function MagazzinoReminder() {
  const [esauriti, setEsauriti] = useState([])

  useEffect(() => {
    listAll('prodotti').then((d) => {
      setEsauriti(filtroMagazzino(d).filter((p) => statoMagazzino(p.qtaDisponibile) === 'esaurito'))
    }).catch(() => {})
  }, [])

  if (esauriti.length === 0) return null
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-800 mb-1">Prodotti esauriti ({esauriti.length})</p>
      <p className="text-sm text-red-700">{esauriti.slice(0, 8).map((p) => p.descrizione || p.cod).join(', ')}{esauriti.length > 8 ? '…' : ''}</p>
      <Link to="/magazzino" className="text-sm text-red-800 underline">Vai al magazzino</Link>
    </div>
  )
}
```

- [ ] **Step 2: Home — card + reminder**

In `src/pages/Home.jsx`:

Aggiungi import:

```js
import MagazzinoReminder from '../components/MagazzinoReminder.jsx'
```

Aggiungi la voce nell'array `SEZIONI` (dopo anagrafiche):

```js
  { to: '/magazzino', label: 'Magazzino', desc: 'Giacenze e carico prodotti' },
```

Cambia la griglia da `sm:grid-cols-3` a `sm:grid-cols-2` (4 card stanno meglio a 2 colonne):

```jsx
      <nav className="grid gap-4 sm:grid-cols-2">
```

Inserisci `<MagazzinoReminder />` subito dopo il `</header>` e prima del `<nav>`:

```jsx
      </header>
      <MagazzinoReminder />
      <nav className="grid gap-4 sm:grid-cols-2">
```

- [ ] **Step 3: Verifica build + test**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/components/MagazzinoReminder.jsx src/pages/Home.jsx
git commit -m "feat(magazzino): card Home + reminder prodotti esauriti"
```

---

## Note finali (deploy + dati)
- Dopo l'ultimo task: `git push` → GitHub Pages deploya da `main`.
- **Re-import Excel prodotti necessario** perché i prodotti già su Firestore non hanno `qtaDisponibile`. Il re-import resetta la disponibilità al valore del foglio (atteso).
- E2e utente: re-import prodotti → apri Magazzino (stato/colori) → crea conformità con materiale da tendina + qta → Conferma scarico → verifica giacenza scalata → Carica → verifica risale → reminder esauriti in Home.
