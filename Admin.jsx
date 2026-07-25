import { useEffect, useState } from 'react'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut as signOutSecundario } from 'firebase/auth'
import { collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import app, { db } from '../firebase'

export default function Admin() {
  const [usuarios, setUsuarios] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'usuarios'), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  async function criarUsuario(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setCriando(true)

    // Usa uma instância secundária do Firebase App para criar o login
    // sem derrubar a sessão do admin atual.
    const appSecundario = initializeApp(app.options, 'admin-criacao-' + Date.now())
    const authSecundario = getAuth(appSecundario)

    try {
      const cred = await createUserWithEmailAndPassword(authSecundario, email, senha)
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        nome,
        email,
        role: 'user',
        status: 'ativo',
        deviceId: null,
        criadoEm: serverTimestamp()
      })
      await signOutSecundario(authSecundario)
      setSucesso(`Acesso criado para ${nome}.`)
      setNome(''); setEmail(''); setSenha('')
    } catch (err) {
      setErro('Não foi possível criar o acesso. Verifique se o e-mail já está em uso e se a senha tem 6+ caracteres.')
    } finally {
      await deleteApp(appSecundario)
      setCriando(false)
    }
  }

  async function alterarStatus(uid, novoStatus) {
    await updateDoc(doc(db, 'usuarios', uid), { status: novoStatus })
  }

  async function liberarNovoDispositivo(uid) {
    await updateDoc(doc(db, 'usuarios', uid), { deviceId: null })
  }

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Painel Admin</h1>
      <p style={{ color: 'var(--cinza-texto)', marginBottom: 20 }}>Cadastro é 100% restrito — só você libera o acesso.</p>

      <form className="card" onSubmit={criarUsuario}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Criar usuário</h3>
        {erro && <div className="alerta">{erro}</div>}
        {sucesso && <div className="alerta" style={{ background: '#E3FBEF', border: '1.5px solid #B7F0D0', color: '#0A7B41' }}>{sucesso}</div>}
        <input className="input" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Senha (mín. 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        <button className="btn-primario" type="submit" disabled={criando}>
          {criando ? 'Criando…' : 'Criar acesso'}
        </button>
      </form>

      <h3 style={{ fontSize: 16, margin: '20px 0 10px' }}>Usuários ({usuarios.length})</h3>
      {usuarios.map((u) => (
        <div key={u.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{u.nome}</strong>
              <div style={{ fontSize: 13, color: 'var(--cinza-texto)' }}>{u.email}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                <span style={{
                  color: u.status === 'ativo' ? 'var(--verde-tom-escuro)' : 'var(--vermelho-alerta)',
                  fontWeight: 700
                }}>
                  {u.status === 'ativo' ? '● Ativo' : '● Bloqueado'}
                </span>
                {u.deviceId && <span style={{ marginLeft: 10, color: 'var(--cinza-texto)' }}>· dispositivo vinculado</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {u.status === 'ativo' ? (
              <button className="btn-perigo" onClick={() => alterarStatus(u.id, 'bloqueado')}>❌ Bloquear</button>
            ) : (
              <button className="btn-primario" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => alterarStatus(u.id, 'ativo')}>✅ Liberar acesso</button>
            )}
            {u.deviceId && (
              <button className="btn-secundario" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => liberarNovoDispositivo(u.id)}>
                Liberar novo dispositivo
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
