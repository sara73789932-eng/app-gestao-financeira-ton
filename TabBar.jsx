import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const itens = [
  { to: '/dashboard', label: 'Início', icone: '🏠' },
  { to: '/entradas', label: 'Entradas', icone: '➕' },
  { to: '/dividir', label: 'Dividir', icone: '🔀' },
  { to: '/relatorios', label: 'Relatórios', icone: '📊' },
  { to: '/assistente', label: 'IA', icone: '💬' }
]

export default function TabBar() {
  const { isAdmin } = useAuth()
  const lista = isAdmin ? [...itens, { to: '/admin', label: 'Admin', icone: '🛠️' }] : itens

  return (
    <nav className="tab-bar">
      {lista.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 'tab-item' + (isActive ? ' ativo' : '')}
        >
          <span style={{ fontSize: 18 }}>{item.icone}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
