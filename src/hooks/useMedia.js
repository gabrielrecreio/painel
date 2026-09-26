import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Extrai o ID de um vídeo do YouTube a partir de vários formatos de URL.
 * Suporta: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
 */
function extractYoutubeId(input) {
  const str = input.trim()
  // Se já for só o ID (11 chars alfanuméricos + hífens/underlines)
  if (/^[\w-]{11}$/.test(str)) return str
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]
  for (const re of patterns) {
    const m = str.match(re)
    if (m) return m[1]
  }
  return null
}

/**
 * Hook para gerenciar mídias via tabela `midias` no Supabase DB.
 * - Imagens: armazenadas no Cloudinary
 * - Vídeos:  armazenados no YouTube (apenas o videoId)
 *
 * Retorna: videos, banners, allMedia, loading, error,
 *          uploadImage, addVideo, deleteMedia, refetch
 */
export function useMedia() {
  const [allMedia, setAllMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('midias')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      setAllMedia([])
    } else {
      setAllMedia(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const videos = allMedia.filter((m) => m.type === 'video')
  const banners = allMedia.filter((m) => m.type === 'image')

  /**
   * Faz upload de uma imagem para o Cloudinary (upload não assinado)
   * e salva o registro na tabela `midias`.
   */
  const uploadImage = async (file, semana = null) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_PRESET)
    formData.append('folder', 'gb_midias')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: formData }
    )
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error?.message || 'Erro no upload para Cloudinary')
    }
    const { secure_url, public_id } = await res.json()

    // Sanitiza nome do arquivo para usar como `name`
    const name = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_+/g, '_')

    const { error: dbErr } = await supabase.from('midias').insert([
      {
        name,
        type: 'image',
        url: secure_url,
        public_id,
        semana: semana || null,
      },
    ])
    if (dbErr) throw new Error(dbErr.message)
    await fetchMedia()
  }

  /**
   * Adiciona um vídeo do YouTube à tabela `midias`.
   * @param {string} youtubeInput - URL completa ou só o ID do vídeo
   * @param {string} title - nome/título do vídeo
   */
  const addVideo = async (youtubeInput, title) => {
    const videoId = extractYoutubeId(youtubeInput)
    if (!videoId) throw new Error('URL do YouTube inválida')

    const { error: dbErr } = await supabase.from('midias').insert([
      {
        name: title || videoId,
        type: 'video',
        url: videoId,
        public_id: null,
        semana: null,
      },
    ])
    if (dbErr) throw new Error(dbErr.message)
    await fetchMedia()
  }

  /**
   * Remove mídia da tabela `midias`.
   * Para imagens: também chama a API route para deletar no Cloudinary.
   */
  const deleteMedia = async (id, type, publicId) => {
    // Se for imagem, deleta no Cloudinary via API route
    if (type === 'image' && publicId) {
      try {
        await fetch('/api/cloudinary-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        })
      } catch {
        // Não bloqueia a remoção do DB se a API falhar
        console.warn('Aviso: não foi possível deletar no Cloudinary')
      }
    }

    const { error: dbErr } = await supabase
      .from('midias')
      .delete()
      .eq('id', id)
    if (dbErr) throw new Error(dbErr.message)
    await fetchMedia()
  }

  return {
    videos,
    banners,
    allMedia,
    loading,
    error,
    uploadImage,
    addVideo,
    deleteMedia,
    refetch: fetchMedia,
  }
}
