import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Hook para gerenciar aulas com Supabase Realtime.
 * Retorna: classes, loading, error, addClass, deleteClass, refetch
 */
export function useClasses() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('aulas')
      .select('*')
      .order('dia_semana')
      .order('horario_inicio')
    if (err) setError(err.message)
    else setClasses(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClasses()

    // Realtime subscription
    const channel = supabase
      .channel('aulas-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'aulas' },
        () => fetchClasses()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchClasses])

  const addClass = async (classData) => {
    const { data, error: err } = await supabase
      .from('aulas')
      .insert([classData])
      .select()
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  const deleteClass = async (id) => {
    const { error: err } = await supabase.from('aulas').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { classes, loading, error, addClass, deleteClass, refetch: fetchClasses }
}
