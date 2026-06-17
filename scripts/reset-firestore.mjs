// One-off PRE-CONSEGNA reset: cancella fatture, conformita, contatori.
// Anagrafiche (clienti/fornitori/prodotti) NON toccate.
//
// Uso:
//   node scripts/reset-firestore.mjs --email <admin@mail> --password <pwd>
//   node scripts/reset-firestore.mjs ... --dry        (solo conteggio, niente delete)
//
// Legge la config Firebase da .env.local. Login richiesto (regole = utente auth).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const COLLEZIONI = ['fatture', 'conformita', 'contatori']

function parseArgs(argv) {
  const out = { dry: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry') out.dry = true
    else if (a === '--email') out.email = argv[++i]
    else if (a === '--password') out.password = argv[++i]
  }
  return out
}

function loadEnv() {
  const here = dirname(fileURLToPath(import.meta.url))
  const raw = readFileSync(join(here, '..', '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return {
    apiKey: env.VITE_FB_API_KEY,
    authDomain: env.VITE_FB_AUTH_DOMAIN,
    projectId: env.VITE_FB_PROJECT_ID,
    storageBucket: env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FB_MSG_SENDER_ID,
    appId: env.VITE_FB_APP_ID,
  }
}

async function svuota(db, nome, dry) {
  const snap = await getDocs(collection(db, nome))
  const ids = snap.docs.map((d) => d.id)
  console.log(`  ${nome}: ${ids.length} doc${ids.length === 1 ? '' : 's'}${ids.length ? ' -> ' + ids.join(', ') : ''}`)
  if (dry || ids.length === 0) return ids.length
  // batch da 500 (limite Firestore)
  for (let i = 0; i < ids.length; i += 500) {
    const batch = writeBatch(db)
    for (const id of ids.slice(i, i + 500)) batch.delete(doc(db, nome, id))
    await batch.commit()
  }
  return ids.length
}

async function main() {
  const args = parseArgs(process.argv)
  args.email = args.email || process.env.FB_EMAIL
  args.password = args.password || process.env.FB_PWD
  if (!args.email || !args.password) {
    console.error('ERRORE: servono email e password (--email/--password o env FB_EMAIL/FB_PWD)')
    process.exit(1)
  }
  const config = loadEnv()
  console.log(`Progetto: ${config.projectId}`)
  console.log(args.dry ? 'MODO: DRY-RUN (nessuna cancellazione)\n' : 'MODO: DELETE REALE\n')

  const app = initializeApp(config)
  const auth = getAuth(app)
  const db = getFirestore(app)

  await signInWithEmailAndPassword(auth, args.email, args.password)
  console.log(`Login OK come ${args.email}\n`)

  let tot = 0
  for (const nome of COLLEZIONI) tot += await svuota(db, nome, args.dry)

  console.log(`\n${args.dry ? 'Trovati' : 'Cancellati'} ${tot} doc totali.`)
  console.log('Anagrafiche (clienti/fornitori/prodotti) NON toccate.')
  process.exit(0)
}

main().catch((e) => {
  console.error('FALLITO:', e.message)
  process.exit(1)
})
