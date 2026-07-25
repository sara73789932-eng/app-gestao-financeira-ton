import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Entradas from './pages/Entradas'
import Dividir from './pages/Dividir'
import Relatorios from './pages/Relatorios'
import Assistente from './pages/Assistente'
import Admin from './pages/Admin'
import TabBar from './components/TabBar'

function Privada({ children, adminOnly = false }) {
  const { firebaseUser, perfil, isAdmin, loading } = useAuth()

  if (loading) return <div className="app-shell"><div className="container">Carregando…</div></div>
  if (!firebaseUser || !perfil) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="app-shell">
      {children}
      <TabBar />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Privada><Dashboard /></Privada>} />
      <Route path="/entradas" element={<Privada><Entradas /></Privada>} />
      <Route path="/dividir" element={<Privada><Dividir /></Privada>} />
      <Route path="/relatorios" element={<Privada><Relatorios /></Privada>} />
      <Route path="/assistente" element={<Privada><Assistente /></Privada>} />
      <Route path="/admin" element={<Privada adminOnly><Admin /></Privada>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
