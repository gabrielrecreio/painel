import { useState, useEffect, useRef } from 'react'
import CampeaoSlide from './CampeaoSlide'

// Coordenadas exatas da moldura branca na arte /graduados-bg.jpg (1024 × 564)
const FRAME_LEFT = `${(634 / 1024) * 100}%`
const FRAME_TOP = `${(69 / 564) * 100}%`
const FRAME_WIDTH = `${(308 / 1024) * 100}%`
const FRAME_HEIGHT = `${(434 / 564) * 100}%`

function GraduadoSlide({ banner, active }) {
  return (
    <div
      className="banner-slide absolute inset-0 w-full h-full flex items-center justify-center bg-black transition-opacity duration-700 select-none overflow-hidden"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {/* Container proporcional à arte padrão (1024 × 564) para que a foto encaixe 100% na moldura */}
      <div
        className="relative max-w-full max-h-full"
        style={{ aspectRatio: '1024 / 564', height: '100%' }}
      >
        {/* 1. Arte oficial de fundo ("GRADUADOS DA SEMANA - PARABÉNS A TODOS!") */}
        <img
          src="/graduados-bg.jpg"
          alt="Graduados da Semana"
          className="block w-full h-full object-contain pointer-events-none"
        />

        {/* 2. Foto vertical do graduado posicionada exatamente dentro do quadro branco */}
        <div
          className="absolute overflow-hidden bg-neutral-900"
          style={{
            left: FRAME_LEFT,
            top: FRAME_TOP,
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
          }}
        >
          <img
            src={banner.url}
            alt={banner.name || 'Graduado da Semana'}
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* 3. Selo redondo da Gracie Barra sobreposto no canto superior direito da foto */}
        <img
          src="/graduados-badge.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      </div>
    </div>
  )
}

export default function BannerSlider({ banners, intervalSeconds = 5, fillHeight = false, paused = false }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef(null)
  const transitionTimeoutRef = useRef(null)

  useEffect(() => {
    if (banners.length <= 1 || paused) {
      if (paused) setVisible(true)
      return
    }

    timerRef.current = setInterval(() => {
      // Fade out
      setVisible(false)
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
        setVisible(true)
      }, 700) // match CSS transition duration
    }, intervalSeconds * 1000)

    return () => {
      clearInterval(timerRef.current)
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
    }
  }, [banners, intervalSeconds, paused])

  // Reset index when banners change
  useEffect(() => {
    setCurrentIndex(0)
    setVisible(true)
  }, [banners.length])

  if (banners.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-gb-charcoal-2 rounded-xl border border-white/5"
        style={{ minHeight: '100px' }}
      >
        <div className="flex flex-col items-center gap-2 text-gb-charcoal-4">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-inter">Nenhum banner disponível</span>
        </div>
      </div>
    )
  }

  // Otimiza a URL do Cloudinary para economizar drásticamente a banda
  const optimizeCloudinaryUrl = (url) => {
    if (url && url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/q_auto,f_auto,w_1080/')
    }
    return url
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/5 bg-black shrink-0"
      style={fillHeight
        ? { width: '100%', height: '100%' }
        : { aspectRatio: '2/1', width: '100%' }
      }
    >
      {/* 
        Renderiza TODOS os banners no DOM para que o navegador baixe apenas 1 vez e mantenha em cache,
        alterando apenas a opacidade do banner ativo. Isso zera o consumo repetitivo de banda.
      */}
      {banners.map((banner, i) => {
        const isActive = i === currentIndex && visible
        if (banner.isCampeao) {
          return <CampeaoSlide key={banner.id} banner={banner} active={isActive} />
        }
        if (banner.isGraduado) {
          return <GraduadoSlide key={banner.id || i} banner={banner} active={isActive} />
        }
        return (
          <img
            key={banner.id || i}
            src={optimizeCloudinaryUrl(banner.url)}
            alt={banner.name || 'Banner'}
            className="banner-slide absolute inset-0 w-full h-full transition-opacity duration-700"
            style={{
              opacity: isActive ? 1 : 0,
              objectFit: 'contain',
              pointerEvents: i === currentIndex ? 'auto' : 'none'
            }}
          />
        )
      })}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setVisible(true) }}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex % banners.length
                  ? 'w-4 h-1.5 bg-gb-red'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
