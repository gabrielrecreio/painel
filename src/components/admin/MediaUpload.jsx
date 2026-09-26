import { useState, useRef } from 'react'

const SEMANA_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1)

export default function MediaUpload({ onUploadImage, onAddVideo }) {
  const [tab, setTab] = useState('image') // 'image' | 'video'
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [semana, setSemana] = useState('')

  // YouTube video state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)

  const inputRef = useRef()

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const total = files.length
    for (let i = 0; i < total; i++) {
      setProgress(`${i + 1}/${total}: ${files[i].name}`)
      try {
        await onUploadImage(files[i], semana ? parseInt(semana, 10) : null)
      } catch (err) {
        console.error('Upload error:', err)
      }
    }
    setProgress(null)
    setUploading(false)
    setSemana('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(jpg|jpeg|png|webp)$/i.test(f.name)
    )
    handleFiles(files)
  }

  const handleInputChange = (e) => {
    handleFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  // ── YouTube video ─────────────────────────────────────────────────────────
  const handleAddVideo = async () => {
    if (!youtubeUrl.trim()) return
    setAddingVideo(true)
    try {
      await onAddVideo(youtubeUrl.trim(), videoTitle.trim())
      setYoutubeUrl('')
      setVideoTitle('')
    } catch (err) {
      console.error('Add video error:', err)
      alert(`Erro: ${err.message}`)
    } finally {
      setAddingVideo(false)
    }
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <h3 className="font-rajdhani font-semibold text-lg text-white tracking-wide flex items-center gap-2">
        <span className="w-1 h-5 bg-gb-red rounded-full inline-block" />
        Upload de Mídias
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setTab('image')}
          className={`px-4 py-1.5 rounded-t text-sm font-semibold transition-colors ${
            tab === 'image'
              ? 'bg-gb-red text-white'
              : 'text-gb-muted hover:text-white'
          }`}
        >
          🖼 Imagem (Cloudinary)
        </button>
        <button
          onClick={() => setTab('video')}
          className={`px-4 py-1.5 rounded-t text-sm font-semibold transition-colors ${
            tab === 'video'
              ? 'bg-gb-red text-white'
              : 'text-gb-muted hover:text-white'
          }`}
        >
          ▶ Vídeo (YouTube)
        </button>
      </div>

      {/* ── IMAGE TAB ── */}
      {tab === 'image' && (
        <div className="flex flex-col gap-3">
          {/* Semana filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gb-muted whitespace-nowrap">
              Semana específica (opcional):
            </label>
            <select
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className="gb-input text-sm"
              style={{ maxWidth: 150 }}
            >
              <option value="">Sempre visível</option>
              {SEMANA_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  Semana {w}
                </option>
              ))}
            </select>
          </div>

          {/* Drop Zone */}
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-10 w-10 text-gb-red" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gb-muted">{progress}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <svg
                  className={`h-12 w-12 transition-colors duration-200 ${dragging ? 'text-gb-red' : 'text-gb-charcoal-4'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <p className="text-white font-medium text-sm">
                    Arraste imagens ou{' '}
                    <span className="text-gb-red-light cursor-pointer hover:underline">clique para selecionar</span>
                  </p>
                  <p className="text-gb-muted text-xs mt-1">
                    Imagens .jpg / .png / .webp → enviadas para Cloudinary
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIDEO TAB ── */}
      {tab === 'video' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gb-muted">
            Cole o link de um vídeo do YouTube (pode ser "Não listado") para adicioná-lo ao painel.
          </p>
          <input
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="gb-input"
          />
          <input
            type="text"
            placeholder="Título do vídeo (opcional)"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="gb-input"
          />
          <button
            onClick={handleAddVideo}
            disabled={addingVideo || !youtubeUrl.trim()}
            className="btn-primary self-start"
          >
            {addingVideo ? 'Adicionando...' : '▶ Adicionar Vídeo'}
          </button>
        </div>
      )}
    </div>
  )
}
