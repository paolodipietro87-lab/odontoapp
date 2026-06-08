// Filtro per combobox custom (uguale su PC e mobile, no <datalist> nativo).
// option = { label, detail?, ... }. Match su label+detail, tutti i token presenti.

export function filtraOpzioni(options = [], query = '', limit = 50) {
  const tokens = String(query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  const matched = tokens.length === 0
    ? options
    : options.filter((o) => {
        const hay = `${o.label ?? ''} ${o.detail ?? ''}`.toLowerCase()
        return tokens.every((t) => hay.includes(t))
      })
  return matched.slice(0, limit)
}
