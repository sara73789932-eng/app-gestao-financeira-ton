import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const formatoMoeda = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const perguntasRapidas = [
  'Como estou gastando meu dinheiro?',
  'Estou misturando pessoal e empresa?',
  'Dica para crescer meu negócio',
  'Como economizar mais?'
]

export default function Assistente() {
  const { perfil } = useAuth()
  const [entradas, setEntradas] = useState([])
  const [gastos, setGastos] = useState([])
  const [pergunta, setPergunta] = useState('')
  const [mensagens, setMensagens] = useState([
    { autor: 'ia', texto: 'Olá! Sou seu assistente financeiro. Posso te ajudar a organizar melhor seu dinheiro. O que você quer saber?' }
  ])

  useEffect(() => {
    if (!perfil?.uid) return
    const unsub1 = onSnapshot(collection(db, 'usuarios', perfil.uid, 'entradas'), (snap) => setEntradas(snap.docs.map((d) => d.data())))
    const unsub2 = onSnapshot(collection(db, 'usuarios', perfil.uid, 'gastos'), (snap) => setGastos(snap.docs.map((d) => d.data())))
    return () => { unsub1(); unsub2() }
  }, [perfil?.uid])

  function gerarResposta(texto) {
    const totalRecebido = entradas.reduce((s, e) => s + Number(e.valorLiquido || 0), 0)
    const totalPessoal = gastos.filter((g) => g.grupo === 'pessoal').reduce((s, g) => s + Number(g.valor || 0), 0)
    const totalEmpresarial = gastos.filter((g) => g.grupo === 'empresarial').reduce((s, g) => s + Number(g.valor || 0), 0)
    const naoDivididas = entradas.filter((e) => !e.dividido).length
    const t = texto.toLowerCase()

    if (t.includes('mistur')) {
      return naoDivididas > 0
        ? `Você tem ${naoDivididas} entrada(s) que ainda não foram divididas entre pessoal e empresarial. Divida agora na aba "Dividir" para manter tudo claro.`
        : 'Boa notícia: todas as suas entradas já estão divididas entre pessoal e empresarial. Continue assim!'
    }
    if (t.includes('economiz')) {
      return totalPessoal > totalEmpresarial
        ? 'Seus gastos pessoais estão maiores que os empresariais. Revise categorias como lazer e compras de casa — pequenos cortes aí liberam caixa para o negócio.'
        : 'Seus gastos empresariais estão em foco. Avalie quais categorias trazem mais retorno antes de cortar — nem todo gasto empresarial é desperdício.'
    }
    if (t.includes('crescer') || t.includes('negóc') || t.includes('negoc')) {
      return 'Para crescer com saúde: separe sempre pessoal de empresarial, reserve uma parte do lucro real como caixa da empresa, e acompanhe o relatório mensal para identificar padrões.'
    }
    if (t.includes('gastando') || t.includes('gasto')) {
      return `Até agora você recebeu ${formatoMoeda(totalRecebido)}, sendo ${formatoMoeda(totalPessoal)} pessoal e ${formatoMoeda(totalEmpresarial)} empresarial. Seu lucro real é ${formatoMoeda(totalRecebido - totalPessoal - totalEmpresarial)}.`
    }
    return 'Posso te ajudar com dicas sobre organização financeira, separação pessoal/empresarial e onde economizar. Pergunte algo específico!'
  }

  function enviar(texto) {
    if (!texto.trim()) return
    setMensagens((m) => [...m, { autor: 'user', texto }, { autor: 'ia', texto: gerarResposta(texto) }])
    setPergunta('')
  }

  return (
    <div className="container" style={{ paddingTop: 28, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Assistente 💬</h1>
      <p style={{ color: 'var(--cinza-texto)', marginBottom: 16, fontSize: 13 }}>
        Assistente simulado com base nos seus dados. Pode ser conectado a uma IA real no backend.
      </p>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.autor === 'ia' ? 'flex-start' : 'flex-end',
            background: m.autor === 'ia' ? 'var(--fundo)' : 'var(--azul-tom)',
            color: m.autor === 'ia' ? 'var(--azul-tom)' : '#fff',
            padding: '10px 14px', borderRadius: 16, maxWidth: '80%', fontSize: 14
          }}>
            {m.texto}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {perguntasRapidas.map((p) => (
          <button key={p} onClick={() => enviar(p)} style={{
            background: '#fff', border: '1.5px solid #E1E7ED', borderRadius: 100,
            padding: '6px 12px', fontSize: 12
          }}>{p}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); enviar(pergunta) }} style={{ display: 'flex', gap: 8 }}>
        <input className="input" style={{ marginBottom: 0 }} placeholder="Perguntar para a IA…"
          value={pergunta} onChange={(e) => setPergunta(e.target.value)} />
        <button className="btn-primario" style={{ width: 'auto', padding: '0 20px' }} type="submit">➤</button>
      </form>
    </div>
  )
}
