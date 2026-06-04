# Anagrafiche + Import Excel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the client's Danea Excel files (clienti, fornitori, prodotti) into Firestore and provide list views to browse the imported anagrafiche.

**Architecture:** Pure parsing/mapping functions (SheetJS) tested in isolation; a thin Firestore data-access layer (mocked in tests); React pages for import (upload → parse → preview → dedup → write) and for listing each anagrafica. Builds on the Foundation app shell (auth gate, Tailwind, `src/lib/firebase.js`).

**Tech Stack:** React, Vite, Tailwind, Firebase Firestore, SheetJS (`xlsx`), Vitest.

---

## Context for implementers

- Repo: `c:/Users/Luca/Desktop/Paolo - LAVORO/Claude/Obsidian Brain/Brain/Peter`, branch will be `anagrafiche` (cut from `main` or current branch — coordinator handles branching).
- Existing: `src/lib/firebase.js` exports `app`, `db`, `auth`. `src/lib/auth.js` exports `useAuth`, `login`, `logout`. App shell in `src/App.jsx` renders `Home` when logged in. Tailwind active. Vitest configured (globals, jsdom).
- Firestore data model (from spec) — target shapes:
  - `clienti/<id>`  → `{ cod, denominazione, indirizzo, cap, citta, prov, cf, piva, pagamento }`
  - `fornitori/<id>` → same shape
  - `prodotti/<id>` → `{ cod, descrizione, tipologia, um, codIva, listino1 }`
- Danea Excel column names (header row), map by header string:
  - Clienti/Fornitori: `Cod.`→cod, `Denominazione`→denominazione, `Indirizzo`→indirizzo, `Cap`→cap, `Città`→citta, `Prov.`→prov, `Codice fiscale`→cf, `Partita Iva`→piva, `Pagamento`→pagamento. NOTE: the `Città` header may arrive mojibaked (e.g. `Citt�`); match it tolerantly (see Task 2).
  - Prodotti: `Cod.`→cod, `Descrizione`→descrizione, `Tipologia`→tipologia, `Cod. Udm`→um, `Cod. Iva`→codIva, `Listino 1`→listino1.
- All values may be `null`/empty → store as empty string `''` for text fields, `null` for numeric `listino1` when absent.

---

## File structure (created/modified by this plan)

```
src/services/excel.js                       # parseWorkbook + mapping + dedup (pure)
src/services/__tests__/excel.test.js
src/lib/db/anagrafiche.js                    # Firestore CRUD (thin)
src/lib/db/__tests__/anagrafiche.test.js
src/pages/Anagrafiche/ImportPage.jsx         # upload → preview → confirm
src/pages/Anagrafiche/__tests__/ImportPage.test.jsx
src/pages/Anagrafiche/ListaAnagrafica.jsx    # generic list view
src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx
src/App.jsx                                  # add minimal routing to the new pages
```

---

## Task 1: Excel parsing + column mapping (pure functions)

**Files:**
- Create: `src/services/excel.js`, `src/services/__tests__/excel.test.js`

- [ ] **Step 1: Install SheetJS**

Run: `npm install xlsx`
Expected: `xlsx` added to dependencies.

- [ ] **Step 2: Write the failing test**

Create `src/services/__tests__/excel.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { mapClienteRow, mapProdottoRow } from '../excel.js'

describe('mapClienteRow', () => {
  it('maps Danea cliente columns to app fields', () => {
    const row = {
      'Cod.': '0004',
      'Denominazione': 'Dott. CIARDELLI PIERLUIGI',
      'Indirizzo': 'Via Nazionale, 42',
      'Cap': '64100',
      'Città': 'Teramo',
      'Prov.': 'TE',
      'Codice fiscale': 'CRDPLG59R07L103P',
      'Partita Iva': '00780240677',
      'Pagamento': 'Primo incasso',
    }
    expect(mapClienteRow(row)).toEqual({
      cod: '0004',
      denominazione: 'Dott. CIARDELLI PIERLUIGI',
      indirizzo: 'Via Nazionale, 42',
      cap: '64100',
      citta: 'Teramo',
      prov: 'TE',
      cf: 'CRDPLG59R07L103P',
      piva: '00780240677',
      pagamento: 'Primo incasso',
    })
  })

  it('matches the Città header even when mojibaked, and blanks missing fields', () => {
    const row = { 'Cod.': '0005', 'Denominazione': 'X', 'Citt�': 'Teramo' }
    const out = mapClienteRow(row)
    expect(out.citta).toBe('Teramo')
    expect(out.indirizzo).toBe('')
    expect(out.piva).toBe('')
  })
})

describe('mapProdottoRow', () => {
  it('maps Danea prodotto columns and parses listino1 number', () => {
    const row = {
      'Cod.': '0045',
      'Descrizione': 'Filo tondo 0,9',
      'Tipologia': 'Art. con magazzino (lotti)',
      'Cod. Udm': 'mt',
      'Cod. Iva': 'FC',
      'Listino 1': 12.5,
    }
    expect(mapProdottoRow(row)).toEqual({
      cod: '0045',
      descrizione: 'Filo tondo 0,9',
      tipologia: 'Art. con magazzino (lotti)',
      um: 'mt',
      codIva: 'FC',
      listino1: 12.5,
    })
  })

  it('sets listino1 to null when absent', () => {
    const row = { 'Cod.': '1', 'Descrizione': 'Y' }
    expect(mapProdottoRow(row).listino1).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- excel`
Expected: FAIL (cannot resolve `../excel.js`).

- [ ] **Step 4: Implement `src/services/excel.js`**

```js
import * as XLSX from 'xlsx'

// Tolerant header lookup: exact match first, then a normalized fallback
// that ignores any non-ASCII byte (handles mojibaked headers like "Citt�").
function pick(row, header) {
  if (header in row) return row[header]
  const wanted = header.replace(/[^\x20-\x7E]/g, '')
  for (const key of Object.keys(row)) {
    if (key.replace(/[^\x20-\x7E]/g, '') === wanted) return row[key]
  }
  return undefined
}

const text = (v) => (v == null ? '' : String(v).trim())
const numOrNull = (v) => {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function mapClienteRow(row) {
  return {
    cod: text(pick(row, 'Cod.')),
    denominazione: text(pick(row, 'Denominazione')),
    indirizzo: text(pick(row, 'Indirizzo')),
    cap: text(pick(row, 'Cap')),
    citta: text(pick(row, 'Città')),
    prov: text(pick(row, 'Prov.')),
    cf: text(pick(row, 'Codice fiscale')),
    piva: text(pick(row, 'Partita Iva')),
    pagamento: text(pick(row, 'Pagamento')),
  }
}

// Fornitori share the cliente shape.
export const mapFornitoreRow = mapClienteRow

export function mapProdottoRow(row) {
  return {
    cod: text(pick(row, 'Cod.')),
    descrizione: text(pick(row, 'Descrizione')),
    tipologia: text(pick(row, 'Tipologia')),
    um: text(pick(row, 'Cod. Udm')),
    codIva: text(pick(row, 'Cod. Iva')),
    listino1: numOrNull(pick(row, 'Listino 1')),
  }
}

const MAPPERS = {
  clienti: mapClienteRow,
  fornitori: mapFornitoreRow,
  prodotti: mapProdottoRow,
}

// Parse an ArrayBuffer (uploaded .xlsx) into mapped rows for the given kind.
export function parseAnagrafica(arrayBuffer, kind) {
  const mapper = MAPPERS[kind]
  if (!mapper) throw new Error(`Tipo anagrafica sconosciuto: ${kind}`)
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
  return rows.map(mapper).filter((r) => r.cod !== '')
}

// Deduplicate by `cod`, keeping the last occurrence.
export function dedupByCod(rows) {
  const byCod = new Map()
  for (const r of rows) byCod.set(r.cod, r)
  return [...byCod.values()]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- excel`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/excel.js src/services/__tests__/excel.test.js package.json package-lock.json
git commit -m "feat: Excel parsing and Danea column mapping for anagrafiche"
```

---

## Task 2: Dedup test coverage

**Files:**
- Modify: `src/services/__tests__/excel.test.js`

- [ ] **Step 1: Add the failing test**

Append to `src/services/__tests__/excel.test.js`:
```js
import { dedupByCod } from '../excel.js'

describe('dedupByCod', () => {
  it('keeps one row per cod, last wins', () => {
    const rows = [
      { cod: '1', denominazione: 'A' },
      { cod: '2', denominazione: 'B' },
      { cod: '1', denominazione: 'A2' },
    ]
    const out = dedupByCod(rows)
    expect(out).toHaveLength(2)
    expect(out.find((r) => r.cod === '1').denominazione).toBe('A2')
  })
})
```

- [ ] **Step 2: Run test**

Run: `npm test -- excel`
Expected: PASS (5 tests) — `dedupByCod` already implemented in Task 1, so this is a coverage lock.

- [ ] **Step 3: Commit**

```bash
git add src/services/__tests__/excel.test.js
git commit -m "test: lock dedupByCod behavior"
```

---

## Task 3: Firestore data-access layer for anagrafiche

**Files:**
- Create: `src/lib/db/anagrafiche.js`, `src/lib/db/__tests__/anagrafiche.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/db/__tests__/anagrafiche.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const calls = { writes: [], collections: [] }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => { calls.collections.push(name); return { name } },
  doc: (col, id) => ({ col, id }),
  setDoc: vi.fn((ref, data) => { calls.writes.push({ ref, data }); return Promise.resolve() }),
  writeBatch: () => {
    const ops = []
    return {
      set: (ref, data) => ops.push({ ref, data }),
      commit: () => { calls.writes.push(...ops); return Promise.resolve() },
    }
  },
  getDocs: vi.fn(() => Promise.resolve({
    docs: [{ id: 'a', data: () => ({ cod: '1', denominazione: 'A' }) }],
  })),
  query: (col) => col,
  orderBy: () => ({}),
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

describe('anagrafiche db', () => {
  beforeEach(() => { calls.writes = []; calls.collections = [] })

  it('importRows writes one doc per row keyed by cod', async () => {
    const { importRows } = await import('../anagrafiche.js')
    await importRows('clienti', [
      { cod: '0004', denominazione: 'A' },
      { cod: '0005', denominazione: 'B' },
    ])
    expect(calls.writes).toHaveLength(2)
    expect(calls.writes[0].ref.id).toBe('0004')
    expect(calls.writes[0].data.denominazione).toBe('A')
  })

  it('listAll returns docs with their id', async () => {
    const { listAll } = await import('../anagrafiche.js')
    const out = await listAll('clienti')
    expect(out).toEqual([{ id: 'a', cod: '1', denominazione: 'A' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- anagrafiche`
Expected: FAIL (cannot resolve `../anagrafiche.js`).

- [ ] **Step 3: Implement `src/lib/db/anagrafiche.js`**

```js
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const KINDS = ['clienti', 'fornitori', 'prodotti']

function assertKind(kind) {
  if (!KINDS.includes(kind)) throw new Error(`Tipo anagrafica sconosciuto: ${kind}`)
}

// Write rows keyed by their `cod` (idempotent re-import: same cod overwrites).
export async function importRows(kind, rows) {
  assertKind(kind)
  const col = collection(db, kind)
  const batch = writeBatch(db)
  for (const row of rows) {
    batch.set(doc(col, row.cod), row)
  }
  await batch.commit()
  return rows.length
}

export async function listAll(kind) {
  assertKind(kind)
  const col = collection(db, kind)
  const snap = await getDocs(query(col, orderBy('cod')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- anagrafiche`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/anagrafiche.js src/lib/db/__tests__/anagrafiche.test.js
git commit -m "feat: Firestore data layer for anagrafiche (importRows, listAll)"
```

---

## Task 4: Import page (upload → preview → confirm)

**Files:**
- Create: `src/pages/Anagrafiche/ImportPage.jsx`, `src/pages/Anagrafiche/__tests__/ImportPage.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/pages/Anagrafiche/__tests__/ImportPage.test.jsx`:
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../services/excel.js', () => ({
  parseAnagrafica: vi.fn(() => [
    { cod: '0004', denominazione: 'Dott. CIARDELLI' },
    { cod: '0005', denominazione: 'Dott. MARINI' },
  ]),
  dedupByCod: (rows) => rows,
}))
const importRows = vi.fn(() => Promise.resolve(2))
vi.mock('../../../lib/db/anagrafiche.js', () => ({ importRows: (...a) => importRows(...a) }))

import ImportPage from '../ImportPage.jsx'

function uploadFile() {
  const input = screen.getByLabelText(/file excel/i)
  const file = new File([new ArrayBuffer(8)], 'clienti.xlsx')
  // jsdom File lacks arrayBuffer in some envs; polyfill:
  file.arrayBuffer = () => Promise.resolve(new ArrayBuffer(8))
  fireEvent.change(input, { target: { files: [file] } })
}

describe('ImportPage', () => {
  it('previews parsed rows after file upload', async () => {
    render(<ImportPage />)
    uploadFile()
    await waitFor(() => expect(screen.getByText(/2 righe/i)).toBeInTheDocument())
    expect(screen.getByText(/Dott. CIARDELLI/)).toBeInTheDocument()
  })

  it('writes rows to Firestore on confirm', async () => {
    render(<ImportPage />)
    uploadFile()
    await waitFor(() => screen.getByText(/2 righe/i))
    fireEvent.click(screen.getByRole('button', { name: /conferma import/i }))
    await waitFor(() => expect(importRows).toHaveBeenCalledWith('clienti', expect.any(Array)))
    expect(await screen.findByText(/import completato/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ImportPage`
Expected: FAIL (cannot resolve `../ImportPage.jsx`).

- [ ] **Step 3: Implement `src/pages/Anagrafiche/ImportPage.jsx`**

```jsx
import { useState } from 'react'
import { parseAnagrafica, dedupByCod } from '../../services/excel.js'
import { importRows } from '../../lib/db/anagrafiche.js'

const KINDS = [
  { value: 'clienti', label: 'Clienti' },
  { value: 'fornitori', label: 'Fornitori' },
  { value: 'prodotti', label: 'Prodotti' },
]

export default function ImportPage() {
  const [kind, setKind] = useState('clienti')
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('') // '', 'importing', 'done', 'error'
  const [error, setError] = useState('')

  async function onFile(e) {
    setError('')
    setStatus('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const parsed = dedupByCod(parseAnagrafica(buf, kind))
      setRows(parsed)
    } catch (err) {
      setError(`Errore lettura file: ${err.message}`)
      setRows(null)
    }
  }

  async function onConfirm() {
    if (!rows) return
    setStatus('importing')
    try {
      await importRows(kind, rows)
      setStatus('done')
    } catch (err) {
      setError(`Errore import: ${err.message}`)
      setStatus('error')
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Import anagrafiche</h1>

      <label className="block mb-2 text-sm font-medium">Tipo</label>
      <select className="border rounded p-2 mb-4" value={kind}
        onChange={(e) => { setKind(e.target.value); setRows(null); setStatus('') }}>
        {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>

      <label className="block mb-2 text-sm font-medium" htmlFor="file">File Excel (.xlsx)</label>
      <input id="file" type="file" accept=".xlsx" onChange={onFile} className="mb-4 block" />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {rows && (
        <div>
          <p className="mb-2 text-sm text-gray-700">{rows.length} righe pronte all'import</p>
          <div className="border rounded max-h-80 overflow-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{Object.keys(rows[0]).map((c) => <th key={c} className="text-left p-2">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    {Object.keys(rows[0]).map((c) => <td key={c} className="p-2">{String(r[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
            onClick={onConfirm} disabled={status === 'importing'}>
            {status === 'importing' ? 'Import in corso…' : 'Conferma import'}
          </button>
          {status === 'done' && <p className="text-green-700 mt-3">Import completato ✓</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ImportPage`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Anagrafiche/ImportPage.jsx src/pages/Anagrafiche/__tests__/ImportPage.test.jsx
git commit -m "feat: anagrafiche import page (upload, preview, confirm)"
```

---

## Task 5: List view for an anagrafica

**Files:**
- Create: `src/pages/Anagrafiche/ListaAnagrafica.jsx`, `src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx`:
```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const listAll = vi.fn(() => Promise.resolve([
  { id: '0004', cod: '0004', denominazione: 'Dott. CIARDELLI', citta: 'Teramo' },
  { id: '0005', cod: '0005', denominazione: 'Dott. MARINI', citta: 'Teramo' },
]))
vi.mock('../../../lib/db/anagrafiche.js', () => ({ listAll: (...a) => listAll(...a) }))

import ListaAnagrafica from '../ListaAnagrafica.jsx'

describe('ListaAnagrafica', () => {
  it('loads and renders rows for the given kind', async () => {
    render(<ListaAnagrafica kind="clienti" columns={['cod', 'denominazione', 'citta']} />)
    await waitFor(() => expect(screen.getByText('Dott. CIARDELLI')).toBeInTheDocument())
    expect(listAll).toHaveBeenCalledWith('clienti')
    expect(screen.getByText('Dott. MARINI')).toBeInTheDocument()
  })

  it('filters rows by the search box', async () => {
    const { getByPlaceholderText, queryByText, getByText } = render(
      <ListaAnagrafica kind="clienti" columns={['cod', 'denominazione', 'citta']} />
    )
    await waitFor(() => getByText('Dott. CIARDELLI'))
    const search = getByPlaceholderText(/cerca/i)
    search.value = 'MARINI'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await waitFor(() => expect(queryByText('Dott. CIARDELLI')).not.toBeInTheDocument())
    expect(getByText('Dott. MARINI')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ListaAnagrafica`
Expected: FAIL (cannot resolve `../ListaAnagrafica.jsx`).

- [ ] **Step 3: Implement `src/pages/Anagrafiche/ListaAnagrafica.jsx`**

```jsx
import { useEffect, useMemo, useState } from 'react'
import { listAll } from '../../lib/db/anagrafiche.js'

export default function ListaAnagrafica({ kind, columns }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    listAll(kind).then((data) => {
      if (active) { setRows(data); setLoading(false) }
    })
    return () => { active = false }
  }, [kind])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      columns.some((c) => String(r[c] ?? '').toLowerCase().includes(needle)))
  }, [rows, q, columns])

  if (loading) return <p className="p-6">Caricamento…</p>

  return (
    <div className="p-6">
      <input
        type="text"
        placeholder="Cerca…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded p-2 mb-4 w-full max-w-sm"
      />
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{columns.map((c) => <th key={c} className="text-left p-2">{c}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              {columns.map((c) => <td key={c} className="p-2">{String(r[c] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun risultato.</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ListaAnagrafica`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Anagrafiche/ListaAnagrafica.jsx src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx
git commit -m "feat: generic anagrafica list view with search"
```

---

## Task 6: Wire routing in the app shell

**Files:**
- Modify: `src/App.jsx`, `src/pages/Home.jsx`
- Create: `src/pages/Anagrafiche/AnagraficheHome.jsx`

> Foundation left `nav` items as plain `<span>`s. Introduce `react-router-dom` (already installed) so Home, Import, and each list are reachable. Keep the auth gate behavior.

- [ ] **Step 1: Create `src/pages/Anagrafiche/AnagraficheHome.jsx`**

```jsx
import { Link } from 'react-router-dom'
import ListaAnagrafica from './ListaAnagrafica.jsx'
import { useState } from 'react'

const TABS = [
  { kind: 'clienti', label: 'Clienti', columns: ['cod', 'denominazione', 'citta', 'piva'] },
  { kind: 'fornitori', label: 'Fornitori', columns: ['cod', 'denominazione', 'citta', 'piva'] },
  { kind: 'prodotti', label: 'Prodotti', columns: ['cod', 'descrizione', 'um', 'listino1'] },
]

export default function AnagraficheHome() {
  const [active, setActive] = useState(TABS[0])
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Anagrafiche</h1>
        <Link to="/anagrafiche/import" className="text-sm text-blue-600">Importa da Excel</Link>
      </div>
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.kind} onClick={() => setActive(t)}
            className={`px-3 py-1 rounded text-sm ${active.kind === t.kind ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <ListaAnagrafica key={active.kind} kind={active.kind} columns={active.columns} />
    </div>
  )
}
```

- [ ] **Step 2: Update `src/pages/Home.jsx` nav to use router Links**

Replace the `<nav>` block's `<span>` items with `Link`s:
```jsx
import { Link } from 'react-router-dom'
import SyncStatusBadge from '../components/SyncStatusBadge.jsx'
import { logout } from '../lib/auth.js'

export default function Home() {
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">OdontoApp</h1>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <button className="text-sm text-blue-600" onClick={() => logout()}>Esci</button>
        </div>
      </header>
      <nav className="flex gap-4">
        <span className="text-gray-400">Fatture</span>
        <span className="text-gray-400">Conformità</span>
        <Link to="/anagrafiche" className="text-blue-600">Anagrafiche</Link>
      </nav>
    </div>
  )
}
```

- [ ] **Step 3: Update `src/App.jsx` to add the router (keep auth gate)**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/auth.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import AnagraficheHome from './pages/Anagrafiche/AnagraficheHome.jsx'
import ImportPage from './pages/Anagrafiche/ImportPage.jsx'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Caricamento…</p>
  if (!user) return <Login />
  return (
    <BrowserRouter basename="/odontoapp">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anagrafiche" element={<AnagraficheHome />} />
        <Route path="/anagrafiche/import" element={<ImportPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Update `src/App.test.jsx`** (still valid — logged-out path renders Login without router; assertion unchanged). Run it.

Run: `npm test -- App`
Expected: PASS (the auth-gate test mocks `useAuth` to return no user, so `<Login />` renders before the router — no change needed). If the existing assertion uses `getByText(/Accedi/i)` and fails on multiple matches, it should already be `getAllByText` from Foundation Task 6; leave as-is.

- [ ] **Step 5: Run full suite + build**

Run: `npm test`
Expected: all PASS.
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/pages/Home.jsx src/pages/Anagrafiche/AnagraficheHome.jsx
git commit -m "feat: routing to anagrafiche home, list, and import"
```

---

## Task 7: Manual end-to-end import (guided, with real data)

> Code complete. This task verifies against the real Danea files using the dev server. No automated test — it touches live Firestore.

- [ ] **Step 1: Start dev server**

Run: `npm run dev` and open `http://localhost:5173/odontoapp/`, log in.

- [ ] **Step 2: Import each file**

Navigate Anagrafiche → Importa da Excel. For each kind (clienti, fornitori, prodotti): select the kind, choose the matching file from the project root (`clienti.xlsx`, `fornitori.xlsx`, `prodotti.xlsx`), verify the preview row count and that `città`/accented values render correctly, then Conferma import.

- [ ] **Step 3: Verify**

Go to Anagrafiche, switch tabs, confirm rows appear and search works. Cross-check counts against the source files (clienti ~7 rows, fornitori ~4, prodotti ~69 after header). Report any mojibaked values; if found, note them for a follow-up encoding-fix task (the `pick` fallback handles headers, not values — values looked clean in inspection but confirm on the full set).

---

## Self-review notes

- Covers spec §"Anagrafiche e dati" (import una-tantum + re-import) and §6 files `services/excel.js`, `lib/db/anagrafiche.js`, `pages/Anagrafiche/*`.
- Export Excel (on-demand) is in scope per spec but deferred to a later plan (belongs with fatture data); not part of this plan. NOTE this so it isn't forgotten.
- `.bef` migration explicitly out of scope (decision #6).
- No placeholders; every code step has full code.
- Name consistency: `parseAnagrafica`, `dedupByCod`, `mapClienteRow`, `mapProdottoRow`, `importRows`, `listAll` used consistently across tasks.
- Routing introduced here (not in Foundation) because this is the first plan with multiple destinations; `basename="/odontoapp"` matches the Vite `base`.
```
