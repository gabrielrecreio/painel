import { useState, useEffect } from 'react'

/**
 * Testa a conexão com o GB Frequência pela mesma rota que a TV usa.
 * A TV só gira quando o ranking carrega, então isso mostra por que ela não girou.
 */
function useRankingStatus() {
  const [status, setStatus] = useState({ state: 'loading' })

  useEffect(() => {
    fetch('/api/ranking')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        const students = data.groups?.reduce((sum, g) => sum + g.entries.length, 0) || 0
        setStatus({ state: 'ok', students })
      })
      .catch((err) => setStatus({ state: 'error', message: err.message }))
  }, [])

  return status
}

/**
 * Configuração do ranking de presenças exibido na TV.
 * Salvo em `settings.ranking_config`; a TV aplica na hora via realtime.
 */
export default function RankingSettings({ config, onSave, saving }) {
  const [form, setForm] = useState(config)
  const status = useRankingStatus()

  const clamp = (val, min, max, fallback) => Math.max(min, Math.min(max, parseInt(val, 10) || fallback))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      enabled: form.enabled,
      intervalMinutes: clamp(form.intervalMinutes, 1, 120, 5),
      displaySeconds: clamp(form.displaySeconds, 10, 600, 90),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h3 className="font-rajdhani font-bold text-lg text-white tracking-wide">🏆 Ranking de presenças do mês</h3>
        <p className="text-xs text-gb-muted mt-1">
          A tela da TV gira e mostra o top 5 de GBK Juvenil, GBK Kids e adultos (GB1 + GB2 + GB3), com dados do GB Frequência.
          Presenças confirmadas no app aparecem no ranking em cerca de 1 minuto.
        </p>
      </div>

      <div
        className="rounded-lg px-4 py-3 text-sm border"
        style={{
          borderColor: status.state === 'ok' ? '#2e7d32' : status.state === 'error' ? '#c62828' : '#3a3a3a',
          background: status.state === 'ok' ? 'rgba(46,125,50,0.12)' : status.state === 'error' ? 'rgba(198,40,40,0.12)' : 'transparent',
        }}
      >
        {status.state === 'loading' && <span className="text-gb-muted">Testando conexão com o GB Frequência...</span>}
        {status.state === 'ok' && (
          <span className="text-green-300">
            ✓ Conectado ao GB Frequência · {status.students} {status.students === 1 ? 'aluno' : 'alunos'} no ranking deste mês
            {status.students === 0 && ' (a TV só gira quando houver alguém no ranking)'}
          </span>
        )}
        {status.state === 'error' && (
          <span className="text-red-300">
            ✗ Sem conexão com o GB Frequência: {status.message}. Enquanto isso a TV não gira.
          </span>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          className="h-5 w-5 accent-red-600"
        />
        <span className="text-sm text-white font-medium">Exibir ranking na TV</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gb-muted font-medium">Girar a tela a cada (minutos)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={form.intervalMinutes}
            onChange={(e) => setForm({ ...form, intervalMinutes: e.target.value })}
            className="gb-input"
            disabled={!form.enabled}
          />
          <span className="text-xs text-gb-charcoal-4">Tempo na tela normal antes de mostrar o ranking.</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gb-muted font-medium">Ranking fica na tela por (segundos)</span>
          <input
            type="number"
            min={10}
            max={600}
            value={form.displaySeconds}
            onChange={(e) => setForm({ ...form, displaySeconds: e.target.value })}
            className="gb-input"
            disabled={!form.enabled}
          />
          <span className="text-xs text-gb-charcoal-4">Depois disso a tela gira de volta.</span>
        </label>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" className="btn-primary px-5 py-2" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <a
          href="/tv?ranking=1"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost px-4 py-2 text-sm"
        >
          Pré-visualizar ranking
        </a>
      </div>
    </form>
  )
}
