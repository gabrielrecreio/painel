import { useState } from 'react'

function YoutubeThumb({ videoId }) {
  return (
    <img
      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
      alt="thumb"
      className="h-8 w-14 object-cover rounded border border-white/10"
    />
  )
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaList({ videos, banners, loading, onDelete }) {
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (item) => {
    if (!confirm(`Excluir "${item.name}"?`)) return
    setDeletingId(item.id)
    try {
      await onDelete(item.id, item.type, item.public_id)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-32">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-gb-red" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gb-muted text-sm">Carregando mídias...</span>
        </div>
      </div>
    )
  }

  const allMedia = [
    ...videos.map((v) => ({ ...v, kind: 'video' })),
    ...banners.map((b) => ({ ...b, kind: 'image' })),
  ]

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-rajdhani font-semibold text-lg text-white tracking-wide flex items-center gap-2">
          <span className="w-1 h-5 bg-gb-red rounded-full inline-block" />
          Mídias Cadastradas
        </h3>
        <div className="flex gap-2">
          <span className="text-xs bg-gb-charcoal-3 text-gb-red px-2 py-1 rounded-full">
            {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs bg-gb-charcoal-3 text-blue-400 px-2 py-1 rounded-full">
            {banners.length} banner{banners.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {allMedia.length === 0 ? (
        <div className="p-8 flex flex-col items-center gap-3">
          <svg className="h-10 w-10 text-gb-charcoal-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gb-muted text-sm">Nenhuma mídia cadastrada ainda.</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <table className="gb-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Semana</th>
                <th>Preview</th>
                <th className="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {allMedia.map((f) => (
                <tr key={f.id} className="animate-fadeIn">
                  <td>
                    {f.kind === 'video' ? (
                      <span className="text-xs bg-red-900/40 text-gb-red px-2 py-0.5 rounded font-mono">YT</span>
                    ) : (
                      <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded font-mono">IMG</span>
                    )}
                  </td>
                  <td>
                    <span className="text-white font-mono text-xs truncate max-w-[200px] block">
                      {f.name}
                    </span>
                  </td>
                  <td className="text-gb-muted text-xs">
                    {f.semana ? `Sem. ${f.semana}` : '—'}
                  </td>
                  <td>
                    {f.kind === 'image' ? (
                      <img
                        src={f.url}
                        alt={f.name}
                        className="h-8 w-14 object-cover rounded border border-white/10"
                      />
                    ) : (
                      <YoutubeThumb videoId={f.url} />
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(f)}
                      disabled={deletingId === f.id}
                      className="btn-danger"
                    >
                      {deletingId === f.id ? '...' : 'Excluir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
