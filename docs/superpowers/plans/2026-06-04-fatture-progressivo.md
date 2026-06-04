# Fatture + Progressivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Fatture module with atomic, race-safe annual invoice numbering (`NNN/ANNO`).

**Architecture:** Pure calculation/format helpers tested in isolation; a single Firestore transaction (`runTransaction`) that reads `contatori/{anno}`, increments, and writes both the counter and the invoice atomically (zero gaps, online-only); a thin db layer for draft CRUD; React UI for list/editor/detail. Drafts hold no number — numbering happens only at "Emetti".

**Tech Stack:** React + Vite, react-router-dom, Firebase Firestore, Vitest + Testing Library. Tests mock `firebase/firestore` (the project does NOT use the emulator — follow the existing mock pattern in `src/lib/db/__tests__/anagrafiche.test.js`).

**Critical testing note (zero-tolerance numbering):** Firestore's `runTransaction` guarantees atomicity, optimistic-concurrency retry, and rollback. Unit tests cannot exercise the real Firestore engine. We therefore test `emettiFattura` against a **faithful in-memory fake** of `runTransaction` that (a) provides a `tx` backed by a shared store, and (b) can simulate a concurrent counter bump + retry. This verifies OUR callback logic (read → +1 → write both in same tx, re-read on retry). Real-world atomicity is confirmed by the manual end-to-end step against live Firestore (Task 7).

---

## File Structure

- Create: `src/utils/calcoli.js` — pure: `importoRiga`, `calcolaTotali` (FC totals + bollo).
- Create: `src/utils/__tests__/calcoli.test.js`
- Create: `src/services/progressivo.js` — pure `formattaNumero` + transaction `emettiFattura`.
- Create: `src/services/__tests__/progressivo.test.js`
- Create: `src/lib/db/fatture.js` — draft CRUD with state guards.
- Create: `src/lib/db/__tests__/fatture.test.js`
- Create: `src/components/ClienteSelect.jsx` — pick a cliente from anagrafica, freeze snapshot.
- Create: `src/components/RigaFattura.jsx` — one editable invoice line with product autocomplete.
- Create: `src/pages/Fatture/EditorFattura.jsx` — create/edit a draft, live totals, Emetti.
- Create: `src/pages/Fatture/ListaFatture.jsx` — list invoices, search, new/open.
- Create: `src/pages/Fatture/DettaglioFattura.jsx` — read-only emitted invoice + PDF placeholder.
- Create: `src/pages/Fatture/__tests__/EditorFattura.test.jsx`
- Modify: `src/App.jsx` — add `/fatture`, `/fatture/nuova`, `/fatture/:id` routes.
- Modify: `src/pages/Home.jsx` — add a link to Fatture.

---

## Task 1: `utils/calcoli.js` — pure totals & bollo

**Files:**
- Create: `src/utils/calcoli.js`
- Test: `src/utils/__tests__/calcoli.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/utils/__tests__/calcoli.test.js
import { describe, it, expect } from 'vitest'
import { importoRiga, calcolaTotali } from '../calcoli.js'

describe('importoRiga', () => {
  it('qta * prezzo without discount', () => {
    expect(importoRiga(2, 10, 0)).toBe(20)
  })
  it('applies percent discount', () => {
    expect(importoRiga(1, 100, 10)).toBe(90)
  })
  it('rounds to 2 decimals', () => {
    expect(importoRiga(3, 3.333, 0)).toBe(10)      // 9.999 -> 10.00
    expect(importoRiga(1, 1.005, 0)).toBe(1.01)
  })
  it('treats missing/empty values as 0', () => {
    expect(importoRiga(null, 10, undefined)).toBe(0)
  })
})

describe('calcolaTotali', () => {
  const righe = [
    { qta: 1, prezzo: 50, sconto: 0 },
    { qta: 1, prezzo: 40, sconto: 0 },
  ]
  it('imponibile and imposta are always 0 (Fuori Campo)', () => {
    const t = calcolaTotali(righe)
    expect(t.imponibile).toBe(0)
    expect(t.imposta).toBe(0)
  })
  it('totaleFuoriCampo is the sum of line importi', () => {
    expect(calcolaTotali(righe).totaleFuoriCampo).toBe(90)
  })
  it('bollo is 2.00 when totaleFuoriCampo > 77.47', () => {
    expect(calcolaTotali(righe).bollo).toBe(2)        // 90 > 77.47
  })
  it('no bollo at exactly 77.47 (strict >)', () => {
    const t = calcolaTotali([{ qta: 1, prezzo: 77.47, sconto: 0 }])
    expect(t.bollo).toBe(0)
    expect(t.totale).toBe(77.47)
  })
  it('bollo at 77.48', () => {
    const t = calcolaTotali([{ qta: 1, prezzo: 77.48, sconto: 0 }])
    expect(t.bollo).toBe(2)
    expect(t.totale).toBe(79.48)
  })
  it('no bollo below threshold', () => {
    expect(calcolaTotali([{ qta: 1, prezzo: 50, sconto: 0 }]).bollo).toBe(0)
  })
  it('totale = totaleFuoriCampo + bollo', () => {
    expect(calcolaTotali(righe).totale).toBe(92)      // 90 + 2
  })
  it('empty righe -> all zero', () => {
    expect(calcolaTotali([])).toEqual({
      imponibile: 0, imposta: 0, totaleFuoriCampo: 0, bollo: 0, totale: 0,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- calcoli`
Expected: FAIL — cannot import `importoRiga` / `calcolaTotali` (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
// src/utils/calcoli.js
const SOGLIA_BOLLO = 77.47
const IMPORTO_BOLLO = 2

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function importoRiga(qta, prezzo, sconto) {
  const q = Number(qta) || 0
  const p = Number(prezzo) || 0
  const s = Number(sconto) || 0
  return round2(q * p * (1 - s / 100))
}

export function calcolaTotali(righe) {
  const totaleFuoriCampo = round2(
    (righe ?? []).reduce(
      (sum, r) => sum + importoRiga(r.qta, r.prezzo, r.sconto),
      0,
    ),
  )
  const bollo = totaleFuoriCampo > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0
  return {
    imponibile: 0,
    imposta: 0,
    totaleFuoriCampo,
    bollo,
    totale: round2(totaleFuoriCampo + bollo),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- calcoli`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/utils/calcoli.js src/utils/__tests__/calcoli.test.js
git commit -m "feat: calcoli fattura (totali FC + bollo 2 euro)"
```

---

## Task 2: `progressivo.js` — pure `formattaNumero`

**Files:**
- Create: `src/services/progressivo.js`
- Test: `src/services/__tests__/progressivo.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/services/__tests__/progressivo.test.js
import { describe, it, expect } from 'vitest'
import { formattaNumero } from '../progressivo.js'

describe('formattaNumero', () => {
  it('zero-pads to 3 digits', () => {
    expect(formattaNumero(1, 2026)).toBe('001/2026')
    expect(formattaNumero(12, 2026)).toBe('012/2026')
    expect(formattaNumero(123, 2026)).toBe('123/2026')
  })
  it('keeps 4+ digit numbers as-is', () => {
    expect(formattaNumero(1234, 2026)).toBe('1234/2026')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- progressivo`
Expected: FAIL — cannot import `formattaNumero`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/progressivo.js
export function formattaNumero(numero, anno) {
  return `${String(numero).padStart(3, '0')}/${anno}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- progressivo`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/progressivo.js src/services/__tests__/progressivo.test.js
git commit -m "feat: formattaNumero progressivo (NNN/ANNO zero-pad)"
```

---

## Task 3: `lib/db/fatture.js` — draft CRUD with guards

**Files:**
- Create: `src/lib/db/fatture.js`
- Test: `src/lib/db/__tests__/fatture.test.js`

Follow the existing mock pattern from `src/lib/db/__tests__/anagrafiche.test.js`.

- [ ] **Step 1: Write the failing test**

```js
// src/lib/db/__tests__/fatture.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = { writes: [], deletes: [], doc: null }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => ({ name }),
  doc: (colOrDb, id) => ({ id: id ?? 'auto-id' }),
  addDoc: vi.fn((col, data) => { store.writes.push({ data }); return Promise.resolve({ id: 'new-id' }) }),
  setDoc: vi.fn((ref, data) => { store.writes.push({ ref, data }); return Promise.resolve() }),
  updateDoc: vi.fn((ref, data) => { store.writes.push({ ref, data }); return Promise.resolve() }),
  deleteDoc: vi.fn((ref) => { store.deletes.push(ref); return Promise.resolve() }),
  getDoc: vi.fn((ref) => Promise.resolve({
    exists: () => store.doc != null,
    id: ref.id,
    data: () => store.doc,
  })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [{ id: 'f1', data: () => ({ stato: 'emessa', numeroFormattato: '001/2026' }) }],
  })),
  query: (col) => col,
  orderBy: () => ({}),
  serverTimestamp: () => 'TS',
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

beforeEach(() => { store.writes = []; store.deletes = []; store.doc = null })

describe('fatture db', () => {
  it('creaBozza writes a draft with null numbering fields', async () => {
    const { creaBozza } = await import('../fatture.js')
    const id = await creaBozza({ data: '2026-06-04', righe: [] })
    expect(id).toBe('new-id')
    const written = store.writes[0].data
    expect(written.stato).toBe('bozza')
    expect(written.numero).toBeNull()
    expect(written.anno).toBeNull()
    expect(written.numeroFormattato).toBeNull()
  })

  it('aggiornaBozza updates when the invoice is a draft', async () => {
    store.doc = { stato: 'bozza', righe: [] }
    const { aggiornaBozza } = await import('../fatture.js')
    await aggiornaBozza('f1', { data: '2026-06-05' })
    expect(store.writes).toHaveLength(1)
    expect(store.writes[0].data.data).toBe('2026-06-05')
  })

  it('aggiornaBozza refuses to touch an emitted invoice', async () => {
    store.doc = { stato: 'emessa', numero: 1 }
    const { aggiornaBozza } = await import('../fatture.js')
    await expect(aggiornaBozza('f1', { data: 'x' })).rejects.toThrow(/emessa/i)
    expect(store.writes).toHaveLength(0)
  })

  it('deleteBozza refuses to delete an emitted invoice', async () => {
    store.doc = { stato: 'emessa', numero: 1 }
    const { deleteBozza } = await import('../fatture.js')
    await expect(deleteBozza('f1')).rejects.toThrow(/emessa/i)
    expect(store.deletes).toHaveLength(0)
  })

  it('deleteBozza deletes a draft', async () => {
    store.doc = { stato: 'bozza' }
    const { deleteBozza } = await import('../fatture.js')
    await deleteBozza('f1')
    expect(store.deletes).toHaveLength(1)
  })

  it('listAll returns docs with their id', async () => {
    const { listAll } = await import('../fatture.js')
    const out = await listAll()
    expect(out).toEqual([{ id: 'f1', stato: 'emessa', numeroFormattato: '001/2026' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- db/__tests__/fatture`
Expected: FAIL — `../fatture.js` not found.

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/db/fatture.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const col = () => collection(db, 'fatture')

export async function creaBozza(dati) {
  const ref = await addDoc(col(), {
    stato: 'bozza',
    numero: null,
    anno: null,
    numeroFormattato: null,
    data: dati.data ?? '',
    clienteId: dati.clienteId ?? null,
    clienteSnapshot: dati.clienteSnapshot ?? null,
    destinazione: dati.destinazione ?? null,
    righe: dati.righe ?? [],
    imponibile: 0,
    imposta: 0,
    totaleFuoriCampo: dati.totaleFuoriCampo ?? 0,
    bollo: dati.bollo ?? 0,
    totale: dati.totale ?? 0,
    pagamento: dati.pagamento ?? '',
    scadenze: dati.scadenze ?? null,
    creatoIl: serverTimestamp(),
    aggiornatoIl: serverTimestamp(),
    emessoIl: null,
  })
  return ref.id
}

export async function getOne(id) {
  const snap = await getDoc(doc(col(), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

async function assertBozza(id) {
  const snap = await getDoc(doc(col(), id))
  if (!snap.exists()) throw new Error('Fattura inesistente')
  if (snap.data().stato !== 'bozza') {
    throw new Error('Fattura già emessa: sola lettura')
  }
}

export async function aggiornaBozza(id, dati) {
  await assertBozza(id)
  await updateDoc(doc(col(), id), { ...dati, aggiornatoIl: serverTimestamp() })
}

export async function deleteBozza(id) {
  await assertBozza(id)
  await deleteDoc(doc(col(), id))
}

export async function listAll() {
  const snap = await getDocs(query(col(), orderBy('data', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- db/__tests__/fatture`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/fatture.js src/lib/db/__tests__/fatture.test.js
git commit -m "feat: db layer fatture (CRUD bozze con guard sola-lettura emesse)"
```

---

## Task 4: `emettiFattura` — atomic transaction (CRITICAL — review twice)

**Files:**
- Modify: `src/services/progressivo.js`
- Test: `src/services/__tests__/progressivo.test.js`

This is the zero-tolerance core. The transaction reads `contatori/{anno}`, computes `+1`,
and writes BOTH the counter and the invoice inside one `runTransaction` callback.

- [ ] **Step 1: Write the failing test (faithful runTransaction fake)**

Append to `src/services/__tests__/progressivo.test.js`:

```js
import { vi, beforeEach } from 'vitest'

// In-memory store shared by the fake transaction
const mem = { docs: {}, onBeforeRun: null }

vi.mock('firebase/firestore', () => ({
  doc: (db, coll, id) => ({ path: `${coll}/${id}` }),
  serverTimestamp: () => 'TS',
  runTransaction: async (db, updateFn) => {
    // Faithful-ish fake: optionally mutate store before running (simulate a
    // concurrent write), then run the callback against the current store.
    if (mem.onBeforeRun) { mem.onBeforeRun(); mem.onBeforeRun = null }
    const tx = {
      get: async (ref) => ({
        exists: () => mem.docs[ref.path] !== undefined,
        data: () => mem.docs[ref.path],
      }),
      set: (ref, data, opts) => {
        mem.docs[ref.path] = opts?.merge
          ? { ...(mem.docs[ref.path] ?? {}), ...data }
          : data
      },
      update: (ref, data) => {
        mem.docs[ref.path] = { ...(mem.docs[ref.path] ?? {}), ...data }
      },
    }
    return updateFn(tx)
  },
}))
vi.mock('../firebase.js', () => ({ db: {} }))

function seedFattura(id, data, stato = 'bozza') {
  mem.docs[`fatture/${id}`] = { stato, data, righe: [] }
}

describe('emettiFattura (transaction)', () => {
  beforeEach(() => { mem.docs = {}; mem.onBeforeRun = null })

  it('first invoice of 2026 -> 001/2026 and counter = 1', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f1', '2026-03-10')
    const res = await emettiFattura('f1')
    expect(res).toEqual({ numero: 1, anno: 2026, numeroFormattato: '001/2026' })
    expect(mem.docs['contatori/2026'].ultimoNumero).toBe(1)
    expect(mem.docs['fatture/f1'].stato).toBe('emessa')
    expect(mem.docs['fatture/f1'].numeroFormattato).toBe('001/2026')
  })

  it('sequential emissions have no gaps: 001,002,003', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('a', '2026-01-01'); seedFattura('b', '2026-01-02'); seedFattura('c', '2026-01-03')
    expect((await emettiFattura('a')).numeroFormattato).toBe('001/2026')
    expect((await emettiFattura('b')).numeroFormattato).toBe('002/2026')
    expect((await emettiFattura('c')).numeroFormattato).toBe('003/2026')
    expect(mem.docs['contatori/2026'].ultimoNumero).toBe(3)
  })

  it('year comes from the invoice DATE, not today', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f', '2026-12-31')   // emitted "in 2027" but dated 2026
    const res = await emettiFattura('f')
    expect(res.anno).toBe(2026)
    expect(res.numeroFormattato).toBe('001/2026')
  })

  it('new year restarts at 001', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    mem.docs['contatori/2026'] = { ultimoNumero: 9 }
    seedFattura('f', '2027-01-05')
    expect((await emettiFattura('f')).numeroFormattato).toBe('001/2027')
    expect(mem.docs['contatori/2026'].ultimoNumero).toBe(9)  // untouched
  })

  it('concurrent counter bump before run -> next number, never duplicate', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    mem.docs['contatori/2026'] = { ultimoNumero: 5 }
    seedFattura('f', '2026-06-01')
    // simulate another emission landing 5->6 right before our callback reads
    mem.onBeforeRun = () => { mem.docs['contatori/2026'] = { ultimoNumero: 6 } }
    const res = await emettiFattura('f')
    expect(res.numero).toBe(7)
    expect(res.numeroFormattato).toBe('007/2026')
  })

  it('refuses to emit an already-emitted invoice', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f', '2026-06-01', 'emessa')
    mem.docs['fatture/f'].numero = 3
    await expect(emettiFattura('f')).rejects.toThrow(/già emessa/i)
    expect(mem.docs['contatori/2026']).toBeUndefined()  // counter untouched
  })

  it('refuses to emit a non-existent invoice', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    await expect(emettiFattura('nope')).rejects.toThrow(/inesistente/i)
  })
})
```

> Note: the earlier `formattaNumero` test block stays. Because Task 2 had no `firebase/firestore`
> mock, add the `vi.mock` calls at the top of the file (mocks hoist). `formattaNumero` is pure and
> unaffected by the mock.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- progressivo`
Expected: FAIL — `emettiFattura` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `src/services/progressivo.js`:

```js
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'

export async function emettiFattura(fatturaId) {
  return runTransaction(db, async (tx) => {
    const fatturaRef = doc(db, 'fatture', fatturaId)
    const fatturaSnap = await tx.get(fatturaRef)
    if (!fatturaSnap.exists()) throw new Error('Fattura inesistente')
    const fattura = fatturaSnap.data()
    if (fattura.stato !== 'bozza') throw new Error('Fattura già emessa')

    const anno = Number(String(fattura.data).slice(0, 4))
    if (!anno) throw new Error('Data fattura mancante o non valida')

    const contatoreRef = doc(db, 'contatori', String(anno))
    const contatoreSnap = await tx.get(contatoreRef)
    const ultimo = contatoreSnap.exists() ? (contatoreSnap.data().ultimoNumero ?? 0) : 0
    const numero = ultimo + 1
    const numeroFormattato = formattaNumero(numero, anno)

    tx.set(contatoreRef, { ultimoNumero: numero }, { merge: true })
    tx.update(fatturaRef, {
      stato: 'emessa',
      numero,
      anno,
      numeroFormattato,
      emessoIl: serverTimestamp(),
    })

    return { numero, anno, numeroFormattato }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- progressivo`
Expected: PASS (all cases, including formattaNumero).

- [ ] **Step 5: Review the transaction logic a second time**

Re-read `emettiFattura` and confirm against the spec:
- number written ONLY inside the transaction (never before);
- counter and invoice written in the SAME transaction (atomic, no gap on failure);
- year derived from `fattura.data`;
- guard rejects already-emitted invoices.

- [ ] **Step 6: Commit**

```bash
git add src/services/progressivo.js src/services/__tests__/progressivo.test.js
git commit -m "feat: emettiFattura transaction atomica (numero progressivo, zero buchi)"
```

---

## Task 5: UI — ClienteSelect, RigaFattura, EditorFattura

**Files:**
- Create: `src/components/ClienteSelect.jsx`
- Create: `src/components/RigaFattura.jsx`
- Create: `src/pages/Fatture/EditorFattura.jsx`
- Test: `src/pages/Fatture/__tests__/EditorFattura.test.jsx`

- [ ] **Step 1: Write ClienteSelect**

```jsx
// src/components/ClienteSelect.jsx
import { useEffect, useState } from 'react'
import { listAll } from '../lib/db/anagrafiche.js'

const SNAP_FIELDS = ['denominazione', 'indirizzo', 'cap', 'citta', 'prov', 'cf', 'piva']

function toSnapshot(c) {
  const snap = {}
  for (const f of SNAP_FIELDS) snap[f] = c[f] ?? ''
  return snap
}

export default function ClienteSelect({ value, onChange }) {
  const [clienti, setClienti] = useState([])
  useEffect(() => { listAll('clienti').then(setClienti) }, [])
  return (
    <select
      className="border rounded p-2 w-full"
      value={value ?? ''}
      onChange={(e) => {
        const c = clienti.find((x) => x.id === e.target.value)
        onChange(c ? { clienteId: c.id, clienteSnapshot: toSnapshot(c) } : { clienteId: null, clienteSnapshot: null })
      }}
    >
      <option value="">— Seleziona cliente —</option>
      {clienti.map((c) => (
        <option key={c.id} value={c.id}>{c.denominazione || c.cod}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Write RigaFattura**

```jsx
// src/components/RigaFattura.jsx
import { importoRiga } from '../utils/calcoli.js'

export default function RigaFattura({ riga, prodotti, onChange, onRemove }) {
  function set(field, raw, numeric) {
    onChange({ ...riga, [field]: numeric ? (raw === '' ? '' : Number(raw)) : raw })
  }
  function onCod(cod) {
    const p = prodotti.find((x) => x.cod === cod)
    if (p) onChange({ ...riga, cod, descrizione: p.descrizione ?? '', um: p.um ?? '', prezzo: p.listino1 ?? 0, iva: 'FC' })
    else onChange({ ...riga, cod })
  }
  const importo = importoRiga(riga.qta, riga.prezzo, riga.sconto)
  return (
    <tr className="border-t">
      <td className="p-1">
        <input list="prodotti-list" className="border rounded p-1 w-24" value={riga.cod ?? ''} onChange={(e) => onCod(e.target.value)} />
      </td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.descrizione ?? ''} onChange={(e) => set('descrizione', e.target.value)} /></td>
      <td className="p-1"><input type="number" step="any" className="border rounded p-1 w-16" value={riga.qta ?? ''} onChange={(e) => set('qta', e.target.value, true)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-12" value={riga.um ?? ''} onChange={(e) => set('um', e.target.value)} /></td>
      <td className="p-1"><input type="number" step="any" className="border rounded p-1 w-20" value={riga.prezzo ?? ''} onChange={(e) => set('prezzo', e.target.value, true)} /></td>
      <td className="p-1"><input type="number" step="any" className="border rounded p-1 w-16" value={riga.sconto ?? ''} onChange={(e) => set('sconto', e.target.value, true)} /></td>
      <td className="p-1 text-right">{importo.toFixed(2)}</td>
      <td className="p-1"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
```

- [ ] **Step 3: Write EditorFattura**

```jsx
// src/pages/Fatture/EditorFattura.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listAll as listAnagrafica } from '../../lib/db/anagrafiche.js'
import { creaBozza, getOne, aggiornaBozza, deleteBozza } from '../../lib/db/fatture.js'
import { emettiFattura } from '../../services/progressivo.js'
import { calcolaTotali } from '../../utils/calcoli.js'
import ClienteSelect from '../../components/ClienteSelect.jsx'
import RigaFattura from '../../components/RigaFattura.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

const oggi = () => new Date().toISOString().slice(0, 10)
const rigaVuota = () => ({ cod: '', descrizione: '', qta: 1, um: '', prezzo: 0, sconto: 0, iva: 'FC' })

export default function EditorFattura() {
  const { id } = useParams()
  const nav = useNavigate()
  const [fattura, setFattura] = useState({ data: oggi(), clienteId: null, clienteSnapshot: null, righe: [rigaVuota()], pagamento: 'A vista fattura' })
  const [prodotti, setProdotti] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmEmetti, setConfirmEmetti] = useState(false)

  useEffect(() => { listAnagrafica('prodotti').then(setProdotti) }, [])
  useEffect(() => {
    if (id) getOne(id).then((f) => { if (f) setFattura(f) })
  }, [id])

  const totali = useMemo(() => calcolaTotali(fattura.righe), [fattura.righe])
  const setRiga = (i, r) => setFattura((f) => ({ ...f, righe: f.righe.map((x, j) => (j === i ? r : x)) }))
  const addRiga = () => setFattura((f) => ({ ...f, righe: [...f.righe, rigaVuota()] }))
  const removeRiga = (i) => setFattura((f) => ({ ...f, righe: f.righe.filter((_, j) => j !== i) }))

  async function salva() {
    setError(''); setBusy(true)
    try {
      const payload = { ...fattura, ...totali }
      if (id) { await aggiornaBozza(id, payload); return id }
      const newId = await creaBozza(payload)
      nav(`/fatture/${newId}`, { replace: true })
      return newId
    } catch (e) { setError(e.message); throw e }
    finally { setBusy(false) }
  }

  async function emetti() {
    setConfirmEmetti(false); setError(''); setBusy(true)
    try {
      const fid = await salvaSilenzioso()
      await emettiFattura(fid)
      nav(`/fatture/${fid}`)
    } catch (e) {
      setError('Numerazione richiede connessione internet. La fattura resta in bozza. (' + e.message + ')')
    } finally { setBusy(false) }
  }

  async function salvaSilenzioso() {
    const payload = { ...fattura, ...totali }
    if (id) { await aggiornaBozza(id, payload); return id }
    return creaBozza(payload)
  }

  const isEmessa = fattura.stato === 'emessa'
  if (isEmessa) { nav(`/fatture/${id}`, { replace: true }); return null }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-bold mb-4">{id ? 'Modifica bozza' : 'Nuova fattura'}</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <label className="block">Data
          <input type="date" className="border rounded p-2 w-full" value={fattura.data} onChange={(e) => setFattura((f) => ({ ...f, data: e.target.value }))} />
        </label>
        <label className="block">Cliente
          <ClienteSelect value={fattura.clienteId} onChange={(sel) => setFattura((f) => ({ ...f, ...sel }))} />
        </label>
      </div>

      <datalist id="prodotti-list">
        {prodotti.map((p) => <option key={p.id} value={p.cod}>{p.descrizione}</option>)}
      </datalist>
      <table className="w-full text-sm mb-2">
        <thead className="bg-gray-50"><tr>
          <th className="p-1 text-left">Cod</th><th className="p-1 text-left">Descrizione</th>
          <th className="p-1">Qtà</th><th className="p-1">UM</th><th className="p-1">Prezzo</th>
          <th className="p-1">Sconto%</th><th className="p-1 text-right">Importo</th><th></th>
        </tr></thead>
        <tbody>
          {fattura.righe.map((r, i) => (
            <RigaFattura key={i} riga={r} prodotti={prodotti} onChange={(nr) => setRiga(i, nr)} onRemove={() => removeRiga(i)} />
          ))}
        </tbody>
      </table>
      <button type="button" className="text-blue-600 mb-4" onClick={addRiga}>+ Aggiungi riga</button>

      <div className="text-right mb-4">
        <div>Tot. fuori campo: € {totali.totaleFuoriCampo.toFixed(2)}</div>
        <div>Bollo: € {totali.bollo.toFixed(2)}</div>
        <div className="font-bold">Totale documento: € {totali.totale.toFixed(2)}</div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy} className="bg-gray-100 rounded px-4 py-2" onClick={salva}>Salva bozza</button>
        <button type="button" disabled={busy || !fattura.clienteId} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50" onClick={() => setConfirmEmetti(true)}>Emetti</button>
        {id && <button type="button" disabled={busy} className="text-red-600 ml-auto" onClick={async () => { await deleteBozza(id); nav('/fatture') }}>Elimina bozza</button>}
      </div>
      {confirmEmetti && (
        <ConfirmDialog
          message="Emettere la fattura? Verrà assegnato il numero progressivo definitivo e non sarà più modificabile."
          onConfirm={emetti}
          onCancel={() => setConfirmEmetti(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write the editor test**

```jsx
// src/pages/Fatture/__tests__/EditorFattura.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/db/anagrafiche.js', () => ({
  listAll: vi.fn((kind) => Promise.resolve(
    kind === 'prodotti'
      ? [{ id: 'p1', cod: 'P1', descrizione: 'Corona', um: 'NR', listino1: 100 }]
      : [{ id: 'c1', cod: 'C1', denominazione: 'Studio Rossi', citta: 'Teramo' }],
  )),
}))
const created = { payload: null }
vi.mock('../../../lib/db/fatture.js', () => ({
  creaBozza: vi.fn((p) => { created.payload = p; return Promise.resolve('new-id') }),
  getOne: vi.fn(() => Promise.resolve(null)),
  aggiornaBozza: vi.fn(() => Promise.resolve()),
  deleteBozza: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../../services/progressivo.js', () => ({
  emettiFattura: vi.fn(() => Promise.resolve({ numeroFormattato: '001/2026' })),
}))

import EditorFattura from '../EditorFattura.jsx'
beforeEach(() => { created.payload = null })

function renderEditor() {
  return render(<MemoryRouter><EditorFattura /></MemoryRouter>)
}

describe('EditorFattura', () => {
  it('computes live totals with bollo when over threshold', async () => {
    renderEditor()
    await waitFor(() => screen.getByText(/Seleziona cliente/i))
    // default row qta 1 prezzo 0 -> set price 100
    const prezzo = document.querySelector('input[type="number"][step="any"]:nth-of-type(1)')
    // simpler: set the price field (3rd numeric in row: qta, prezzo, sconto)
    const numbers = screen.getAllByRole('spinbutton')
    fireEvent.change(numbers[1], { target: { value: '100' } }) // prezzo
    await waitFor(() => expect(screen.getByText(/Bollo: € 2.00/)).toBeInTheDocument())
    expect(screen.getByText(/Totale documento: € 102.00/)).toBeInTheDocument()
  })

  it('Emetti is disabled until a cliente is selected', async () => {
    renderEditor()
    await waitFor(() => screen.getByText(/Seleziona cliente/i))
    expect(screen.getByRole('button', { name: 'Emetti' })).toBeDisabled()
  })
})
```

- [ ] **Step 5: Run tests**

Run: `npm test -- EditorFattura`
Expected: PASS. Fix selector specifics if the DOM query needs adjusting (the totals/disabled assertions are the contract).

- [ ] **Step 6: Commit**

```bash
git add src/components/ClienteSelect.jsx src/components/RigaFattura.jsx src/pages/Fatture/EditorFattura.jsx src/pages/Fatture/__tests__/EditorFattura.test.jsx
git commit -m "feat: editor fattura (righe, totali live, emetti con conferma)"
```

---

## Task 6: UI — ListaFatture, DettaglioFattura, routing

**Files:**
- Create: `src/pages/Fatture/ListaFatture.jsx`
- Create: `src/pages/Fatture/DettaglioFattura.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Write ListaFatture**

```jsx
// src/pages/Fatture/ListaFatture.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAll } from '../../lib/db/fatture.js'

export default function ListaFatture() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { listAll().then((d) => { setRows(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) =>
      [r.numeroFormattato, r.data, r.clienteSnapshot?.denominazione]
        .some((v) => String(v ?? '').toLowerCase().includes(n)))
  }, [rows, q])

  if (loading) return <p className="p-6">Caricamento…</p>
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Fatture</h2>
        <Link to="/fatture/nuova" className="bg-blue-600 text-white rounded px-3 py-1">Nuova</Link>
        <input className="border rounded p-2 ml-auto w-64" placeholder="Cerca…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Numero</th><th className="text-left p-2">Data</th>
          <th className="text-left p-2">Cliente</th><th className="text-right p-2">Totale</th>
        </tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">
                <Link className="text-blue-600" to={`/fatture/${r.id}`}>
                  {r.stato === 'emessa' ? r.numeroFormattato : 'BOZZA'}
                </Link>
              </td>
              <td className="p-2">{r.data}</td>
              <td className="p-2">{r.clienteSnapshot?.denominazione ?? ''}</td>
              <td className="p-2 text-right">€ {Number(r.totale ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessuna fattura.</p>}
    </div>
  )
}
```

- [ ] **Step 2: Write DettaglioFattura (read-only; redirects drafts to the editor)**

```jsx
// src/pages/Fatture/DettaglioFattura.jsx
import { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { getOne } from '../../lib/db/fatture.js'

export default function DettaglioFattura() {
  const { id } = useParams()
  const [fattura, setFattura] = useState(undefined)
  useEffect(() => { getOne(id).then(setFattura) }, [id])

  if (fattura === undefined) return <p className="p-6">Caricamento…</p>
  if (fattura === null) return <p className="p-6">Fattura non trovata.</p>
  if (fattura.stato === 'bozza') return <Navigate to={`/fatture/${id}/modifica`} replace />

  const c = fattura.clienteSnapshot ?? {}
  return (
    <div className="p-6 max-w-3xl">
      <Link to="/fatture" className="text-blue-600">← Fatture</Link>
      <h2 className="text-xl font-bold my-3">Fattura {fattura.numeroFormattato}</h2>
      <p>Data: {fattura.data}</p>
      <p className="mt-2 font-medium">{c.denominazione}</p>
      <p className="text-sm text-gray-600">{c.indirizzo} — {c.cap} {c.citta} ({c.prov})</p>
      <p className="text-sm text-gray-600">C.F. {c.cf} · P.IVA {c.piva}</p>
      <table className="w-full text-sm my-4">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Cod</th><th className="text-left p-2">Descrizione</th>
          <th className="p-2">Qtà</th><th className="p-2">Prezzo</th><th className="text-right p-2">Importo</th>
        </tr></thead>
        <tbody>
          {(fattura.righe ?? []).map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{r.cod}</td><td className="p-2">{r.descrizione}</td>
              <td className="p-2 text-center">{r.qta} {r.um}</td>
              <td className="p-2 text-center">{Number(r.prezzo ?? 0).toFixed(2)}</td>
              <td className="p-2 text-right">{(Number(r.qta) * Number(r.prezzo) * (1 - (Number(r.sconto) || 0) / 100)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right">
        <div>Tot. fuori campo: € {Number(fattura.totaleFuoriCampo ?? 0).toFixed(2)}</div>
        <div>Bollo: € {Number(fattura.bollo ?? 0).toFixed(2)}</div>
        <div className="font-bold">Totale documento: € {Number(fattura.totale ?? 0).toFixed(2)}</div>
      </div>
      <button type="button" disabled className="mt-4 bg-gray-200 rounded px-4 py-2 cursor-not-allowed" title="Disponibile nel Piano 4">
        Scarica PDF (in arrivo)
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Wire routes in App.jsx**

Modify `src/App.jsx` — add imports and routes:

```jsx
import ListaFatture from './pages/Fatture/ListaFatture.jsx'
import EditorFattura from './pages/Fatture/EditorFattura.jsx'
import DettaglioFattura from './pages/Fatture/DettaglioFattura.jsx'
```

Inside `<Routes>` add:

```jsx
        <Route path="/fatture" element={<ListaFatture />} />
        <Route path="/fatture/nuova" element={<EditorFattura />} />
        <Route path="/fatture/:id" element={<DettaglioFattura />} />
        <Route path="/fatture/:id/modifica" element={<EditorFattura />} />
```

> Note: `DettaglioFattura` redirects a draft to `/fatture/:id/modifica`. After emission the editor
> navigates to `/fatture/:id` (read-only detail). Emitted invoices never reach the editor route.

- [ ] **Step 4: Add a Home link**

In `src/pages/Home.jsx`, add a navigation entry to `/fatture` alongside the existing Anagrafiche link (match the existing link markup in that file).

- [ ] **Step 5: Run the full suite + build**

Run: `npm test`
Expected: all tests PASS (existing 33 + new).
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Fatture/ListaFatture.jsx src/pages/Fatture/DettaglioFattura.jsx src/App.jsx src/pages/Home.jsx
git commit -m "feat: lista + dettaglio fattura (sola lettura) e routing"
```

---

## Task 7: Manual end-to-end verification (live Firestore)

This confirms the real-world atomicity that unit tests (mocked) cannot.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` and log in.

- [ ] **Step 2: Create and emit**

- New invoice → pick a cliente → add a line with prezzo > 77,47 → confirm bollo = 2,00 and totale.
- Click "Emetti" → confirm dialog → verify the invoice gets `001/2026` (or the next number for the year) and becomes read-only.
- Reload: the number persists; the invoice opens in read-only detail (not the editor).

- [ ] **Step 3: Verify the counter in Firestore console**

- `contatori/2026.ultimoNumero` equals the last emitted number.
- Emit a second invoice → it gets the next sequential number, no gap.

- [ ] **Step 4: Offline check**

- DevTools → Network → Offline. Create a draft, click "Emetti" → expect the error message and the invoice STAYS a draft (no number). Counter unchanged.

- [ ] **Step 5: Draft deletion**

- Create a draft, delete it → confirm no number was consumed (counter unchanged).

---

## Self-Review (completed by author)

- **Spec coverage:** modello dati (Task 3), progressivo transaction (Task 4), calcoli/bollo (Task 1), formato NNN/ANNO (Task 2), UI lista/editor/dettaglio (Tasks 5–6), sola-lettura emesse (Task 3 guard + Task 6 routing), offline behavior (Task 7), all spec test cases mapped to Task 1/2/4 tests. PDF intentionally deferred to Piano 4 (spec §1).
- **Placeholder scan:** no TBD/TODO; every code step shows full code; the single intentional UI placeholder is the disabled "Scarica PDF" button (documented as Piano 4).
- **Type consistency:** `creaBozza`/`aggiornaBozza`/`deleteBozza`/`getOne`/`listAll` (fatture.js) and `formattaNumero`/`emettiFattura` (progressivo.js) and `importoRiga`/`calcolaTotali` (calcoli.js) names match across tasks. `clienteSnapshot` fields consistent between ClienteSelect, db layer, and DettaglioFattura.
