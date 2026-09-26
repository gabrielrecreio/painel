import { useState, useEffect, useRef } from 'react'

export default function BannerSlider({ banners, intervalSeconds = 5 }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => {
      // Fade out
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
        setVisible(true)
      }, 700) // match CSS transition duration
    }, intervalSeconds * 1000)

    return () => clearInterval(timerRef.current)
  }, [banners, intervalSeconds])

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

  const current = banners[currentIndex % banners.length]

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/5 bg-black shrink-0"
      style={{ aspectRatio: '2/1', width: '100%' }}
    >
      <img
        src={current.url}
        alt={current.name}
        className="banner-slide absolute inset-0 w-full h-full"
        style={{ opacity: visible ? 1 : 0, objectFit: 'contain' }}
      />

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
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
