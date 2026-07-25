import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--azul-tom), var(--azul-tom-claro))',
          borderRadius: 24,
          padding: '32px 24px',
          color: '#fff',
          marginBottom: 24
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '4px 12px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700
          }}>
            Acesso exclusivo por convite
          </span>
          <h1 style={{ fontSize: 28, marginTop: 16, lineHeight: 1.25 }}>
            Controle total do seu dinheiro com a sua maquininha
          </h1>
          <p style={{ opacity: 0.85, marginTop: 12, fontSize: 15 }}>
            Pare de misturar o dinheiro pessoal com o da sua empresa.
          </p>
        </div>

        <button className="btn-primario" onClick={() => navigate('/login')}>
          Começar agora
        </button>
        <div style={{ height: 12 }} />
        <button className="btn-secundario" onClick={() => document.getElementById('como-funciona').scrollIntoView({ behavior: 'smooth' })}>
          Ver como funciona
        </button>

        <div id="como-funciona" style={{ marginTop: 40 }}>
          <div className="alerta">
            ❌ ERRO: Misturar dinheiro pessoal com o empresarial
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--verde-tom)' }}>
            <strong style={{ color: 'var(--verde-tom-escuro)' }}>✅ SOLUÇÃO</strong>
            <p style={{ margin: '8px 0 0' }}>Separar para crescer.</p>
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            'Quem separa, cresce.',
            'Seu dinheiro precisa de direção.',
            'Empresa não é extensão da sua casa.',
            'Você não precisa ganhar mais, precisa organizar.'
          ].map((frase) => (
            <p key={frase} className="frase-destaque" style={{ fontSize: 17 }}>{frase}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
