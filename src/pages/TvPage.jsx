import { useState, useEffect, Component } from 'react'
import { useClasses } from '../hooks/useClasses'
import { useMedia } from '../hooks/useMedia'
import { useTvLayout } from '../hooks/useTvLayout'
import ScheduleTable from '../components/tv/ScheduleTable'
import VideoPlayer from '../components/tv/VideoPlayer'
import BannerSlider from '../components/tv/BannerSlider'
import { DEFAULT_LAYOUT, TV_REF_W, TV_REF_H } from '../tvConstants'

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

const INTERVAL_KEY = 'gb_banner_interval'
function getBannerInterval() {
  const saved = localStorage.getItem(INTERVAL_KEY)
  return saved ? parseInt(saved, 10) : 5
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

/* ── Relógio portrait ── */
function ClockPortrait({ h }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const hours   = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')

  const dateStr = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     '2-digit',
    month:   'long',
    year:    'numeric',
  })

  // Escala fonte dinamicamente com a altura da área
  const fs = Math.max(24, Math.min(96, h * 0.35))

  return (
    <div className="tv-p-clock-wrap" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="tv-p-time font-rajdhani" style={{ fontSize: fs }}>
        <span className="tv-p-hhmm">
          {hours}<span className="tv-p-colon text-gb-red">:</span>{minutes}
        </span>
        <span className="tv-p-sec font-rajdhani" style={{ fontSize: fs * 0.38 }}>{seconds}</span>
      </div>
      <p className="tv-p-date font-inter capitalize" style={{ fontSize: Math.max(12, h * 0.09) }}>{dateStr}</p>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        .tv-p-colon { animation: blink 1s step-end infinite; display: inline-block; }
      `}</style>
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
  const bannerInterval = getBannerInterval()
  const currentWeek = getGBWeek()

  const activeBanners = banners.filter(banner => {
    if (banner.semana) return banner.semana === currentWeek
    return true
  })

  return (
    <ErrorBoundary>
    <div className="tv-portrait-root">

      {/* ── Área 1: Cabeçalho ── */}
      <Widget className="tv-widget-header" pos={layout.header} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px,1.5vh,16px)' }}>
        <img
          src="/logo.jpg"
          alt="GB Marajoara"
          className="tv-p-logo"
          style={{ width: Math.min(layout.header.h * 0.7, 70), height: Math.min(layout.header.h * 0.7, 70) }}
        />
        <div>
          <h1
            className="tv-p-brand-name font-rajdhani"
            style={{ fontSize: Math.max(18, layout.header.h * 0.38) }}
          >
            GB Marajoara
          </h1>
          <p
            className="tv-p-brand-sub font-rajdhani"
            style={{ fontSize: Math.max(9, layout.header.h * 0.13) }}
          >
            Gracie Barra · Jiu-Jitsu
          </p>
        </div>
      </Widget>

      {/* ── Área 2: Relógio ── */}
      <Widget className="tv-widget-clock" pos={layout.clock}>
        <ClockPortrait h={layout.clock.h} />
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
    </ErrorBoundary>
  )
}
