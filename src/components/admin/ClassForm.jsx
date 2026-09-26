import { useState } from 'react'

const DIAS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
  'Feriado',
]

const TURMAS = [
  'Infantil',
  'Juvenil',
  'Adulto Iniciante',
  'Adulto Intermediário',
  'Adulto Avançado',
  'Adulto todos os níveis',
  'Master',
  'Feminino',
  'Nogi adultos',
  'Nogi juvenil',
  'Open mat',
]

const emptyForm = {
  dia_semana: '',
  horario_inicio: '',
  horario_fim: '',
  turma: '',
  professor: '',
}

export default function ClassForm({ onAdd }) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.dia_semana || !form.horario_inicio || !form.horario_fim || !form.turma || !form.professor) return
    setSubmitting(true)
    try {
      await onAdd(form)
      setForm(emptyForm)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4">
      <h3 className="font-rajdhani font-semibold text-lg text-white tracking-wide flex items-center gap-2">
        <span className="w-1 h-5 bg-gb-red rounded-full inline-block"></span>
        Nova Aula
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dia da Semana */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gb-muted font-medium uppercase tracking-wider">
            Dia da Semana
          </label>
          <select
            name="dia_semana"
            value={form.dia_semana}
            onChange={handleChange}
            className="gb-input"
            required
          >
            <option value="">Selecione...</option>
            {DIAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Turma */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gb-muted font-medium uppercase tracking-wider">
            Turma
          </label>
          <select
            name="turma"
            value={form.turma}
            onChange={handleChange}
            className="gb-input"
            required
          >
            <option value="">Selecione...</option>
            {TURMAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Horário Início */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gb-muted font-medium uppercase tracking-wider">
            Horário de Início
          </label>
          <input
            type="time"
            name="horario_inicio"
            value={form.horario_inicio}
            onChange={handleChange}
            className="gb-input"
            required
          />
        </div>

        {/* Horário Fim */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gb-muted font-medium uppercase tracking-wider">
            Horário de Fim
          </label>
          <input
            type="time"
            name="horario_fim"
            value={form.horario_fim}
            onChange={handleChange}
            className="gb-input"
            required
          />
        </div>

        {/* Professor */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-gb-muted font-medium uppercase tracking-wider">
            Professor
          </label>
          <input
            type="text"
            name="professor"
            value={form.professor}
            onChange={handleChange}
            placeholder="Nome do professor..."
            className="gb-input"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary self-end flex items-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Aula
          </>
        )}
      </button>
    </form>
  )
}
