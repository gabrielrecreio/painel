import { useState, useEffect, useCallback } from 'react'

const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = '6ae6a6d40015bc3f2a14'
const APPWRITE_DATABASE_ID = 'academia'
const APPWRITE_COLLECTION_ID = 'graduados_semana'
const POLL_INTERVAL_MS = 60 * 1000 // Atualiza a cada 60 segundos

/**
 * Busca automaticamente no Appwrite Cloud as fotos dos graduados da semana
 * enviadas no grupo do WhatsApp e converte para o formato de slides do BannerSlider.
 */
export function useGraduados() {
  const [graduados, setGraduados] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGraduados = useCallback(async () => {
    try {
      const url = `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_COLLECTION_ID}/documents`
      const res = await fetch(url, {
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        },
      })
      if (!res.ok) return

      const data = await res.json()
      const docs = (data.documents || [])
        .filter((doc) => doc.active !== false && doc.image_url)
        .sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt))
        .map((doc) => ({
          id: `graduado_${doc.$id}`,
          docId: doc.$id,
          name: 'Graduado da Semana',
          type: 'graduado',
          isGraduado: true,
          url: doc.image_url,
          created_at: doc.$createdAt,
        }))

      setGraduados(docs)
    } catch (err) {
      console.warn('[useGraduados] Falha ao buscar graduados:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraduados()
    const timer = setInterval(fetchGraduados, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchGraduados])

  return { graduados, loading, refetch: fetchGraduados }
}

