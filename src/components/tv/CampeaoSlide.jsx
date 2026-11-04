import { useState, useEffect, useRef } from 'react'
import { GROUP_STYLES, beltColor, initials, monthLabel } from './RankingScreen'

// Desenhado no tamanho de referência do banner e escalado para a área real
const STAGE_W = 1080
const STAGE_H = 380
const MAX_CARDS = 4

function ChampionPhoto({ champion, size }) {
  const [failed, setFailed] = useState(false)
  const src = champion.photoVersion && !failed
    ? `/api/ranking-photo?id=${champion.studentId}&v=${champion.photoVersion}`
    : null

  return (
    <span className="cp-photo" style={{ width: size, height: size, '--belt': beltColor(champion.belt) }}>
      {src
        ? <img src={src} alt="" onError={() => setFailed(true)} />
        : <span className="cp-photo-initials font-rajdhani" style={{ fontSize: size * 0.36 }}>{initials(champion.name)}</span>}
      <span className="cp-crown" style={{ fontSize: size * 0.24 }}>👑</span>
    </span>
  )
}

function presencas(count) {
  return `${count} ${count === 1 ? 'presença' : 'presenças'}`
}

/**
 * Slide de parabéns ao 1º lugar de presenças do mês anterior de um programa.
 * Com empate no 1º lugar, mostra todos lado a lado (até MAX_CARDS).
 */
export default function CampeaoSlide({ banner, active }) {
  const rootRef = useRef(null)
  const [box, setBox] = useState({ scale: 1, w: STAGE_W, h: STAGE_H })

  // Escala para caber o tamanho de referência e estica o palco para preencher a área toda
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      if (!el.offsetWidth || !el.offsetHeight) return
      const scale = Math.min(el.offsetWidth / STAGE_W, el.offsetHeight / STAGE_H)
      setBox({ scale, w: el.offsetWidth / scale, h: el.offsetHeight / scale })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { group, champions, month } = banner
  const accent = (GROUP_STYLES[group.id] || GROUP_STYLES.adulto).accent
  const shown = champions.slice(0, MAX_CARDS)
  const extra = champions.length - shown.length
  const single = champions.length === 1
  // Foto cresce quando a área do banner é mais alta que 1080×380
  const photoSize = Math.min(380, box.h * 0.66, box.w * 0.3)
  const cardSize = Math.min(shown.length > 3 ? 170 : 210, (box.h - 150) * 0.6)

  return (
    <div
      ref={rootRef}
      className="banner-slide cp-root absolute inset-0 w-full h-full transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
    >
      <div
        className={`cp-stage ${active ? 'is-active' : ''}`}
        style={{ width: box.w, height: box.h, '--accent': accent, transform: `scale(${box.scale})` }}
      >
        {single ? (
          <div className="cp-single">
            <ChampionPhoto champion={champions[0]} size={photoSize} />
            <div className="cp-single-text">
              <p className="cp-kicker font-rajdhani">🏆 Campeão de presenças de {monthLabel(month)}</p>
              <h2 className="cp-name font-rajdhani">{champions[0].name}</h2>
              <div className="cp-tags">
                <span className="cp-program font-rajdhani">{group.title}</span>
                <span className="cp-count font-rajdhani">{presencas(champions[0].count)}</span>
              </div>
              <p className="cp-congrats font-rajdhani">Parabéns! 👏</p>
            </div>
          </div>
        ) : (
          <div className="cp-multi">
            <header className="cp-multi-head">
              <p className="cp-kicker font-rajdhani">🏆 Campeões de presenças de {monthLabel(month)} · empate no 1º lugar</p>
              <div className="cp-tags">
                <span className="cp-program font-rajdhani">{group.title}</span>
                <span className="cp-count font-rajdhani">{presencas(champions[0].count)} cada</span>
                <span className="cp-congrats font-rajdhani">Parabéns! 👏</span>
              </div>
            </header>
            <div className="cp-cards">
              {shown.map((champion) => (
                <div key={champion.studentId} className="cp-card">
                  <ChampionPhoto champion={champion} size={cardSize} />
                  <span className="cp-card-name font-rajdhani">{champion.name}</span>
                </div>
              ))}
              {extra > 0 && <div className="cp-card cp-card-more font-rajdhani">+{extra}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
