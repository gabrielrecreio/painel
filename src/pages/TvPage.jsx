import { useState, useEffect } from 'react'
import { useClasses } from '../hooks/useClasses'
import { useMedia } from '../hooks/useMedia'
import ScheduleTable from '../components/tv/ScheduleTable'
import VideoPlayer from '../components/tv/VideoPlayer'
import BannerSlider from '../components/tv/BannerSlider'

const INTERVAL_KEY = 'gb_banner_interval'
function getBannerInterval() {
  const saved = localStorage.getItem(INTERVAL_KEY)
  return saved ? parseInt(saved, 10) : 5
}

function getGBWeek() {
  // Semana 1 começou em 30/08/2026 (Domingo)
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

/* ── Relógio portrait: centralizado e grande ── */
function ClockPortrait() {
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

  return (
    <div className="tv-p-clock-wrap">
      <div className="tv-p-time font-rajdhani">
        <span className="tv-p-hhmm">{hours}<span className="tv-p-colon text-gb-red">:</span>{minutes}</span>
        <span className="tv-p-sec font-rajdhani">{seconds}</span>
      </div>
      <p className="tv-p-date font-inter capitalize">{dateStr}</p>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
        .tv-p-colon { animation: blink 1s step-end infinite; display: inline-block; }
      `}</style>
    </div>
  )
}

export default function TvPage() {
  const { classes, loading: classLoading } = useClasses()
  const { videos, banners } = useMedia()
  const bannerInterval = getBannerInterval()
  const currentWeek = getGBWeek()

  // Filtra banners: se tiver semana definida, só mostra se for a semana atual
  const activeBanners = banners.filter(banner => {
    if (banner.semana) {
      return banner.semana === currentWeek
    }
    return true // sem semana definida = sempre visível
  })

  return (
    <div className="tv-portrait-root">

      {/* ========== HEADER: Logo + Nome ========== */}
      <div className="tv-p-header">
        <img src="/logo.jpg" alt="GB Marajoara" className="tv-p-logo" />
        <div>
          <h1 className="tv-p-brand-name font-rajdhani">GB Marajoara</h1>
          <p className="tv-p-brand-sub font-rajdhani">Gracie Barra · Jiu-Jitsu</p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="gb-divider" style={{ margin: '0' }} />

      {/* ========== RELÓGIO ========== */}
      <ClockPortrait />

      {/* ── Divider ── */}
      <div className="gb-divider" style={{ margin: '0' }} />

      {/* ========== TABELA DE AULAS ========== */}
      <div className="tv-p-schedule">
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
      </div>

      {/* ========== VÍDEO ========== */}
      <div className="tv-p-section">
        <div className="tv-p-section-label font-rajdhani">▶ Transmissão</div>
        <div className="tv-p-video-wrap">
          <VideoPlayer videos={videos} />
        </div>
      </div>

      {/* ========== BANNERS ========== */}
      <div className="tv-p-section">
        <div className="tv-p-section-label font-rajdhani">▶ Destaques</div>
        <div className="tv-p-banner-wrap">
          <BannerSlider banners={activeBanners} intervalSeconds={bannerInterval} />
        </div>
      </div>

      {/* ========== FOOTER ========== */}
      <div className="tv-p-footer font-inter">
        <span>Digital Signage · GB Marajoara</span>
        <span>🔴 AO VIVO</span>
      </div>

    </div>
  )
}
