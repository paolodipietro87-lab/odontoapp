import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/auth.js'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import AnagraficheHome from './pages/Anagrafiche/AnagraficheHome.jsx'
import ImportPage from './pages/Anagrafiche/ImportPage.jsx'
import ListaFatture from './pages/Fatture/ListaFatture.jsx'
import EditorFattura from './pages/Fatture/EditorFattura.jsx'
import DettaglioFattura from './pages/Fatture/DettaglioFattura.jsx'
import ListaConformita from './pages/Conformita/ListaConformita.jsx'
import EditorConformita from './pages/Conformita/EditorConformita.jsx'
import DettaglioConformita from './pages/Conformita/DettaglioConformita.jsx'
import ListaMagazzino from './pages/Magazzino/ListaMagazzino.jsx'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Caricamento…</p>
  if (!user) return <Login />
  return (
    <BrowserRouter basename="/odontoapp">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anagrafiche" element={<AnagraficheHome />} />
        <Route path="/anagrafiche/import" element={<ImportPage />} />
        <Route path="/fatture" element={<ListaFatture />} />
        <Route path="/fatture/nuova" element={<EditorFattura />} />
        <Route path="/fatture/:id" element={<DettaglioFattura />} />
        <Route path="/fatture/:id/modifica" element={<EditorFattura />} />
        <Route path="/conformita" element={<ListaConformita />} />
        <Route path="/conformita/nuova" element={<EditorConformita />} />
        <Route path="/conformita/:id" element={<DettaglioConformita />} />
        <Route path="/conformita/:id/modifica" element={<EditorConformita />} />
        <Route path="/magazzino" element={<ListaMagazzino />} />
      </Routes>
    </BrowserRouter>
  )
}
