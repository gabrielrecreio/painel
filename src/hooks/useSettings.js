import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Hook para gerenciar configurações com Supabase Realtime.
 * Retorna: settings (objeto chave-valor), loading, error, updateSetting
 */
export function useSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('settings')
      .select('*')
    if (err) {
      setError(err.message)
    } else {
      const settingsObj = {}
      data?.forEach(row => {
        settingsObj[row.key] = row.value
      })
      setSettings(settingsObj)
    }
    if (isInitial) setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings(true)

    // Realtime com nome de canal único por instância (evita conflito ao montar duas vezes)
    const channel = supabase
      .channel(`settings-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => fetchSettings(false)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSettings])

  const updateSetting = async (key, value) => {
    const { error: err } = await supabase
      .from('settings')
      .upsert([{ key, value }])
      
    if (err) throw new Error(err.message)
  }

  return { settings, loading, error, updateSetting }
}
