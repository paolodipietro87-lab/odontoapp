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
