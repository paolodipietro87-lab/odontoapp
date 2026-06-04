# Anagrafiche CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add record-level create / edit / delete to the anagrafiche (clienti, fornitori, prodotti), on top of the existing import + list.

**Architecture:** A shared field-schema module describes each kind's editable fields (fixed columns — no custom fields). The Firestore data layer gains `getOne`, `upsertOne`, `deleteOne`. A reusable record-editor form handles create and edit; the list gains "Nuovo", row-edit, and delete-with-confirm. Builds on `src/lib/db/anagrafiche.js`, `ListaAnagrafica.jsx`, `AnagraficheHome.jsx`, and the existing router.

**Tech Stack:** React, react-router-dom, Tailwind, Firebase Firestore, Vitest.

**Decisions:** record-level CRUD only (fields fixed); delete shows a confirm dialog.

---

## Context for implementers

- Repo `c:/Users/Luca/Desktop/Paolo - LAVORO/Claude/Obsidian Brain/Brain/Peter`, branch `anagrafiche`. Bash, Windows, quote paths.
- Existing data layer `src/lib/db/anagrafiche.js` exports `importRows(kind, rows)`, `listAll(kind)`. Docs are keyed by `cod` (the document id IS the cod). KINDS = `['clienti','fornitori','prodotti']`.
- Record shapes: clienti/fornitori `{ cod, denominazione, indirizzo, cap, citta, prov, cf, piva, pagamento }`; prodotti `{ cod, descrizione, tipologia, um, codIva, listino1 }`.
- Because the doc id is `cod`, editing `cod` means delete-old + create-new. To keep it simple: `cod` is the immutable key — in the editor, `cod` is editable only when creating a new record, read-only when editing an existing one.
- Vitest with globals + jsdom; @testing-library/react; mock `firebase/firestore` and `../firebase.js` as in existing tests.

---

## File structure

```
src/pages/Anagrafiche/schema.js                     # field defs per kind (shared)
src/pages/Anagrafiche/__tests__/schema.test.js
src/lib/db/anagrafiche.js                            # add getOne, upsertOne, deleteOne
src/lib/db/__tests__/anagrafiche.test.js             # extend
src/pages/Anagrafiche/RecordEditor.jsx               # create/edit form
src/pages/Anagrafiche/__tests__/RecordEditor.test.jsx
src/components/ConfirmDialog.jsx                      # reusable confirm
src/components/__tests__/ConfirmDialog.test.jsx
src/pages/Anagrafiche/ListaAnagrafica.jsx            # add edit/delete actions
src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx  # extend
src/pages/Anagrafiche/AnagraficheHome.jsx            # wire Nuovo + editor routing
```

---

## Task 1: Field schema module

**Files:** Create `src/pages/Anagrafiche/schema.js`, `src/pages/Anagrafiche/__tests__/schema.test.js`

- [ ] **Step 1: Failing test** — `src/pages/Anagrafiche/__tests__/schema.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { FIELDS, emptyRecord, listColumns } from '../schema.js'

describe('schema', () => {
  it('defines fields for each kind', () => {
    expect(FIELDS.clienti.map((f) => f.name)).toContain('denominazione')
    expect(FIELDS.prodotti.map((f) => f.name)).toContain('listino1')
  })

  it('emptyRecord returns blank values per field, listino1 null', () => {
    const r = emptyRecord('prodotti')
    expect(r.cod).toBe('')
    expect(r.descrizione).toBe('')
    expect(r.listino1).toBeNull()
  })

  it('listColumns returns a subset of field names for the table', () => {
    expect(listColumns('clienti')).toEqual(['cod', 'denominazione', 'citta', 'piva'])
    expect(listColumns('prodotti')).toEqual(['cod', 'descrizione', 'um', 'listino1'])
  })
})
```

- [ ] **Step 2: Run** `npm test -- schema` → FAIL (cannot resolve).

- [ ] **Step 3: Implement** `src/pages/Anagrafiche/schema.js`:
```js
// Field definitions per anagrafica kind. type: 'text' | 'number'.
const ANAGRAFICA_FIELDS = [
  { name: 'cod', label: 'Codice', type: 'text' },
  { name: 'denominazione', label: 'Denominazione', type: 'text' },
  { name: 'indirizzo', label: 'Indirizzo', type: 'text' },
  { name: 'cap', label: 'CAP', type: 'text' },
  { name: 'citta', label: 'Città', type: 'text' },
  { name: 'prov', label: 'Provincia', type: 'text' },
  { name: 'cf', label: 'Codice fiscale', type: 'text' },
  { name: 'piva', label: 'Partita IVA', type: 'text' },
  { name: 'pagamento', label: 'Pagamento', type: 'text' },
]

export const FIELDS = {
  clienti: ANAGRAFICA_FIELDS,
  fornitori: ANAGRAFICA_FIELDS,
  prodotti: [
    { name: 'cod', label: 'Codice', type: 'text' },
    { name: 'descrizione', label: 'Descrizione', type: 'text' },
    { name: 'tipologia', label: 'Tipologia', type: 'text' },
    { name: 'um', label: 'Unità di misura', type: 'text' },
    { name: 'codIva', label: 'Codice IVA', type: 'text' },
    { name: 'listino1', label: 'Listino 1', type: 'number' },
  ],
}

const LIST_COLUMNS = {
  clienti: ['cod', 'denominazione', 'citta', 'piva'],
  fornitori: ['cod', 'denominazione', 'citta', 'piva'],
  prodotti: ['cod', 'descrizione', 'um', 'listino1'],
}

export function listColumns(kind) {
  return LIST_COLUMNS[kind]
}

export function emptyRecord(kind) {
  const out = {}
  for (const f of FIELDS[kind]) out[f.name] = f.type === 'number' ? null : ''
  return out
}
```

- [ ] **Step 4: Run** `npm test -- schema` → PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/pages/Anagrafiche/schema.js src/pages/Anagrafiche/__tests__/schema.test.js
git commit -m "feat: anagrafiche field schema module"
```

---

## Task 2: Data layer — getOne, upsertOne, deleteOne

**Files:** Modify `src/lib/db/anagrafiche.js`, `src/lib/db/__tests__/anagrafiche.test.js`

- [ ] **Step 1: Add failing tests.** Append to `src/lib/db/__tests__/anagrafiche.test.js` a new describe block. First, extend the existing `firebase/firestore` mock so it also supports single-doc ops. Replace the existing mock object in that test file with this superset (keep all existing keys, add `getDoc`, `setDoc` capture, `deleteDoc`):
```js
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => { calls.collections.push(name); return { name } },
  doc: (col, id) => ({ col, id }),
  setDoc: vi.fn((ref, data) => { calls.writes.push({ ref, data }); return Promise.resolve() }),
  deleteDoc: vi.fn((ref) => { calls.deletes.push(ref); return Promise.resolve() }),
  getDoc: vi.fn((ref) => Promise.resolve({
    exists: () => ref.id === '0004',
    id: ref.id,
    data: () => ({ cod: '0004', denominazione: 'A' }),
  })),
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
```
Also update the `calls` object initializer at the top to include `deletes: []` and reset it in `beforeEach` (`calls.deletes = []`). Then append:
```js
describe('anagrafiche single-record ops', () => {
  it('getOne returns the record with id when it exists', async () => {
    const { getOne } = await import('../anagrafiche.js')
    const rec = await getOne('clienti', '0004')
    expect(rec).toEqual({ id: '0004', cod: '0004', denominazione: 'A' })
  })

  it('getOne returns null when missing', async () => {
    const { getOne } = await import('../anagrafiche.js')
    const rec = await getOne('clienti', '9999')
    expect(rec).toBeNull()
  })

  it('upsertOne writes the record keyed by cod', async () => {
    const { upsertOne } = await import('../anagrafiche.js')
    await upsertOne('clienti', { cod: '0007', denominazione: 'Z' })
    expect(calls.writes).toHaveLength(1)
    expect(calls.writes[0].ref.id).toBe('0007')
    expect(calls.writes[0].data.denominazione).toBe('Z')
  })

  it('upsertOne rejects an empty cod', async () => {
    const { upsertOne } = await import('../anagrafiche.js')
    await expect(upsertOne('clienti', { cod: '', denominazione: 'Z' }))
      .rejects.toThrow(/codice/i)
  })

  it('deleteOne deletes by id', async () => {
    const { deleteOne } = await import('../anagrafiche.js')
    await deleteOne('clienti', '0004')
    expect(calls.deletes).toHaveLength(1)
    expect(calls.deletes[0].id).toBe('0004')
  })
})
```

- [ ] **Step 2: Run** `npm test -- anagrafiche` → FAIL (functions undefined).

- [ ] **Step 3: Implement.** In `src/lib/db/anagrafiche.js` update imports and add functions:
```js
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase.js'
```
Add after `listAll`:
```js
export async function getOne(kind, id) {
  assertKind(kind)
  const snap = await getDoc(doc(collection(db, kind), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function upsertOne(kind, record) {
  assertKind(kind)
  const cod = String(record.cod ?? '').trim()
  if (!cod) throw new Error('Codice obbligatorio')
  await setDoc(doc(collection(db, kind), cod), { ...record, cod })
  return cod
}

export async function deleteOne(kind, id) {
  assertKind(kind)
  await deleteDoc(doc(collection(db, kind), id))
}
```

- [ ] **Step 4: Run** `npm test -- anagrafiche` → PASS (existing 2 + new 5 = 7).

- [ ] **Step 5: Run full** `npm test` → all pass. Commit:
```bash
git add src/lib/db/anagrafiche.js src/lib/db/__tests__/anagrafiche.test.js
git commit -m "feat: anagrafiche getOne, upsertOne, deleteOne"
```

---

## Task 3: ConfirmDialog component

**Files:** Create `src/components/ConfirmDialog.jsx`, `src/components/__tests__/ConfirmDialog.test.jsx`

- [ ] **Step 1: Failing test** — `src/components/__tests__/ConfirmDialog.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ConfirmDialog from '../ConfirmDialog.jsx'

describe('ConfirmDialog', () => {
  it('renders message and calls onConfirm', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog message="Eliminare?" onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByText('Eliminare?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /elimina/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when annulla clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog message="X" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /annulla/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run** `npm test -- ConfirmDialog` → FAIL.

- [ ] **Step 3: Implement** `src/components/ConfirmDialog.jsx`:
```jsx
export default function ConfirmDialog({ message, confirmLabel = 'Elimina', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded bg-gray-100" onClick={onCancel}>Annulla</button>
          <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run** `npm test -- ConfirmDialog` → PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add src/components/ConfirmDialog.jsx src/components/__tests__/ConfirmDialog.test.jsx
git commit -m "feat: reusable ConfirmDialog component"
```

---

## Task 4: RecordEditor form (create/edit)

**Files:** Create `src/pages/Anagrafiche/RecordEditor.jsx`, `src/pages/Anagrafiche/__tests__/RecordEditor.test.jsx`

- [ ] **Step 1: Failing test** — `src/pages/Anagrafiche/__tests__/RecordEditor.test.jsx`:
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecordEditor from '../RecordEditor.jsx'

describe('RecordEditor', () => {
  it('creates a new record: cod editable, calls onSave with values', async () => {
    const onSave = vi.fn(() => Promise.resolve())
    render(<RecordEditor kind="clienti" record={null} onSave={onSave} onCancel={() => {}} />)
    const cod = screen.getByLabelText('Codice')
    expect(cod).not.toBeDisabled()
    fireEvent.change(cod, { target: { value: '0099' } })
    fireEvent.change(screen.getByLabelText('Denominazione'), { target: { value: 'Nuovo Cliente' } })
    fireEvent.click(screen.getByRole('button', { name: /salva/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    const saved = onSave.mock.calls[0][0]
    expect(saved.cod).toBe('0099')
    expect(saved.denominazione).toBe('Nuovo Cliente')
  })

  it('editing existing record: cod is read-only', () => {
    render(<RecordEditor kind="clienti" record={{ cod: '0004', denominazione: 'A' }} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText('Codice')).toBeDisabled()
    expect(screen.getByLabelText('Denominazione')).toHaveValue('A')
  })

  it('blocks save when cod empty on new record', async () => {
    const onSave = vi.fn()
    render(<RecordEditor kind="clienti" record={null} onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /salva/i }))
    expect(await screen.findByText(/codice obbligatorio/i)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run** `npm test -- RecordEditor` → FAIL.

- [ ] **Step 3: Implement** `src/pages/Anagrafiche/RecordEditor.jsx`:
```jsx
import { useState } from 'react'
import { FIELDS, emptyRecord } from './schema.js'

export default function RecordEditor({ kind, record, onSave, onCancel }) {
  const isEdit = record != null
  const [values, setValues] = useState(() => ({ ...emptyRecord(kind), ...(record ?? {}) }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function setField(name, raw, type) {
    const value = type === 'number' ? (raw === '' ? null : Number(raw)) : raw
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!String(values.cod ?? '').trim()) {
      setError('Codice obbligatorio')
      return
    }
    setSaving(true)
    try {
      await onSave(values)
    } catch (err) {
      setError(err.message || 'Errore salvataggio')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-6 max-w-lg">
      <h2 className="text-lg font-bold mb-4">{isEdit ? 'Modifica' : 'Nuovo'} record</h2>
      {FIELDS[kind].map((f) => (
        <div key={f.name} className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            type={f.type === 'number' ? 'number' : 'text'}
            step={f.type === 'number' ? 'any' : undefined}
            className="border rounded p-2 w-full disabled:bg-gray-100"
            disabled={f.name === 'cod' && isEdit}
            value={values[f.name] ?? ''}
            onChange={(e) => setField(f.name, e.target.value, f.type)}
          />
        </div>
      ))}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 rounded px-4 py-2">Annulla</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run** `npm test -- RecordEditor` → PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/pages/Anagrafiche/RecordEditor.jsx src/pages/Anagrafiche/__tests__/RecordEditor.test.jsx
git commit -m "feat: RecordEditor form for anagrafiche create/edit"
```

---

## Task 5: List actions — edit + delete with confirm

**Files:** Modify `src/pages/Anagrafiche/ListaAnagrafica.jsx`, `src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx`

> Add an actions column with "Modifica" and "Elimina" buttons per row. Edit calls an `onEdit(record)` callback prop. Delete opens `ConfirmDialog`; confirming calls `deleteOne` then refreshes the list. Keep existing load + search behavior.

- [ ] **Step 1: Extend the test.** Append to `src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx`. First ensure the mock includes `deleteOne`; replace the mock line with:
```jsx
const listAll = vi.fn(() => Promise.resolve([
  { id: '0004', cod: '0004', denominazione: 'Dott. CIARDELLI', citta: 'Teramo' },
  { id: '0005', cod: '0005', denominazione: 'Dott. MARINI', citta: 'Teramo' },
]))
const deleteOne = vi.fn(() => Promise.resolve())
vi.mock('../../../lib/db/anagrafiche.js', () => ({
  listAll: (...a) => listAll(...a),
  deleteOne: (...a) => deleteOne(...a),
}))
```
Add tests:
```jsx
it('calls onEdit with the row record when Modifica clicked', async () => {
  const onEdit = vi.fn()
  render(<ListaAnagrafica kind="clienti" columns={['cod', 'denominazione', 'citta']} onEdit={onEdit} />)
  await waitFor(() => screen.getByText('Dott. CIARDELLI'))
  fireEvent.click(screen.getAllByRole('button', { name: /modifica/i })[0])
  expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ cod: '0004' }))
})

it('deletes a row after confirm', async () => {
  render(<ListaAnagrafica kind="clienti" columns={['cod', 'denominazione', 'citta']} onEdit={() => {}} />)
  await waitFor(() => screen.getByText('Dott. CIARDELLI'))
  fireEvent.click(screen.getAllByRole('button', { name: /elimina/i })[0])
  // confirm dialog appears
  fireEvent.click(screen.getByRole('button', { name: /^elimina$/i }))
  await waitFor(() => expect(deleteOne).toHaveBeenCalledWith('clienti', '0004'))
})
```
NOTE: there will be multiple "elimina" buttons (one per row + the dialog confirm). The dialog confirm button label is exactly "Elimina"; row buttons are "Elimina" too. To disambiguate the dialog button, the ConfirmDialog confirm button text is `Elimina` and row buttons are also `Elimina` — instead, make ROW buttons say "Elimina" and rely on the dialog being the LAST matching button. To avoid ambiguity, in the implementation give row delete buttons the accessible name "Elimina" and the dialog keeps "Elimina"; the test uses `getAllByRole(... name: /elimina/i)` then clicks the last one for the dialog. Update the second test's confirm click to:
```jsx
  const elims = screen.getAllByRole('button', { name: /elimina/i })
  fireEvent.click(elims[elims.length - 1])
```
Use that form in the test.

- [ ] **Step 2: Run** `npm test -- ListaAnagrafica` → FAIL (no action buttons yet).

- [ ] **Step 3: Implement.** Update `src/pages/Anagrafiche/ListaAnagrafica.jsx`:
```jsx
import { useEffect, useMemo, useState } from 'react'
import { listAll, deleteOne } from '../../lib/db/anagrafiche.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

export default function ListaAnagrafica({ kind, columns, onEdit }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [toDelete, setToDelete] = useState(null)

  async function load() {
    setLoading(true)
    const data = await listAll(kind)
    setRows(data)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    listAll(kind).then((data) => { if (active) { setRows(data); setLoading(false) } })
    return () => { active = false }
  }, [kind])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      columns.some((c) => String(r[c] ?? '').toLowerCase().includes(needle)))
  }, [rows, q, columns])

  async function confirmDelete() {
    const id = toDelete.id ?? toDelete.cod
    setToDelete(null)
    await deleteOne(kind, id)
    await load()
  }

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
          <tr>
            {columns.map((c) => <th key={c} className="text-left p-2">{c}</th>)}
            <th className="text-right p-2">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              {columns.map((c) => <td key={c} className="p-2">{String(r[c] ?? '')}</td>)}
              <td className="p-2 text-right whitespace-nowrap">
                <button className="text-blue-600 mr-3" onClick={() => onEdit(r)}>Modifica</button>
                <button className="text-red-600" onClick={() => setToDelete(r)}>Elimina</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun risultato.</p>}
      {toDelete && (
        <ConfirmDialog
          message={`Eliminare "${toDelete.denominazione || toDelete.descrizione || toDelete.cod}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run** `npm test -- ListaAnagrafica` → PASS (existing 2 + new 2 = 4).

- [ ] **Step 5: Commit**
```bash
git add src/pages/Anagrafiche/ListaAnagrafica.jsx src/pages/Anagrafiche/__tests__/ListaAnagrafica.test.jsx
git commit -m "feat: edit and delete-with-confirm actions in anagrafica list"
```

---

## Task 6: Wire create/edit into AnagraficheHome

**Files:** Modify `src/pages/Anagrafiche/AnagraficheHome.jsx`

> Add a "Nuovo" button and editor mode. AnagraficheHome holds local state: `editing` (null = list view; `{}`-ish record or `null`-for-new triggers editor). On save, call `upsertOne`, then return to list and force a refresh (remount list via a `refreshKey`).

- [ ] **Step 1: Implement** `src/pages/Anagrafiche/AnagraficheHome.jsx`:
```jsx
import { Link } from 'react-router-dom'
import { useState } from 'react'
import ListaAnagrafica from './ListaAnagrafica.jsx'
import RecordEditor from './RecordEditor.jsx'
import { listColumns } from './schema.js'
import { upsertOne } from '../../lib/db/anagrafiche.js'

const TABS = [
  { kind: 'clienti', label: 'Clienti' },
  { kind: 'fornitori', label: 'Fornitori' },
  { kind: 'prodotti', label: 'Prodotti' },
]

export default function AnagraficheHome() {
  const [kind, setKind] = useState('clienti')
  const [editing, setEditing] = useState(undefined) // undefined = list; null = new; object = edit
  const [refreshKey, setRefreshKey] = useState(0)

  function startNew() { setEditing(null) }
  function startEdit(record) { setEditing(record) }
  function cancel() { setEditing(undefined) }

  async function save(values) {
    await upsertOne(kind, values)
    setEditing(undefined)
    setRefreshKey((k) => k + 1)
  }

  const inEditor = editing !== undefined

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Anagrafiche</h1>
        <div className="flex items-center gap-4">
          {!inEditor && <button onClick={startNew} className="text-sm bg-blue-600 text-white rounded px-3 py-1">Nuovo</button>}
          <Link to="/anagrafiche/import" className="text-sm text-blue-600">Importa da Excel</Link>
        </div>
      </div>

      {!inEditor && (
        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button key={t.kind} onClick={() => setKind(t.kind)}
              className={`px-3 py-1 rounded text-sm ${kind === t.kind ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {inEditor ? (
        <RecordEditor kind={kind} record={editing} onSave={save} onCancel={cancel} />
      ) : (
        <ListaAnagrafica key={`${kind}-${refreshKey}`} kind={kind} columns={listColumns(kind)} onEdit={startEdit} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run full** `npm test` → all pass. Run `npm run build` → succeeds.

- [ ] **Step 3: Commit**
```bash
git add src/pages/Anagrafiche/AnagraficheHome.jsx
git commit -m "feat: create/edit records from AnagraficheHome"
```

---

## Task 7: Manual verification (guided)

- [ ] Start `npm run dev`, log in, go to Anagrafiche.
- [ ] **Nuovo**: create a test cliente (cod e.g. `TEST1`), save, confirm it appears in the list.
- [ ] **Modifica**: edit it (cod field read-only), change denominazione, save, confirm update.
- [ ] **Elimina**: delete it, confirm the dialog appears, confirm, row disappears.
- [ ] Repeat a quick check on prodotti (listino1 numeric field).
- [ ] Confirm changes persist after reload (Firestore).

---

## Self-review notes

- Decisions honored: record-level CRUD only (FIELDS fixed, no custom columns); delete via ConfirmDialog.
- `cod` immutability: read-only on edit, editable on create — avoids orphaned doc-id changes (doc id IS cod).
- Reuses existing list/search; adds actions column. `listColumns` centralizes column choice (was hard-coded in AnagraficheHome before — now sourced from schema, single source of truth).
- Name consistency: `getOne`, `upsertOne`, `deleteOne`, `FIELDS`, `emptyRecord`, `listColumns`, `RecordEditor`, `ConfirmDialog`, `onEdit` used consistently.
- No placeholders; every code step is complete.
```
