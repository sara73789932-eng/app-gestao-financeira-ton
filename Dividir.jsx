import { useEffect, useState } from 'react'
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const categoriasPessoais = ['Conta de energia', 'Conta de água', 'Alimentação', 'Compras de casa', 'Gasolina', 'Aluguel pessoal', 'Escola / filhos', 'Lazer', 'Outros']
const categoriasEmpresa = ['Compra de produtos', 'Pagamento de funcionários', 'Marketing', 'Internet da empresa', 'Aluguel do ponto', 'Investimento no negócio', 'Caixa da empresa', 'Outros']

export default function Dividir() {
  const { perfil } = useAuth()
  const [entradas, setEntradas] = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [modo, setModo] = useState('percentual') // percentual | valor
  const [percentualPessoal, setPercentualPessoal] = useState(50)
  const [valorPessoal, setValorPessoal] = useState('')
  const [categoriaPessoal, setCategoriaPessoal] = useState(categoriasPessoais[0])
  const [categoriaEmpresa, setCategoriaEmpresa] = useState(categoriasEmpresa[0])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!perfil?.uid) return
    const q = query(collection(db, 'usuarios', perfil.uid, 'entradas'), where('dividido', '==', false))
    const unsub = onSnapshot(q, (snap) => setEntradas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [perfil?.uid])

  const total = selecionada?.valorLiquido || 0
  const pessoal = modo === 'percentual' ? (total * percentualPessoal) / 100 : parseFloat(valorPessoal.replace(',', '.')) || 0
  const empresarial = Math.max(total - pessoal, 0)

  async function confirmarDivisao() {
    if (!selecionada) return
    setSalvando(true)
    try {
      await addDoc(collection(db, 'usuarios', perfil.uid, 'gastos'), {
        grupo: 'pessoal', categoria: categoriaPessoal, valor: pessoal,
        data: selecionada.data, origemEntradaId: selecionada.id, criadoEm: serverTimestamp()
      })
      await addDoc(collection(db, 'usuarios', perfil.uid, 'gastos'), {
        grupo: 'empresarial', categoria: categoriaEmpresa, valor: empresarial,
        data: selecionada.data, origemEntradaId: selecionada.id, criadoEm: serverTimestamp()
      })
      await updateDoc(doc(db, 'usuarios', perfil.uid, 'entradas', selecionada.id), { dividido: true })
      setSelecionada(null)
      setValorPessoal('')
      setPercentualPessoal(50)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: 22 }}>Dividir meu dinheiro</h1>
      <div className="alerta">NÃO MISTURE! Isso trava seu crescimento.</div>

      {!selecionada && (
        <>
          <p style={{ color: 'var(--cinza-texto)', marginBottom: 12 }}>Escolha uma entrada para dividir:</p>
          {entradas.map((e) => (
            <button key={e.id} className="card" style={{ width: '100%', textAlign: 'left', background: '#fff' }}
              onClick={() => setSelecionada(e)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{formatoMoeda(e.valorLiquido)}</strong>
                <span style={{ fontSize: 12, color: 'var(--cinza-texto)' }}>{e.data}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--cinza-texto)' }}>{e.origem}</span>
            </button>
          ))}
          {entradas.length === 0 && <p style={{ color: 'var(--cinza-texto)' }}>Nenhuma entrada pendente de divisão. 🎉</p>}
        </>
      )}

      {selecionada && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--cinza-texto)' }}>Dividindo entrada de {selecionada.data}</p>
          <h2 style={{ marginBottom: 16 }}>{formatoMoeda(total)}</h2>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setModo('percentual')} className={modo === 'percentual' ? 'btn-primario' : 'btn-secundario'} style={{ flex: 1, padding: '10px' }}>%</button>
            <button onClick={() => setModo('valor')} className={modo === 'valor' ? 'btn-primario' : 'btn-secundario'} style={{ flex: 1, padding: '10px' }}>R$</button>
          </div>

          {modo === 'percentual' ? (
            <>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Pessoal: {percentualPessoal}% · Empresarial: {100 - percentualPessoal}%</label>
              <input type="range" min="0" max="100" value={percentualPessoal}
                onChange={(e) => setPercentualPessoal(Number(e.target.value))}
                style={{ width: '100%', margin: '10px 0 16px', accentColor: 'var(--verde-tom)' }} />
            </>
          ) : (
            <input className="input" inputMode="decimal" placeholder="Valor pessoal (R$)"
              value={valorPessoal} onChange={(e) => setValorPessoal(e.target.value)} />
          )}

          <label style={{ fontSize: 13, fontWeight: 600 }}>Categoria pessoal</label>
          <select className="input" value={categoriaPessoal} onChange={(e) => setCategoriaPessoal(e.target.value)}>
            {categoriasPessoais.map((c) => <option key={c}>{c}</option>)}
          </select>

          <label style={{ fontSize: 13, fontWeight: 600 }}>Categoria empresarial</label>
          <select className="input" value={categoriaEmpresa} onChange={(e) => setCategoriaEmpresa(e.target.value)}>
            {categoriasEmpresa.map((c) => <option key={c}>{c}</option>)}
          </select>

          <div className="card" style={{ background: 'var(--fundo)', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="tag-pessoal">👉 Esse dinheiro é da sua vida pessoal</span>
              <strong>{formatoMoeda(pessoal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span className="tag-empresa">👉 Esse dinheiro faz seu negócio crescer</span>
              <strong>{formatoMoeda(empresarial)}</strong>
            </div>
          </div>

          <button className="btn-primario" onClick={confirmarDivisao} disabled={salvando}>
            {salvando ? 'Dividindo…' : 'Confirmar divisão'}
          </button>
          <div style={{ height: 10 }} />
          <button className="btn-secundario" onClick={() => setSelecionada(null)}>Escolher outra entrada</button>
        </div>
      )}
    </div>
  )
}
