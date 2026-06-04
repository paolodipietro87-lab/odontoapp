export function formattaNumero(numero, anno) {
  return `${String(numero).padStart(3, '0')}/${anno}`
}
