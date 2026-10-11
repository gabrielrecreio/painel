import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

/* ── Carregamento único da YouTube IFrame Player API ── */
let apiPromise = null
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev()
      resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => {
      apiPromise = null // permite nova tentativa
      tag.remove()
      reject(new Error('Falha ao carregar a API do YouTube'))
    }
    document.head.appendChild(tag)
  })
  return apiPromise
}

/* Fisher–Yates */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const RETRY_MS = 30000

/**
 * Reproduz vídeos do YouTube em ordem aleatória, em loop infinito.
 * `videos` é um array de objetos { id, name, url } onde `url` é o YouTube videoId.
 *
 * Usa um "saco embaralhado": cada ciclo toca todos os vídeos uma vez em ordem
 * aleatória, e o primeiro do novo ciclo nunca repete o último do anterior.
 * Vídeos com erro (removidos / sem permissão de incorporação) são pulados.
 */
export default function VideoPlayer({ videos, fillHeight = false }) {
  const ids = useMemo(() => videos.map((v) => v.url).filter(Boolean), [videos])
  const hasVideos = ids.length > 0

  const [currentId, setCurrentId] = useState(null)

  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const readyRef = useRef(false)
  const idsRef = useRef(ids)
  const bagRef = useRef([])
  const currentIdRef = useRef(null)
  const errorCountRef = useRef(0)
  const errorTimerRef = useRef(null)

  /* Sorteia o próximo vídeo a partir do saco embaralhado */
  const takeNext = useCallback(() => {
    const list = idsRef.current
    if (list.length === 0) return null
    if (list.length === 1) return list[0]

    bagRef.current = bagRef.current.filter((id) => list.includes(id))
    if (bagRef.current.length === 0) {
      const bag = shuffle(list)
      // evita repetir o mesmo vídeo na virada do ciclo
      if (bag[0] === currentIdRef.current) bag.push(bag.shift())
      bagRef.current = bag
    }
    return bagRef.current.shift()
  }, [])

  const playNext = useCallback(() => {
    const id = takeNext()
    currentIdRef.current = id
    setCurrentId(id)
    const p = playerRef.current
    if (p && readyRef.current && id) p.loadVideoById(id)
  }, [takeNext])

  /* Mantém a lista atualizada quando os vídeos mudarem no painel */
  useEffect(() => {
    idsRef.current = ids
    bagRef.current = bagRef.current.filter((id) => ids.includes(id))
    errorCountRef.current = 0
    const cur = currentIdRef.current
    if (ids.length > 0 && readyRef.current && cur && !ids.includes(cur)) {
      playNext() // o vídeo atual foi removido
    }
  }, [ids, playNext])

  /* Cria / destrói o player */
  useEffect(() => {
    if (!hasVideos) return
    const host = hostRef.current
    let cancelled = false
    let apiRetry = null

    const init = () => {
      loadYouTubeAPI()
        .then((YT) => {
          if (cancelled || !host) return

          // div criada fora do React: a API substitui esse elemento pelo iframe
          const el = document.createElement('div')
          host.appendChild(el)

          const cur = currentIdRef.current
          const first = cur && idsRef.current.includes(cur) ? cur : takeNext()
          currentIdRef.current = first
          setCurrentId(first)

          playerRef.current = new YT.Player(el, {
            width: '100%',
            height: '100%',
            videoId: first,
            playerVars: {
              autoplay: 1,
              mute: 1, // necessário para autoplay
              controls: 0,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              disablekb: 1,
              iv_load_policy: 3,
            },
            events: {
              onReady: (e) => {
                readyRef.current = true
                const iframe = e.target.getIframe?.()
                if (iframe) {
                  iframe.style.display = 'block'
                  iframe.style.border = 'none'
                  iframe.title = 'Vídeo GB Marajoara'
                }
                e.target.mute()
                // se o vídeo mudou enquanto o player carregava
                if (currentIdRef.current && currentIdRef.current !== first) {
                  e.target.loadVideoById(currentIdRef.current)
                } else {
                  e.target.playVideo()
                }
              },
              onStateChange: (e) => {
                if (e.data === YT.PlayerState.PLAYING) {
                  errorCountRef.current = 0
                } else if (e.data === YT.PlayerState.ENDED) {
                  playNext()
                }
              },
              onError: () => {
                errorCountRef.current += 1
                clearTimeout(errorTimerRef.current)
                if (errorCountRef.current >= idsRef.current.length) {
                  // todos falharam seguidos: espera antes de tentar de novo
                  errorTimerRef.current = setTimeout(() => {
                    errorCountRef.current = 0
                    playNext()
                  }, RETRY_MS)
                } else {
                  playNext()
                }
              },
            },
          })
        })
        .catch(() => {
          if (!cancelled) apiRetry = setTimeout(init, RETRY_MS)
        })
    }

    init()

    return () => {
      cancelled = true
      clearTimeout(apiRetry)
      clearTimeout(errorTimerRef.current)
      readyRef.current = false
      try {
        playerRef.current?.destroy?.()
      } catch {
        /* ignora */
      }
      playerRef.current = null
      if (host) host.innerHTML = ''
    }
  }, [hasVideos, takeNext, playNext])

  const containerStyle = fillHeight
    ? { width: '100%', height: '100%' }
    : { aspectRatio: '21/9' }

  const currentIndex = videos.findIndex((v) => v.url === currentId)

  return (
    <div className="video-container relative" style={containerStyle}>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />

      {!hasVideos && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gb-charcoal-4">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-inter">Nenhum vídeo disponível</span>
          </div>
        </div>
      )}

      {/* Indicador de múltiplos vídeos */}
      {videos.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1 z-10 pointer-events-none">
          {videos.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-4 bg-gb-red' : 'w-1 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
