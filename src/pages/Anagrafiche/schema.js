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
  // Contatti
  { name: 'referente', label: 'Referente', type: 'text' },
  { name: 'tel', label: 'Telefono', type: 'text' },
  { name: 'cell', label: 'Cellulare', type: 'text' },
  { name: 'fax', label: 'Fax', type: 'text' },
  { name: 'email', label: 'E-mail', type: 'text' },
  { name: 'pec', label: 'PEC', type: 'text' },
  // Commerciale
  { name: 'sconti', label: 'Sconti', type: 'text' },
  { name: 'listino', label: 'Listino', type: 'text' },
  { name: 'fido', label: 'Fido', type: 'text' },
  { name: 'agente', label: 'Agente', type: 'text' },
  // Note
  { name: 'note', label: 'Note', type: 'text' },
  { name: 'noteDoc', label: 'Note documento', type: 'text' },
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
    // Categorie
    { name: 'categoria', label: 'Categoria', type: 'text' },
    { name: 'sottocategoria', label: 'Sottocategoria', type: 'text' },
    // Listini alternativi
    { name: 'listino2', label: 'Listino 2', type: 'number' },
    { name: 'listino3', label: 'Listino 3', type: 'number' },
    // Note + barcode
    { name: 'note', label: 'Note', type: 'text' },
    { name: 'codBarre', label: 'Codice a barre', type: 'text' },
    { name: 'produttore', label: 'Produttore', type: 'text' },
    // Fornitore
    { name: 'codFornitore', label: 'Cod. fornitore', type: 'text' },
    { name: 'fornitore', label: 'Fornitore', type: 'text' },
    { name: 'prezzoForn', label: 'Prezzo fornitore', type: 'number' },
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
