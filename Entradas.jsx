import { useEffect, useState } from 'react'
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Entradas() {
  const { perfil } = useAuth()
  const [valorBruto, setValorBruto] = useState('')
  const [origem, setOrigem] = useState('maquininha')
  const [taxa, setTaxa] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [lista, setLista] = useState([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!perfil?.uid) return
    const q = query(collection(db, 'usuarios', perfil.uid, 'entradas'), orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => setLista(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [perfil?.uid])

  const bruto = parseFloat(valorBruto.replace(',', '.')) || 0
  const taxaPct = parseFloat(taxa.replace(',', '.')) || 0
  const liquido = bruto - (bruto * taxaPct) / 100

  async function salvar(e) {
    e.preventDefault()
    if (!bruto) return
    setSalvando(true)
    try {
      await addDoc(collection(db, 'usuarios', perfil.uid, 'entradas'), {
        valorBruto: bruto,
        taxaPercentual: taxaPct,
        valorLiquido: liquido,
        origem,
        data,
        dividido: false,
        criadoEm: serverTimestamp()
      })
      setValorBruto('')
      setTaxa('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Nova entrada</h1>
      <p style={{ color: 'var(--cinza-texto)', marginBottom: 20 }}>Registre tudo que entrar, antes de gastar qualquer centavo.</p>

      <form className="card" onSubmit={salvar}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Valor bruto</label>
        <input className="input" inputMode="decimal" placeholder="R$ 0,00" value={valorBruto}
          onChange={(e) => setValorBruto(e.target.value)} required />

        <label style={{ fontSize: 13, fontWeight: 600 }}>Origem</label>
        <select className="input" value={origem} onChange={(e) => setOrigem(e.target.value)}>
          <option value="maquininha">Maquininha</option>
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
        </select>

        <label style={{ fontSize: 13, fontWeight: 600 }}>Taxa (%)</label>
        <input className="input" inputMode="decimal" placeholder="Ex: 2,5" value={taxa}
          onChange={(e) => setTaxa(e.target.value)} />

        <label style={{ fontSize: 13, fontWeight: 600 }}>Data</label>
        <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />

        <div className="card" style={{ background: 'var(--fundo)', boxShadow: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>Valor bruto</span><strong>{formatoMoeda(bruto)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--vermelho-alerta)' }}>
            <span>Taxa ({taxaPct || 0}%)</span><strong>- {formatoMoeda((bruto * taxaPct) / 100)}</strong>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #E1E7ED', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
            <span>Valor líquido</span><strong style={{ color: 'var(--verde-tom-escuro)' }}>{formatoMoeda(liquido)}</strong>
          </div>
        </div>

        <button className="btn-primario" type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : '✅ Salvar entrada'}
        </button>
      </form>

      <h3 style={{ fontSize: 16, margin: '20px 0 10px' }}>Últimas entradas</h3>
      {lista.map((item) => (
        <div key={item.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>{formatoMoeda(item.valorLiquido)}</span>
            <span style={{ fontSize: 12, color: 'var(--cinza-texto)' }}>{item.data}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--cinza-texto)', marginTop: 4 }}>
            {item.origem} · taxa {item.taxaPercentual}%
            {!item.dividido && <span style={{ color: 'var(--vermelho-alerta)', marginLeft: 8, fontWeight: 700 }}>· não dividido</span>}
          </div>
        </div>
      ))}
      {lista.length === 0 && <p style={{ color: 'var(--cinza-texto)' }}>Nenhuma entrada registrada ainda.</p>}
    </div>
  )
}
