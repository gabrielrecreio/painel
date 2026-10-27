import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { TV_REF_W, TV_REF_H } from '../../tvConstants'

// Ordem e cor de destaque de cada bloco (ids vêm da API do GB Frequência)
const GROUP_STYLES = {
  juvenil: { accent: '#ffb300', emoji: '🔥' },
  kids:    { accent: '#29b6f6', emoji: '⭐' },
  adulto:  { accent: '#e53935', emoji: '🥋' },
}

const BELT_COLORS = {
  White: '#f5f5f5', Grey: '#9e9e9e', Yellow: '#fdd835', Orange: '#fb8c00',
  Green: '#43a047', Blue: '#1e88e5', Purple: '#8e24aa', Brown: '#795548', Black: '#111111',
}

// Acima disso a lista do bloco rola sozinha em vez de crescer
const VISIBLE_ROWS = 6
const ROW_GAP = 6 // igual ao gap do .rk-track no CSS
const SCROLL_SPEED = 45 // px/s no canvas de 1080×1920
const SCROLL_PAUSE = 0.15 // fração do ciclo parada no topo

// "GreyWhite" / "YellowBlack" → cor base da faixa
function beltColor(belt) {
  if (!belt) return '#3a3a3a'
  const base = belt === 'White' || belt === 'Black' ? belt : belt.replace(/(White|Black)$/, '')
  return BELT_COLORS[base] || '#3a3a3a'
}

function initials(name) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function daysLeftInMonth(month) {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (month !== current) return null
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
}

function monthLabel(month) {
  const [y, m] = (month || '').split('-').map(Number)
  if (!y || !m) return ''
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
}

function Avatar({ entry }) {
  const [failed, setFailed] = useState(false)
  const src = entry.photoVersion && !failed
    ? `/api/ranking-photo?id=${entry.studentId}&v=${entry.photoVersion}`
    : null

  return (
    <span className="rk-avatar" style={{ '--belt': beltColor(entry.belt) }}>
      {src
        ? <img src={src} alt="" onError={() => setFailed(true)} />
        : <span className="rk-avatar-initials">{initials(entry.name)}</span>}
    </span>
  )
}

function RankingRow({ entry, entries, i, copy }) {
  const tied = entries.some(e => e !== entry && e.position === entry.position)
  return (
    <li
      className={`rk-row rk-pos-${Math.min(entry.position, 4)}`}
      style={{ '--i': Math.min(i, VISIBLE_ROWS) }}
      aria-hidden={copy || undefined}
    >
      <span className="rk-medal font-rajdhani">{entry.position}º</span>
      <Avatar entry={entry} />
      <span className="rk-name">
        <span className="rk-name-text">{entry.name}</span>
        {tied && <span className="rk-tie font-rajdhani">empate</span>}
      </span>
      <span className="rk-count">
        <b className="font-rajdhani">{entry.count}</b>
        <small className="font-rajdhani">{entry.count === 1 ? 'presença' : 'presenças'}</small>
      </span>
    </li>
  )
}

/**
 * Lista do bloco. Se passar de VISIBLE_ROWS, a lista é duplicada e rola em loop
 * (para no topo, desce até a cópia ficar no lugar da original e recomeça sem salto).
 */
function RankingList({ entries }) {
  const viewportRef = useRef(null)
  const [rowH, setRowH] = useState(0)
  const scrolling = entries.length > VISIBLE_ROWS

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el || !scrolling) return
    const measure = () => setRowH((el.offsetHeight - ROW_GAP * (VISIBLE_ROWS - 1)) / VISIBLE_ROWS)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [scrolling])

  const distance = entries.length * (rowH + ROW_GAP)
  const duration = distance / SCROLL_SPEED / (1 - SCROLL_PAUSE)

  return (
    <div ref={viewportRef} className={`rk-list ${scrolling ? 'is-scrolling' : ''}`}>
      <ol
        className="rk-track"
        style={scrolling && rowH > 0 ? { '--row-h': `${rowH}px`, '--scroll': `-${distance}px`, '--scroll-dur': `${duration}s` } : undefined}
      >
        {entries.map((entry, i) => (
          <RankingRow key={entry.studentId} entry={entry} entries={entries} i={i} />
        ))}
        {scrolling && entries.map((entry, i) => (
          <RankingRow key={`${entry.studentId}-copy`} entry={entry} entries={entries} i={entries.length + i} copy />
        ))}
      </ol>
    </div>
  )
}

function RankingBlock({ group, index }) {
  const style = GROUP_STYLES[group.id] || GROUP_STYLES.adulto
  // Bloco com mais linhas (empates) ganha mais altura até VISIBLE_ROWS; depois disso rola
  const grow = Math.min(Math.max(5, group.entries.length), VISIBLE_ROWS)

  return (
    <section className="rk-block" style={{ '--accent': style.accent, '--b': index, flexGrow: grow }}>
      <header className="rk-block-head">
        <span className="rk-block-emoji">{style.emoji}</span>
        <h2 className="rk-block-title font-rajdhani">{group.title}</h2>
        <span className="rk-block-sub font-rajdhani">Top 5 do mês</span>
      </header>

      {group.entries.length === 0 ? (
        <div className="rk-empty font-rajdhani">Ninguém pontuou ainda neste mês. Bora treinar! 💪</div>
      ) : (
        <RankingList entries={group.entries} />
      )}
    </section>
  )
}

/**
 * Tela cheia do ranking de presenças (verso da TV).
 * Desenhada em 1080×1920 e escalada para o tamanho real da tela.
 * `active` reinicia as animações de entrada a cada giro.
 */
export default function RankingScreen({ ranking, active }) {
  const rootRef = useRef(null)
  const [box, setBox] = useState({ scale: 1, left: 0, top: 0 })

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const scale = Math.min(el.offsetWidth / TV_REF_W, el.offsetHeight / TV_REF_H)
      setBox({
        scale,
        left: (el.offsetWidth - TV_REF_W * scale) / 2,
        top: (el.offsetHeight - TV_REF_H * scale) / 2,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const groups = ranking?.groups || []
  const daysLeft = daysLeftInMonth(ranking?.month)

  return (
    <div ref={rootRef} className={`rk-root ${active ? 'is-active' : ''}`}>
      <div
        className="rk-stage"
        style={{ width: TV_REF_W, height: TV_REF_H, transform: `translate(${box.left}px, ${box.top}px) scale(${box.scale})` }}
      >
        <header className="rk-header">
          <img src="/logo.jpg" alt="GB Marajoara" className="rk-logo" />
          <div className="rk-header-text">
            <p className="rk-kicker font-rajdhani">🏆 Ranking de presenças</p>
            <h1 className="rk-title font-rajdhani">{monthLabel(ranking?.month)}</h1>
          </div>
          {daysLeft !== null && (
            <div className="rk-countdown font-rajdhani">
              {daysLeft === 0
                ? <><b>Último</b><small>dia do mês!</small></>
                : <><b>{daysLeft}</b><small>{daysLeft === 1 ? 'dia restante' : 'dias restantes'}</small></>}
            </div>
          )}
        </header>

        <div className="rk-blocks">
          {groups.map((group, i) => <RankingBlock key={group.id} group={group} index={i} />)}
        </div>

        <footer className="rk-footer font-rajdhani">
          Cada aula confirmada no app conta 1 presença · Gracie Barra Marajoara
        </footer>
      </div>
    </div>
  )
}
