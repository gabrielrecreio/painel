import { useState } from 'react'

const DIAS_ORDER = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
  'Feriado',
]

function sortClasses(classes) {
  return [...classes].sort((a, b) => {
    const dayA = DIAS_ORDER.indexOf(a.dia_semana)
    const dayB = DIAS_ORDER.indexOf(b.dia_semana)
    if (dayA !== dayB) return dayA - dayB
    return a.horario_inicio.localeCompare(b.horario_inicio)
  })
}

export default function ClassList({ classes, loading, onDelete }) {
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-40">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-gb-red" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gb-muted text-sm">Carregando aulas...</span>
        </div>
      </div>
    )
  }

  const sorted = sortClasses(classes)

  // Group by day
  const grouped = DIAS_ORDER.reduce((acc, day) => {
    const items = sorted.filter((c) => c.dia_semana === day)
    if (items.length > 0) acc[day] = items
    return acc
  }, {})

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="glass-card p-5 flex flex-col items-center justify-center h-40 gap-3">
        <svg className="h-10 w-10 text-gb-charcoal-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gb-muted text-sm">Nenhuma aula cadastrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-rajdhani font-semibold text-lg text-white tracking-wide flex items-center gap-2">
          <span className="w-1 h-5 bg-gb-red rounded-full inline-block"></span>
          Aulas Cadastradas
        </h3>
        <span className="text-xs bg-gb-charcoal-3 text-gb-muted px-2 py-1 rounded-full">
          {classes.length} {classes.length === 1 ? 'aula' : 'aulas'}
        </span>
      </div>

      <div className="overflow-auto max-h-[500px]">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div className="px-4 py-2 bg-gb-charcoal-3/60 text-xs font-semibold text-gb-red uppercase tracking-widest border-b border-white/5">
              {day}
            </div>
            <table className="gb-table">
              <thead>
                <tr>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Turma</th>
                  <th>Professor</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="animate-fadeIn">
                    <td className="font-mono text-white">{c.horario_inicio.slice(0, 5)}</td>
                    <td className="font-mono text-gb-muted">{c.horario_fim.slice(0, 5)}</td>
                    <td className="text-white">{c.turma}</td>
                    <td>{c.professor}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="btn-danger"
                      >
                        {deletingId === c.id ? '...' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
