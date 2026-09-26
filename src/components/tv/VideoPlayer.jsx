import { useState, useEffect } from 'react'

/**
 * Reproduz vídeos do YouTube em loop via iframe embed.
 * `videos` é um array de objetos { id, name, url } onde `url` é o YouTube videoId.
 */
export default function VideoPlayer({ videos, fillHeight = false }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset index quando a lista mudar
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0)
    }
  }, [videos, currentIndex])

  const containerStyle = fillHeight
    ? { width: '100%', height: '100%' }
    : { aspectRatio: '21/9' }

  if (videos.length === 0) {
    return (
      <div
        className="video-container flex items-center justify-center"
        style={containerStyle}
      >
        <div className="flex flex-col items-center gap-3 text-gb-charcoal-4">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-inter">Nenhum vídeo disponível</span>
        </div>
      </div>
    )
  }

  const current = videos[currentIndex % videos.length]
  const videoId = current.url

  // Monta playlist com todos os vídeos para loop automático
  const playlist = videos.map((v) => v.url).join(',')

  // Parâmetros do embed:
  // autoplay=1, mute=1 (necessário para autoplay), loop=1,
  // playlist=... (necessário para loop), controls=0, rel=0
  const embedUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&loop=1&playlist=${playlist}` +
    `&controls=0&rel=0&modestbranding=1&playsinline=1`

  return (
    <div className="video-container relative" style={containerStyle}>
      <iframe
        key={videoId}
        src={embedUrl}
        title={current.name || 'Vídeo GB Marajoara'}
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />

      {/* Indicador de múltiplos vídeos */}
      {videos.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1 z-10 pointer-events-none">
          {videos.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex % videos.length
                  ? 'w-4 bg-gb-red'
                  : 'w-1 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
