import { useState, useCallback } from 'react'
import { useClasses } from '../hooks/useClasses'
import { useMedia } from '../hooks/useMedia'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import ClassForm from '../components/admin/ClassForm'
import ClassList from '../components/admin/ClassList'
import MediaUpload from '../components/admin/MediaUpload'
import MediaList from '../components/admin/MediaList'

// ===== TOAST =====
function Toast({ msg, type, onClose }) {
  if (!msg) return null
  return (
    <div className={`toast ${type === 'error' ? 'toast-error' : 'toast-success'}`}>
      <div className="flex items-center justify-between gap-4">
        <span>{msg}</span>
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])
  const hide = useCallback(() => setToast(null), [])
  return { toast, show, hide }
}

// ===== BANNER INTERVAL SETTING =====
const INTERVAL_KEY = 'gb_banner_interval'
function getBannerInterval() {
  const saved = localStorage.getItem(INTERVAL_KEY)
  return saved ? parseInt(saved, 10) : 5
}

export default function AdminPage() {
  const { classes, loading: classLoading, addClass, deleteClass } = useClasses()
  const { videos, banners, loading: mediaLoading, uploadImage, addVideo, deleteMedia } = useMedia()
  const { settings, updateSetting } = useSettings()
  const { toast, show: showToast, hide: hideToast } = useToast()
  const { signOut, session } = useAuth()
  const [bannerInterval, setBannerInterval] = useState(getBannerInterval())

  const handleAddClass = async (formData) => {
    try {
      await addClass(formData)
      showToast('Aula adicionada com sucesso! ✓')
    } catch (err) {
      showToast(`Erro ao adicionar aula: ${err.message}`, 'error')
    }
  }

  const handleDeleteClass = async (id) => {
    try {
      await deleteClass(id)
      showToast('Aula excluída com sucesso! ✓')
    } catch (err) {
      showToast(`Erro ao excluir aula: ${err.message}`, 'error')
    }
  }

  const handleUploadImage = async (file, semana) => {
    try {
      await uploadImage(file, semana)
      showToast(`"${file.name}" enviado com sucesso! ✓`)
    } catch (err) {
      showToast(`Erro ao enviar "${file.name}": ${err.message}`, 'error')
    }
  }

  const handleAddVideo = async (url, title) => {
    try {
      await addVideo(url, title)
      showToast('Vídeo adicionado com sucesso! ✓')
    } catch (err) {
      showToast(`Erro ao adicionar vídeo: ${err.message}`, 'error')
    }
  }

  const handleDeleteMedia = async (id, type, publicId) => {
    try {
      await deleteMedia(id, type, publicId)
      showToast('Mídia excluída com sucesso! ✓')
    } catch (err) {
      showToast(`Erro ao excluir mídia: ${err.message}`, 'error')
    }
  }

  const handleIntervalChange = (val) => {
    const n = Math.max(1, Math.min(60, parseInt(val, 10) || 5))
    setBannerInterval(n)
    localStorage.setItem(INTERVAL_KEY, String(n))
  }

  const handleHolidayChange = async (val) => {
    try {
      await updateSetting('holiday_date', val)
      showToast('Data do feriado atualizada! ✓')
    } catch (err) {
      showToast(`Erro ao atualizar data: ${err.message}`, 'error')
    }
  }

  return (
    <div className="admin-root">
      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo oficial */}
            <img
              src="/logo.jpg"
              alt="GB Marajoara"
              className="rounded-xl object-contain"
              style={{ width: 44, height: 44 }}
            />
            <div>
              <h1 className="font-rajdhani font-bold text-white text-xl tracking-wide">
                GB Marajoara
              </h1>
              <p className="text-gb-muted text-xs">Painel de Controle · Digital Signage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TV Link */}
            <a
              href="/tv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
                border border-white/10 hover:border-gb-red/50 hover:bg-gb-red/10 transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Abrir Painel TV
            </a>

            {/* Logout */}
            <button
              onClick={async () => { if (confirm('Deseja sair do painel?')) await signOut() }}
              title={`Sair (${session?.user?.email})`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gb-muted
                border border-white/10 hover:border-red-800/60 hover:text-red-400 hover:bg-red-900/10 transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-10">

        {/* ===== SECTION: AULAS ===== */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="gb-divider flex-1" style={{ margin: 0 }} />
            <h2 className="font-rajdhani font-bold text-xl text-white tracking-widest uppercase shrink-0">
              Grade Horária
            </h2>
            <div className="gb-divider flex-1" style={{ margin: 0 }} />
          </div>

          <div className="glass-card p-4 mb-5 flex items-center gap-4 flex-wrap">
            <svg className="h-5 w-5 text-gb-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label className="text-sm text-gb-muted font-medium whitespace-nowrap">
              Data do Feriado:
            </label>
            <input
              type="date"
              value={settings.holiday_date || ''}
              onChange={(e) => handleHolidayChange(e.target.value)}
              className="gb-input"
              style={{ maxWidth: 200 }}
            />
            <button
              type="button"
              onClick={() => handleHolidayChange('')}
              className="btn-ghost px-3 py-1 text-xs"
            >
              Limpar Feriado
            </button>
            <p className="text-xs text-gb-charcoal-4 w-full">
              Nesta data específica, o painel exibirá as aulas cadastradas como "Feriado" em vez das aulas normais daquele dia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClassForm onAdd={handleAddClass} />
            <ClassList
              classes={classes}
              loading={classLoading}
              onDelete={handleDeleteClass}
            />
          </div>
        </section>

        {/* ===== SECTION: MÍDIAS ===== */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="gb-divider flex-1" style={{ margin: 0 }} />
            <h2 className="font-rajdhani font-bold text-xl text-white tracking-widest uppercase shrink-0">
              Mídias
            </h2>
            <div className="gb-divider flex-1" style={{ margin: 0 }} />
          </div>

          {/* Banner interval */}
          <div className="glass-card p-4 mb-5 flex items-center gap-4 flex-wrap">
            <svg className="h-5 w-5 text-gb-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <label className="text-sm text-gb-muted font-medium whitespace-nowrap">
              Intervalo dos Banners (segundos):
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={bannerInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              className="gb-input"
              style={{ maxWidth: 100 }}
            />
            <p className="text-xs text-gb-charcoal-4">
              Salvo automaticamente no navegador. Recarregue o painel /tv para aplicar.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <MediaUpload
              onUploadImage={handleUploadImage}
              onAddVideo={handleAddVideo}
            />
            <MediaList
              videos={videos}
              banners={banners}
              loading={mediaLoading}
              onDelete={handleDeleteMedia}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gb-charcoal-4 pb-4">
          © {new Date().getFullYear()} GB Marajoara · Digital Signage System
        </footer>
      </main>

      {/* TOAST */}
      <Toast msg={toast?.msg} type={toast?.type} onClose={hideToast} />
    </div>
  )
}
