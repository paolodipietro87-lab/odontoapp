import { useRef, useState } from 'react'
import { filtraOpzioni } from '../utils/autocomplete.js'

// Combobox custom: tendina nostra, identica su PC e mobile (no <datalist> nativo).
// options = [{ key?, label, detail?, raw? }]. onSelect riceve l'opzione scelta.
export default function Autocomplete({
  value,
  onChangeText,
  onSelect,
  options = [],
  placeholder,
  className = 'border rounded p-2 w-full',
  limit = 50,
}) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const filtered = filtraOpzioni(options, value, limit)

  function pick(o) {
    onSelect(o)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && filtered[hi]) { e.preventDefault(); pick(filtered[hi]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className="relative">
      <input
        className={`${className} pr-7`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChangeText(e.target.value); setOpen(true); setHi(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          aria-label="Cancella"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1"
          onMouseDown={(e) => { e.preventDefault(); onChangeText(''); setOpen(false) }}
        >
          ✕
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 left-0 mt-1 min-w-full w-max max-w-[20rem] max-h-60 overflow-auto bg-white border rounded shadow-lg">
          {filtered.map((o, i) => (
            <li
              key={o.key ?? o.label ?? i}
              className={`px-3 py-2 cursor-pointer ${i === hi ? 'bg-blue-50' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o) }}
              onMouseEnter={() => setHi(i)}
            >
              <div className="text-sm font-medium">{o.label}</div>
              {o.detail && <div className="text-xs text-gray-500">{o.detail}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
