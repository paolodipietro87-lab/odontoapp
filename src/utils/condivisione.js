// Nomi file PDF + helper condivisione nativa. Punto unico (no slug duplicato).

export function slug(s = '') {
  return String(s ?? '').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
}

export function nomeFileFattura(fattura = {}) {
  const numero = (fattura.numeroFormattato ?? '').replace('/', '-')
  const nome = slug(fattura.clienteSnapshot?.denominazione)
  return `Fattura_${numero}${nome ? '_' + nome : ''}.pdf`
}

export function nomeFileConformita(conformita = {}, intestazione = true) {
  const data = (conformita.data ?? '').replace(/\//g, '-')
  const paziente = slug(conformita.paziente)
  const suffix = intestazione ? '' : '_paziente'
  return `Rapporto_${data}${paziente ? '_' + paziente : ''}${suffix}.pdf`
}

// true se il dispositivo può aprire il menu di condivisione nativo con un file.
export function puoCondividereFile(nav, file) {
  if (!nav || typeof nav.share !== 'function') return false
  if (typeof nav.canShare === 'function') {
    try { return nav.canShare({ files: [file] }) } catch { return false }
  }
  return true
}
