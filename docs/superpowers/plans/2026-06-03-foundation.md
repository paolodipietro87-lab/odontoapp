# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the OdontoApp PWA (Vite + React + Tailwind), wire it to a dedicated Firebase project with Firestore offline persistence and single-account auth, and deploy a skeleton to GitHub Pages.

**Architecture:** Client-only React PWA. Firebase Firestore is the live datastore with native offline persistence; Firebase Auth gates access to a single user. No custom backend. Hosting on GitHub Pages via GitHub Actions.

**Tech Stack:** React, Vite, Tailwind CSS, Firebase (Firestore + Auth), Vitest, vite-plugin-pwa, GitHub Pages.

---

## File structure (created by this plan)

```
package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html
.env.local                      # Firebase config (gitignored)
.env.example                    # template, committed
.gitignore
src/
├── main.jsx                    # React entry
├── App.jsx                     # router shell + auth gate
├── index.css                   # Tailwind directives
├── lib/
│   ├── firebase.js             # Firebase init + Firestore offline persistence
│   └── auth.js                 # login/logout/useAuth hook
├── pages/
│   ├── Home.jsx
│   └── Login.jsx
└── components/
    └── SyncStatusBadge.jsx     # online/offline indicator
src/lib/__tests__/firebase.test.js
src/utils/__tests__/             # (created later plans)
.github/workflows/deploy.yml     # GitHub Pages CI
```

---

## Task 0: Manual Firebase project setup (guided, user performs in browser)

> This task has no code. The engineer guides the user through the Firebase Console, then records the config values into `.env.local`. Do NOT proceed to Task 1 until the config object is captured.

- [ ] **Step 1: Create the dedicated project**

In the user's existing Firebase account (console.firebase.google.com):
1. Click **"Crea un nuovo progetto Firebase"**.
2. Name: `odontoapp-boromei`. Disable Google Analytics (not needed, keeps it €0).
3. Wait for project creation, click **Continua**.

- [ ] **Step 2: Register a Web App**

1. On project overview, click the **Web** icon (`</>`).
2. App nickname: `odontoapp`. Do NOT check "Firebase Hosting" (we use GitHub Pages).
3. Click **Registra app**.
4. Copy the `firebaseConfig` object shown (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

- [ ] **Step 3: Enable Firestore**

1. Left menu → **Firestore Database** → **Crea database**.
2. Mode: **Production mode** (we set rules in Step 5).
3. Location: `eur3 (europe-west)` (EU data residency).

- [ ] **Step 4: Enable Auth (Email/Password) + create the one user**

1. Left menu → **Authentication** → **Inizia**.
2. **Sign-in method** tab → enable **Email/Password** (leave passwordless off).
3. **Users** tab → **Aggiungi utente** → Pietro's email + a strong password. Record credentials.

- [ ] **Step 5: Set Firestore security rules**

Firestore Database → **Regole** tab → paste and **Pubblica**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Single authenticated user → full access; everyone else denied.

- [ ] **Step 6: Record config into `.env.local`**

Create `.env.local` in project root (do NOT commit) with values from Step 2:

```
VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=odontoapp-boromei.firebaseapp.com
VITE_FB_PROJECT_ID=odontoapp-boromei
VITE_FB_STORAGE_BUCKET=odontoapp-boromei.appspot.com
VITE_FB_MSG_SENDER_ID=...
VITE_FB_APP_ID=...
```

Expected: file exists, all six values filled. No commit (gitignored).

---

## Task 1: Project scaffold (Vite + React)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `.gitignore`

- [ ] **Step 1: Scaffold Vite React app**

Run:
```bash
npm create vite@latest . -- --template react
npm install
```
Expected: `package.json`, `src/main.jsx`, `src/App.jsx` created; `npm install` completes.

- [ ] **Step 2: Add base scripts and deps**

Run:
```bash
npm install firebase react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest in `vite.config.js`**

Replace `vite.config.js` with:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/odontoapp/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Add test setup file**

Create `src/test/setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Smoke test the scaffold**

Create `src/App.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders app shell', () => {
  render(<App />)
  expect(screen.getByRole('heading')).toBeInTheDocument()
})
```
Replace `src/App.jsx` minimally:
```jsx
export default function App() {
  return <h1>OdontoApp</h1>
}
```

- [ ] **Step 7: Run the test**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 8: Append to `.gitignore`**

Ensure `.gitignore` contains:
```
node_modules
dist
.env.local
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite React app with Vitest"
```

---

## Task 2: Tailwind CSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`, `src/index.css`
- Modify: `src/main.jsx`

- [ ] **Step 1: Install Tailwind**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Expected: `tailwind.config.js` + `postcss.config.js` created.

- [ ] **Step 2: Configure content paths**

Replace `tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 3: Add Tailwind directives**

Replace `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Import CSS in entry**

Ensure `src/main.jsx` imports `./index.css`.

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS"
```

---

## Task 3: Firebase init with offline persistence

**Files:**
- Create: `src/lib/firebase.js`, `.env.example`, `src/lib/__tests__/firebase.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/firebase.test.js`:
```js
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ name: 'app' })) }))
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({ type: 'firestore' })),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
}))
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ type: 'auth' })) }))

describe('firebase init', () => {
  it('exports db and auth', async () => {
    const mod = await import('../firebase.js')
    expect(mod.db).toBeDefined()
    expect(mod.auth).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- firebase`
Expected: FAIL (cannot resolve `../firebase.js`).

- [ ] **Step 3: Implement `src/lib/firebase.js`**

```js
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
}

export const app = initializeApp(firebaseConfig)

// Native offline persistence (IndexedDB), multi-tab safe
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export const auth = getAuth(app)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- firebase`
Expected: PASS.

- [ ] **Step 5: Create `.env.example`**

```
VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MSG_SENDER_ID=
VITE_FB_APP_ID=
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/firebase.js src/lib/__tests__/firebase.test.js .env.example
git commit -m "feat: init Firebase with Firestore offline persistence"
```

---

## Task 4: Auth (login/logout + useAuth hook)

**Files:**
- Create: `src/lib/auth.js`, `src/lib/__tests__/auth.test.jsx`, `src/pages/Login.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/auth.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const handlers = {}
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, cb) => { handlers.cb = cb; return () => {} },
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('../firebase.js', () => ({ auth: {} }))

describe('useAuth', () => {
  beforeEach(() => { handlers.cb = undefined })

  it('reports user after auth state change', async () => {
    const { useAuth } = await import('../auth.js')
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    handlers.cb({ email: 'pietro@test.it' })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user.email).toBe('pietro@test.it')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth`
Expected: FAIL (cannot resolve `../auth.js`).

- [ ] **Step 3: Implement `src/lib/auth.js`**

```js
import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function logout() {
  return signOut(auth)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- auth`
Expected: PASS.

- [ ] **Step 5: Implement `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { login } from '../lib/auth.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch {
      setError('Credenziali non valide')
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-20 flex flex-col gap-3 p-6">
      <h1 className="text-xl font-bold">OdontoApp — Accedi</h1>
      <input className="border rounded p-2" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border rounded p-2" type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="bg-blue-600 text-white rounded p-2" type="submit">Accedi</button>
    </form>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.js src/lib/__tests__/auth.test.jsx src/pages/Login.jsx
git commit -m "feat: add auth hook, login/logout, Login page"
```

---

## Task 5: SyncStatusBadge (online/offline indicator)

**Files:**
- Create: `src/components/SyncStatusBadge.jsx`, `src/components/__tests__/SyncStatusBadge.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/SyncStatusBadge.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SyncStatusBadge from '../SyncStatusBadge.jsx'

describe('SyncStatusBadge', () => {
  it('shows offline when navigator is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<SyncStatusBadge />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('shows online when navigator is online', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    render(<SyncStatusBadge />)
    expect(screen.getByText(/online/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SyncStatusBadge`
Expected: FAIL (cannot resolve component).

- [ ] **Step 3: Implement `src/components/SyncStatusBadge.jsx`**

```jsx
import { useEffect, useState } from 'react'

export default function SyncStatusBadge() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return (
    <span className={`px-2 py-1 rounded text-xs ${online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SyncStatusBadge`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/SyncStatusBadge.jsx src/components/__tests__/SyncStatusBadge.test.jsx
git commit -m "feat: add SyncStatusBadge online/offline indicator"
```

---

## Task 6: App shell with router + auth gate

**Files:**
- Modify: `src/App.jsx`, `src/App.test.jsx`
- Create: `src/pages/Home.jsx`

- [ ] **Step 1: Implement `src/pages/Home.jsx`**

```jsx
import SyncStatusBadge from '../components/SyncStatusBadge.jsx'
import { logout } from '../lib/auth.js'

export default function Home() {
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">OdontoApp</h1>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <button className="text-sm text-blue-600" onClick={() => logout()}>Esci</button>
        </div>
      </header>
      <nav className="flex gap-4">
        <span>Fatture</span>
        <span>Conformità</span>
        <span>Anagrafiche</span>
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Update the App test for the auth gate**

Replace `src/App.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('./lib/auth.js', () => ({
  useAuth: () => ({ user: null, loading: false }),
  logout: vi.fn(),
}))

describe('App auth gate', () => {
  it('shows login when no user', async () => {
    const { default: App } = await import('./App.jsx')
    render(<App />)
    expect(screen.getByText(/Accedi/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL (App still renders only the heading).

- [ ] **Step 4: Implement `src/App.jsx`**

```jsx
import { useAuth } from './lib/auth.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Caricamento…</p>
  if (!user) return <Login />
  return <Home />
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- App`
Expected: PASS.

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/App.test.jsx src/pages/Home.jsx
git commit -m "feat: app shell with auth gate"
```

---

## Task 7: PWA manifest + service worker

**Files:**
- Modify: `vite.config.js`, `package.json`
- Create: icons referenced by manifest under `public/`

- [ ] **Step 1: Install plugin**

Run: `npm install -D vite-plugin-pwa`

- [ ] **Step 2: Configure PWA in `vite.config.js`**

Add the import and plugin (keep existing `base` and `test` config):
```js
import { VitePWA } from 'vite-plugin-pwa'
// ...
plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'OdontoApp',
      short_name: 'OdontoApp',
      start_url: '/odontoapp/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2563eb',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  }),
],
```

- [ ] **Step 3: Add placeholder icons**

Place `public/icon-192.png` and `public/icon-512.png` (simple solid-color PNGs for now; final icons later).

- [ ] **Step 4: Verify build includes PWA assets**

Run: `npm run build`
Expected: build succeeds; `dist/manifest.webmanifest` and `dist/sw.js` present.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js package.json public/icon-192.png public/icon-512.png
git commit -m "feat: add PWA manifest and service worker"
```

---

## Task 8: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

> Prerequisite (manual): a GitHub repo exists and Pages is set to "GitHub Actions" source. Firebase env vars added as repo secrets (`VITE_FB_*`). This is recorded in open items; confirm the GitHub account/repo with the user before this task.

- [ ] **Step 1: Create the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_FB_API_KEY: ${{ secrets.VITE_FB_API_KEY }}
          VITE_FB_AUTH_DOMAIN: ${{ secrets.VITE_FB_AUTH_DOMAIN }}
          VITE_FB_PROJECT_ID: ${{ secrets.VITE_FB_PROJECT_ID }}
          VITE_FB_STORAGE_BUCKET: ${{ secrets.VITE_FB_STORAGE_BUCKET }}
          VITE_FB_MSG_SENDER_ID: ${{ secrets.VITE_FB_MSG_SENDER_ID }}
          VITE_FB_APP_ID: ${{ secrets.VITE_FB_APP_ID }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages on push to main"
```

- [ ] **Step 3: Verify deploy (after first push)**

Push to `main`, open the Actions tab, confirm the workflow goes green and the Pages URL serves the login screen.

---

## Self-review notes

- Covers spec §4 (stack), §5 partial (Firestore init only — collections come in later plans), §6 partial (`lib/firebase.js`, `lib/auth.js`, `SyncStatusBadge`, `pages/Home`, `pages/Login`), and the open item "GitHub account/repo".
- Anagrafiche, fatture, progressivo, PDF, conformità are explicitly deferred to plans 2–5.
- No placeholders: every code step contains full code.
- Type/name consistency: `db`, `auth`, `useAuth`, `login`, `logout`, `SyncStatusBadge` used consistently across tasks.
```
