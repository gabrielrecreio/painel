import { useState, useEffect } from 'react'

const REFRESH_MS = 60 * 1000

/**
 * Busca o ranking de presenças do mês (via /api/ranking) e atualiza a cada minuto.
 * Em caso de erro mantém o último ranking carregado.
 */
export function useRanking(enabled) {
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const fetchRanking = async () => {
      try {
        const res = await fetch('/api/ranking')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setRanking(data)
      } catch (err) {
        console.warn('Aviso: não foi possível atualizar o ranking', err)
      }
    }

    fetchRanking()
    const interval = setInterval(fetchRanking, REFRESH_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [enabled])

  return ranking
}

/**
 * Alterna entre a tela normal e o ranking:
 * `intervalMinutes` na tela normal → `displaySeconds` no ranking → repete.
 * `forceShow` (ex.: /tv?ranking=1) deixa o ranking fixo para pré-visualizar.
 */
export function useRankingCycle({ enabled, intervalMinutes, displaySeconds }, forceShow = false) {
  const [showing, setShowing] = useState(forceShow)

  useEffect(() => {
    setShowing(forceShow)
    if (!enabled || forceShow) return

    let timer
    const schedule = (show) => {
      const delay = show ? intervalMinutes * 60 * 1000 : displaySeconds * 1000
      timer = setTimeout(() => {
        setShowing(show)
        schedule(!show)
      }, delay)
    }
    schedule(true)

    return () => clearTimeout(timer)
  }, [enabled, intervalMinutes, displaySeconds, forceShow])

  return showing
}
