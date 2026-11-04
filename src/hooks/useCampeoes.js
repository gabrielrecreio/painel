import { useState, useEffect } from 'react'

const SHOW_UNTIL_DAY = 7 // campeões aparecem do dia 1 ao dia 7
const POLL_INTERVAL_MS = 60 * 60 * 1000 // o mês anterior não muda, 1 vez por hora basta

function previousMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Na primeira semana do mês, busca o ranking do mês anterior e devolve um slide
 * de parabéns por programa com o(s) 1º colocado(s), no formato do BannerSlider.
 * `force` (ex.: /tv?campeoes=1) mostra os slides em qualquer dia para pré-visualizar.
 */
export function useCampeoes(force = false) {
  const [campeoes, setCampeoes] = useState([])
  const [today, setToday] = useState(() => new Date().toDateString())

  // Reavalia a data a cada minuto para os slides entrarem/saírem sozinhos na virada do dia
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date().toDateString()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const now = new Date(today)
    if (!force && now.getDate() > SHOW_UNTIL_DAY) {
      setCampeoes([])
      return
    }

    let cancelled = false
    const month = previousMonth(now)

    const fetchCampeoes = async () => {
      try {
        const res = await fetch(`/api/ranking?month=${month}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const slides = (data.groups || [])
          .map((group) => ({
            id: `campeao_${data.month}_${group.id}`,
            name: `Campeão de presenças · ${group.title}`,
            type: 'campeao',
            isCampeao: true,
            month: data.month,
            group: { id: group.id, title: group.title },
            champions: group.entries.filter((e) => e.position === 1),
          }))
          .filter((slide) => slide.champions.length > 0)
        if (!cancelled) setCampeoes(slides)
      } catch (err) {
        console.warn('[useCampeoes] Falha ao buscar campeões do mês anterior:', err.message)
      }
    }

    fetchCampeoes()
    const timer = setInterval(fetchCampeoes, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [today, force])

  return campeoes
}
