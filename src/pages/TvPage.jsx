import { useState, useEffect, useRef, Component } from 'react'
import { useClasses } from '../hooks/useClasses'
import { useMedia } from '../hooks/useMedia'
import { useTvLayout } from '../hooks/useTvLayout'
import { useSettings } from '../hooks/useSettings'
import { useRanking, useRankingCycle } from '../hooks/useRanking'
import ScheduleTable from '../components/tv/ScheduleTable'
import VideoPlayer from '../components/tv/VideoPlayer'
import BannerSlider from '../components/tv/BannerSlider'
import RankingScreen from '../components/tv/RankingScreen'
import { DEFAULT_LAYOUT, TV_REF_W, TV_REF_H, parseRankingConfig } from '../tvConstants'

/* ── Error Boundary para evitar tela preta em caso de crash ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div className="tv-portrait-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#e53935', fontFamily: 'monospace', fontSize: 14, padding: 24, background: '#1a0000', borderRadius: 8, maxWidth: '80%', wordBreak: 'break-all' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>⚠️ Erro de renderização:</div>
            {this.state.error?.message}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function getGBWeek() {
  const start = new Date(2026, 7, 30)
  start.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const diffTime = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const weeksBefore = Math.floor(Math.abs(diffDays) / 7) + 1
    let w = 16 - (weeksBefore % 16)
    if (w === 0) w = 16
    return w
  }

  const diffWeeks = Math.floor(diffDays / 7)
  return (diffWeeks % 16) + 1
}

/* ── Topo: logo + relógio grande + bloco do dia (mesmo visual do header do ranking) ── */
function TopBar() {
  const [time, setTime] = useState(new Date())
  const barRef = useRef(null)
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mede o tamanho real da área na tela (a TV nem sempre tem 1080 px de largura)
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hours   = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')
  const month   = time.toLocaleDateString('pt-BR', { month: 'long' })

  // Tudo escala com a área: logo e bloco do dia pela altura, relógio pelo espaço que sobra no meio
  const pad = w * 0.033
  const side = Math.min(h * 0.62, w * 0.18)
  const fs = Math.max(16, Math.min(h * 0.72, (w - 2 * side - 4 * pad) / 3.4))

  return (
    <div ref={barRef} className="tv-p-topbar" style={{ gap: pad, padding: `0 ${pad}px`, visibility: w ? 'visible' : 'hidden' }}>
      <img src="/logo.jpg" alt="GB Marajoara" className="tv-p-top-logo" style={{ width: side, height: side }} />

      <div className="tv-p-time font-rajdhani" style={{ fontSize: fs }}>
        <span className="tv-p-hhmm">
          {hours}<span className="tv-p-colon">:</span>{minutes}
        </span>
        <span className="tv-p-sec">{seconds}</span>
      </div>

      <div className="tv-p-day font-rajdhani" style={{ minWidth: side, height: side }}>
        <b style={{ fontSize: side * 0.5 }}>{time.getDate()}</b>
        <small style={{ fontSize: Math.max(14, side * 0.15) }}>{month}</small>
      </div>
    </div>
  )
}


function Widget({ pos, className = '', children, style = {} }) {
  return (
    <div
      className={`tv-widget ${className}`}
      style={{
        position: 'absolute',
        left:   `${(pos.x / TV_REF_W) * 100}%`,
        top:    `${(pos.y / TV_REF_H) * 100}%`,
        width:  `${(pos.w / TV_REF_W) * 100}%`,
        height: `${(pos.h / TV_REF_H) * 100}%`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function TvPage() {
  const { classes, loading: classLoading } = useClasses()
  const { videos, banners } = useMedia()
  const layout = useTvLayout()
  const { settings } = useSettings()
  const bannerInterval = parseInt(settings.banner_interval, 10) || 5
  const currentWeek = getGBWeek()

  // Ranking de presenças: /tv?ranking=1 deixa o ranking fixo para pré-visualizar
  const rankingConfig = parseRankingConfig(settings.ranking_config)
  const forceRanking = new URLSearchParams(window.location.search).get('ranking') === '1'
  const ranking = useRanking(rankingConfig.enabled || forceRanking)
  const rankingDue = useRankingCycle(rankingConfig, forceRanking)
  const hasRanking = !!ranking?.groups?.some(g => g.entries.length > 0)
  const showRanking = rankingDue && hasRanking

  // Retângulo que cobre o cabeçalho e o relógio do layout
  const topArea = {
    x: Math.min(layout.header.x, layout.clock.x),
    y: Math.min(layout.header.y, layout.clock.y),
    w: Math.max(layout.header.x + layout.header.w, layout.clock.x + layout.clock.w) - Math.min(layout.header.x, layout.clock.x),
    h: Math.max(layout.header.y + layout.header.h, layout.clock.y + layout.clock.h) - Math.min(layout.header.y, layout.clock.y),
  }

  const activeBanners = banners.filter(banner => {
    if (banner.semana) return banner.semana === currentWeek
    return true
  })

  return (
    <ErrorBoundary>
    <div className="tv-portrait-root">
    <div className={`tv-flipper ${showRanking ? 'is-flipped' : ''} ${forceRanking ? 'no-anim' : ''}`}>
    <div className="tv-face tv-face-front">

      {/* ── Áreas 1 e 2: Cabeçalho + Relógio numa barra só, ocupando o espaço das duas ── */}
      <Widget className="tv-widget-top" pos={topArea}>
        <TopBar />
      </Widget>

      {/* ── Divisor entre relógio e grade ── */}
      <div
        className="gb-divider tv-widget-divider"
        style={{
          position: 'absolute',
          left:   `calc(${(layout.schedule.x / TV_REF_W) * 100}% + 16px)`,
          top:    `calc(${(layout.schedule.y / TV_REF_H) * 100}% - 4px)`,
          width:  `calc(${(layout.schedule.w / TV_REF_W) * 100}% - 32px)`,
          margin: 0,
        }}
      />

      {/* ── Área 3: Grade de aulas ── */}
      <Widget className="tv-widget-schedule" pos={layout.schedule} style={{ display: 'flex', flexDirection: 'column' }}>
        {classLoading ? (
          <div className="flex items-center justify-center h-full gap-3">
            <svg className="animate-spin h-7 w-7 text-gb-red" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-gb-muted font-inter text-sm">Carregando grade...</span>
          </div>
        ) : (
          <ScheduleTable classes={classes} />
        )}
      </Widget>

      {/* ── Área 4: Vídeo ── */}
      <Widget className="tv-widget-video" pos={layout.video}>
        <div style={{ height: '100%', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
          <VideoPlayer videos={videos} fillHeight />
        </div>
      </Widget>

      {/* ── Área 5: Banners ── */}
      <Widget className="tv-widget-banner" pos={layout.banner}>
        <BannerSlider banners={activeBanners} intervalSeconds={bannerInterval} fillHeight />
      </Widget>

    </div>

    {/* ── Verso: ranking de presenças do mês ── */}
    <div className="tv-face tv-face-back">
      {hasRanking && <RankingScreen ranking={ranking} active={showRanking} />}
    </div>
    </div>
    </div>
    </ErrorBoundary>
  )
}
