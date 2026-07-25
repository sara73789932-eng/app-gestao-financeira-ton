import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Dashboard() {
  const { perfil } = useAuth()
  const [entradas, setEntradas] = useState([])
  const [gastos, setGastos] = useState([])

  useEffect(() => {
    if (!perfil?.uid) return
    const unsub1 = onSnapshot(collection(db, 'usuarios', perfil.uid, 'entradas'), (snap) => {
      setEntradas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsub2 = onSnapshot(collection(db, 'usuarios', perfil.uid, 'gastos'), (snap) => {
      setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2() }
  }, [perfil?.uid])

  const totalRecebido = entradas.reduce((s, e) => s + (Number(e.valorLiquido) || 0), 0)
  const totalPessoal = gastos.filter((g) => g.grupo === 'pessoal').reduce((s, g) => s + Number(g.valor || 0), 0)
  const totalEmpresarial = gastos.filter((g) => g.grupo === 'empresarial').reduce((s, g) => s + Number(g.valor || 0), 0)
  const lucroReal = totalRecebido - totalPessoal - totalEmpresarial
  const naoDivididas = entradas.filter((e) => !e.dividido).length

  const dadosGrafico = [
    { name: 'Pessoal', value: totalPessoal, cor: '#1651B8' },
    { name: 'Empresarial', value: totalEmpresarial, cor: '#00A855' },
    { name: 'Não dividido', value: Math.max(totalRecebido - totalPessoal - totalEmpresarial, 0), cor: '#D9E2EC' }
  ]

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: 22 }}>Olá, {perfil?.nome?.split(' ')[0] || 'empreendedor'} 👋</h1>
      <p style={{ color: 'var(--cinza-texto)', marginBottom: 20 }}>Aqui está a clareza que você precisa hoje.</p>

      {totalPessoal + totalEmpresarial > totalRecebido && totalRecebido > 0 && (
        <div className="alerta">⚠️ Você está gastando mais do que ganha.</div>
      )}
      {naoDivididas > 0 && (
        <div className="alerta">⚠️ Você tem {naoDivididas} entrada(s) ainda não dividida(s). Não misture!</div>
      )}

      <div className="card">
        <span style={{ fontSize: 13, color: 'var(--cinza-texto)', fontWeight: 600 }}>TOTAL RECEBIDO</span>
        <h2 style={{ fontSize: 30, marginTop: 4 }}>{formatoMoeda(totalRecebido)}</h2>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, marginBottom: 0 }}>
          <span className="tag-pessoal">Pessoal</span>
          <h3 style={{ fontSize: 18, marginTop: 8 }}>{formatoMoeda(totalPessoal)}</h3>
        </div>
        <div className="card" style={{ flex: 1, marginBottom: 0 }}>
          <span className="tag-empresa">Empresarial</span>
          <h3 style={{ fontSize: 18, marginTop: 8 }}>{formatoMoeda(totalEmpresarial)}</h3>
        </div>
      </div>

      <div className="card">
        <span style={{ fontSize: 13, color: 'var(--cinza-texto)', fontWeight: 600 }}>LUCRO REAL</span>
        <h2 style={{ fontSize: 26, marginTop: 4, color: lucroReal >= 0 ? 'var(--verde-tom-escuro)' : 'var(--vermelho-alerta)' }}>
          {formatoMoeda(lucroReal)}
        </h2>
      </div>

      {totalRecebido > 0 && (
        <div className="card">
          <span style={{ fontSize: 13, color: 'var(--cinza-texto)', fontWeight: 600 }}>PARA ONDE FOI SEU DINHEIRO</span>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dadosGrafico} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                  {dadosGrafico.map((d, i) => <Cell key={i} fill={d.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => formatoMoeda(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="frase-destaque" style={{ fontSize: 15, textAlign: 'center', marginTop: 24 }}>
        "Quem separa, cresce."
      </p>
    </div>
  )
}
