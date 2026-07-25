import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function inicioSemana() {
  const d = new Date()
  const dia = d.getDay()
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d
}
function inicioMes() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Relatorios() {
  const { perfil } = useAuth()
  const [entradas, setEntradas] = useState([])
  const [gastos, setGastos] = useState([])
  const [periodo, setPeriodo] = useState('mensal')

  useEffect(() => {
    if (!perfil?.uid) return
    const unsub1 = onSnapshot(collection(db, 'usuarios', perfil.uid, 'entradas'), (snap) => setEntradas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const unsub2 = onSnapshot(collection(db, 'usuarios', perfil.uid, 'gastos'), (snap) => setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2() }
  }, [perfil?.uid])

  const limite = periodo === 'semanal' ? inicioSemana() : inicioMes()
  const dentro = (dataStr) => dataStr && new Date(dataStr) >= limite

  const entradasPeriodo = entradas.filter((e) => dentro(e.data))
  const gastosPeriodo = gastos.filter((g) => dentro(g.data))

  const totalEntradas = entradasPeriodo.reduce((s, e) => s + Number(e.valorLiquido || 0), 0)
  const totalSaidas = gastosPeriodo.reduce((s, g) => s + Number(g.valor || 0), 0)
  const lucro = totalEntradas - totalSaidas

  function baixarPdf() {
    const janela = window.open('', '_blank')
    const linhas = gastosPeriodo.map((g) => `<tr><td>${g.data}</td><td>${g.grupo}</td><td>${g.categoria}</td><td>${formatoMoeda(g.valor)}</td></tr>`).join('')
    janela.document.write(`
      <html><head><title>Relatório ${periodo}</title>
      <style>body{font-family:sans-serif;padding:24px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ddd;padding:8px;font-size:13px} h1{color:#0A2540}</style>
      </head><body>
      <h1>Relatório ${periodo === 'semanal' ? 'Semanal' : 'Mensal'}</h1>
      <p><strong>Total recebido:</strong> ${formatoMoeda(totalEntradas)}</p>
      <p><strong>Total gasto:</strong> ${formatoMoeda(totalSaidas)}</p>
      <p><strong>Lucro real:</strong> ${formatoMoeda(lucro)}</p>
      <h3>Movimentações</h3>
      <table><thead><tr><th>Data</th><th>Grupo</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>${linhas}</tbody></table>
      </body></html>
    `)
    janela.document.close()
    janela.print()
  }

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Relatórios</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setPeriodo('semanal')} className={periodo === 'semanal' ? 'btn-primario' : 'btn-secundario'} style={{ flex: 1, padding: 10 }}>Semanal</button>
        <button onClick={() => setPeriodo('mensal')} className={periodo === 'mensal' ? 'btn-primario' : 'btn-secundario'} style={{ flex: 1, padding: 10 }}>Mensal</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Entradas</span><strong style={{ color: 'var(--verde-tom-escuro)' }}>{formatoMoeda(totalEntradas)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Saídas</span><strong style={{ color: 'var(--vermelho-alerta)' }}>{formatoMoeda(totalSaidas)}</strong>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #E1E7ED' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span>Lucro</span><strong>{formatoMoeda(lucro)}</strong>
        </div>
      </div>

      <button className="btn-primario" onClick={baixarPdf}>📥 Baixar PDF</button>

      <h3 style={{ fontSize: 16, margin: '20px 0 10px' }}>Movimentações do período</h3>
      {gastosPeriodo.map((g) => (
        <div key={g.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className={g.grupo === 'pessoal' ? 'tag-pessoal' : 'tag-empresa'}>{g.categoria}</span>
            <strong>{formatoMoeda(g.valor)}</strong>
          </div>
        </div>
      ))}
      {gastosPeriodo.length === 0 && <p style={{ color: 'var(--cinza-texto)' }}>Nenhuma movimentação neste período.</p>}
    </div>
  )
}
