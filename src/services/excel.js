import * as XLSX from 'xlsx'

// Tolerant header lookup: exact match first, then a normalized fallback
// that ignores any non-ASCII byte (handles mojibaked headers like "Citt").
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
    // Contatti
    referente: text(pick(row, 'Referente')),
    tel: text(pick(row, 'Tel.')),
    cell: text(pick(row, 'Cell')),
    fax: text(pick(row, 'Fax')),
    email: text(pick(row, 'e-mail')),
    pec: text(pick(row, 'Pec')),
    // Commerciale
    sconti: text(pick(row, 'Sconti')),
    listino: text(pick(row, 'Listino')),
    fido: text(pick(row, 'Fido')),
    agente: text(pick(row, 'Agente')),
    // Note
    note: text(pick(row, 'Note')),
    noteDoc: text(pick(row, 'Note doc.')),
  }
}

export const mapFornitoreRow = mapClienteRow

export function mapProdottoRow(row) {
  return {
    cod: text(pick(row, 'Cod.')),
    descrizione: text(pick(row, 'Descrizione')),
    tipologia: text(pick(row, 'Tipologia')),
    um: text(pick(row, 'Cod. Udm')),
    codIva: text(pick(row, 'Cod. Iva')),
    listino1: numOrNull(pick(row, 'Listino 1')),
    // Categorie
    categoria: text(pick(row, 'Categoria')),
    sottocategoria: text(pick(row, 'Sottocategoria')),
    // Listini alternativi
    listino2: numOrNull(pick(row, 'Listino 2')),
    listino3: numOrNull(pick(row, 'Listino 3')),
    // Note + barcode
    note: text(pick(row, 'Note')),
    codBarre: text(pick(row, 'Cod. a barre')),
    produttore: text(pick(row, 'Produttore')),
    // Fornitore
    codFornitore: text(pick(row, 'Cod. fornitore')),
    fornitore: text(pick(row, 'Fornitore')),
    prezzoForn: numOrNull(pick(row, 'Prezzo forn.')),
  }
}

const MAPPERS = {
  clienti: mapClienteRow,
  fornitori: mapFornitoreRow,
  prodotti: mapProdottoRow,
}

export function parseAnagrafica(arrayBuffer, kind) {
  const mapper = MAPPERS[kind]
  if (!mapper) throw new Error(`Tipo anagrafica sconosciuto: ${kind}`)
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
  return rows.map(mapper).filter((r) => r.cod !== '')
}

export function dedupByCod(rows) {
  const byCod = new Map()
  for (const r of rows) byCod.set(r.cod, r)
  return [...byCod.values()]
}
