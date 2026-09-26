import { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'

const DIAS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

/**
 * Converts "HH:MM:SS" or "HH:MM" to total minutes since midnight.
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * Returns status for a class.
 * @param {string} inicio - horario_inicio
 * @param {string} fim    - horario_fim
 * @param {number} nowMinutes - current time in minutes since midnight
 * @param {boolean} isNext - true if this is the very next upcoming class
 */
function getStatus(inicio, fim, nowMinutes, isNext) {
  const startMin = timeToMinutes(inicio)
  const endMin   = timeToMinutes(fim)

  // ── Em andamento ──────────────────────────────────────────
  if (nowMinutes >= startMin && nowMinutes < endMin) {
    return { label: 'EM ANDAMENTO', type: 'andamento' }
  }

  // ── Aula já terminou ──────────────────────────────────────
  if (nowMinutes >= endMin) {
    return { label: 'FINALIZADA', type: 'finalizada' }
  }

  // ── Aula ainda não começou ────────────────────────────────
  const diff = startMin - nowMinutes

  if (isNext) {
    // Próxima aula: FALTAM X MIN (≤ 59) ou A SEGUIR (> 59)
    if (diff <= 59) {
      return { label: `FALTAM ${diff} MIN`, type: 'faltam' }
    }
    return { label: 'A SEGUIR', type: 'aseguir' }
  }

  // Demais aulas futuras → EM BREVE
  return { label: 'EM BREVE', type: 'embreve' }
}

export default function ScheduleTable({ classes }) {
  const [now, setNow] = useState(new Date())
  const { settings } = useSettings()

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000) // update every 30s
    return () => clearInterval(interval)
  }, [])

  const todayName   = DIAS[now.getDay()]
  const nowMinutes  = now.getHours() * 60 + now.getMinutes()

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;

  const holidayDate = settings.holiday_date || ''
  const effectiveDay = holidayDate === todayDateStr ? 'Feriado' : todayName

  const todayClasses = classes
    .filter((c) => c.dia_semana === effectiveDay)
    .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))

  // Find the earliest upcoming start time (next slot)
  const nextStartTime = todayClasses
    .map((c) => timeToMinutes(c.horario_inicio))
    .filter((t) => t > nowMinutes)
    .sort((a, b) => a - b)[0]

  // All classes that share that same start time are "next"
  const isNextClass = (c) =>
    nextStartTime !== undefined &&
    timeToMinutes(c.horario_inicio) === nextStartTime

  if (todayClasses.length === 0) {
    return (
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-1 rounded-full bg-gb-red" style={{ height: 'clamp(1rem, 2.5vh, 1.5rem)' }} />
          <h2
            className="font-rajdhani font-bold text-white uppercase tracking-widest"
            style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)' }}
          >
            Aulas de Hoje — {effectiveDay === 'Feriado' ? `Feriado (${day}/${month})` : todayName}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gb-muted font-inter"
          style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)' }}>
          Não há aulas programadas para hoje.
        </div>
      </div>
    )
  }

  // Calcula tamanhos dinâmicos com base na quantidade de aulas
  // Quanto mais aulas, menor o tamanho de fonte e padding para caber tudo sem scroll
  const count = todayClasses.length
  const scale = count <= 3 ? 1 : count <= 4 ? 0.90 : count <= 5 ? 0.82 : count <= 6 ? 0.73 : 0.64

  const fs = {
    th:      `${scale * 1.2}rem`,
    time:    `${scale * 1.45}rem`,
    cell:    `${scale * 1.3}rem`,
    badge:   `${scale * 0.88}rem`,
  }
  const pad = {
    th:   `${scale * 10}px ${scale * 16}px`,
    td:   `${scale * 9}px ${scale * 12}px`,
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-1 rounded-full bg-gb-red" style={{ height: 'clamp(0.8rem, 2vh, 1.3rem)' }} />
        <h2
          className="font-rajdhani font-bold text-white uppercase tracking-widest"
          style={{ fontSize: `clamp(0.85rem, ${scale * 2}vw, ${scale * 1.5}rem)` }}
        >
          Aulas de Hoje — {effectiveDay === 'Feriado' ? `Feriado (${day}/${month})` : todayName}
        </h2>
      </div>

      {/* Table — sem overflow/scroll, linhas se ajustam dinamicamente */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/5 overflow-hidden">
        <table className="gb-table tv-table w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[#111111]">
            <tr>
              <th style={{ fontSize: fs.th, padding: pad.th, width: '28%' }}>Horário</th>
              <th style={{ fontSize: fs.th, padding: pad.th, width: '28%' }}>Turma</th>
              <th style={{ fontSize: fs.th, padding: pad.th, width: '28%' }}>Professor</th>
              <th style={{ fontSize: fs.th, padding: pad.th, width: '16%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {todayClasses.map((c) => {
              const isNext     = isNextClass(c)
              const status     = getStatus(c.horario_inicio, c.horario_fim, nowMinutes, isNext)
              const isActive   = status.type === 'andamento'
              const isFinished = status.type === 'finalizada'
              const isAseguir  = status.type === 'aseguir'
              const useMarquee = isActive || isAseguir

              return (
                <tr
                  key={c.id}
                  className={
                    isActive  ? 'tv-row-andamento' :
                    isAseguir ? 'tv-row-aseguir'   : ''
                  }
                  style={{
                    background: isFinished ? 'rgba(0,0,0,0.2)' : undefined,
                    borderLeft: (!isActive && !isAseguir) ? '3px solid transparent' : undefined,
                    opacity:    isFinished ? 0.4 : 1,
                  }}
                >
                  {/* Horário */}
                  <td style={{ fontSize: fs.time, padding: pad.td, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    <span className="font-mono font-bold text-white">
                      {c.horario_inicio.slice(0, 5)}
                    </span>
                    <span className="text-gb-muted mx-1">–</span>
                    <span className="font-mono text-gb-muted">
                      {c.horario_fim.slice(0, 5)}
                    </span>
                  </td>

                  {/* Turma */}
                  <td style={{ fontSize: fs.cell, padding: pad.td, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {useMarquee ? (
                      <span className="tv-marquee-wrap">
                        <span className="tv-marquee-text font-inter font-semibold text-white">
                          {c.turma}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{c.turma}
                        </span>
                      </span>
                    ) : (
                      <span className="font-inter font-semibold text-white">{c.turma}</span>
                    )}
                  </td>

                  {/* Professor */}
                  <td style={{ fontSize: fs.cell, padding: pad.td, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {useMarquee ? (
                      <span className="tv-marquee-wrap">
                        <span className="tv-marquee-text text-gb-muted font-inter">
                          {c.professor}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{c.professor}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gb-muted font-inter">{c.professor}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: pad.td, overflow: 'hidden' }}>
                    {status.label && (
                      <span
                        className={`
                          inline-block rounded-md font-rajdhani font-bold uppercase tracking-wider
                          ${status.type === 'andamento'  ? 'badge-andamento'  : ''}
                          ${status.type === 'faltam'     ? 'badge-faltam'     : ''}
                          ${status.type === 'finalizada' ? 'badge-finalizada' : ''}
                          ${status.type === 'aseguir'    ? 'badge-aseguir'    : ''}
                          ${status.type === 'embreve'    ? 'badge-embreve'    : ''}
                        `}
                        style={{ fontSize: fs.badge, padding: `${scale * 3}px ${scale * 6}px` }}
                      >
                        {status.label}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
