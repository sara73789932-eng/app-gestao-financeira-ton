import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { login, erroAcesso } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
      navigate('/dashboard')
    } catch (err) {
      setErro('E-mail ou senha inválidos, ou seu acesso ainda não foi liberado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="container" style={{ paddingTop: 56 }}>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Entrar</h1>
        <p style={{ color: 'var(--cinza-texto)', marginBottom: 24 }}>
          Acesso exclusivo para clientes com convite liberado.
        </p>

        {(erro || erroAcesso) && (
          <div className="alerta">{erro || erroAcesso}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <button className="btn-primario" type="submit" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 20, textAlign: 'center' }}>
          Não tem acesso? Fale com o administrador para receber seu convite.
          <br />Seu acesso é individual e intransferível.
        </p>
      </div>
    </div>
  )
}
