import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { DEFAULT_LAYOUT } from '../tvConstants'

/**
 * Hook dedicado para buscar o layout da TV.
 * Usa canal realtime com nome único para não conflitar com useSettings.
 */
export function useTvLayout() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)

  useEffect(() => {
    const applyLayout = (value) => {
      if (!value) return
      try {
        const parsed = JSON.parse(value)
        if (parsed?.header && parsed?.clock && parsed?.schedule && parsed?.video && parsed?.banner) {
          setLayout(parsed)
        }
      } catch (_) { /* mantém DEFAULT_LAYOUT */ }
    }

    // Busca inicial
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'tv_layout')
      .maybeSingle()
      .then(({ data }) => applyLayout(data?.value))

    // Realtime com nome de canal único por instância
    const channel = supabase
      .channel(`tv-layout-watch-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.tv_layout' },
        (payload) => applyLayout(payload.new?.value)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return layout
}
