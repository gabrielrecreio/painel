import { useState, useCallback } from 'react'
import { Rnd } from 'react-rnd'
import { DEFAULT_LAYOUT, TV_REF_W, TV_REF_H } from '../../tvConstants'

export { DEFAULT_LAYOUT }

const WIDGET_LABELS = {
  header:   { label: 'Cabeçalho',     color: '#e53935', icon: '🏷️' },
  clock:    { label: 'Relógio / Data', color: '#1976d2', icon: '🕐' },
  schedule: { label: 'Grade Horária', color: '#388e3c', icon: '📅' },
  video:    { label: 'Vídeo',         color: '#7b1fa2', icon: '🎬' },
  banner:   { label: 'Banners',       color: '#f57c00', icon: '🖼️' },
}

export default function LayoutEditor({ layout, onSave, saving }) {
  // Escala para caber no editor (largura do preview = 320px)
  const PREVIEW_W = 230
  const scale = PREVIEW_W / TV_REF_W
  const PREVIEW_H = Math.round(TV_REF_H * scale)  // ≈ 409px — cabe na tela

  const [local, setLocal] = useState(() => layout || DEFAULT_LAYOUT)
  const [selected, setSelected] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  const update = useCallback((key, changes) => {
    setLocal(prev => ({ ...prev, [key]: { ...prev[key], ...changes } }))
    setHasChanges(true)
  }, [])

  const handleReset = () => {
    setLocal(DEFAULT_LAYOUT)
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(local)
    setHasChanges(false)
  }

  // Valores do widget selecionado para o painel numérico
  const sel = selected ? local[selected] : null

  return (
    <div className="flex flex-col gap-6">

      {/* Controles numéricos do widget selecionado */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-5 rounded-full bg-gb-red" />
          <h3 className="font-rajdhani font-bold text-white uppercase tracking-widest text-sm">
            Editor de Layout — TV Portrait (1080×1920)
          </h3>
        </div>

        {selected ? (
          <div className="flex flex-wrap gap-3 items-end">
            <div
              className="text-xs font-bold px-2 py-1 rounded"
              style={{ background: WIDGET_LABELS[selected].color + '33', color: WIDGET_LABELS[selected].color }}
            >
              {WIDGET_LABELS[selected].icon} {WIDGET_LABELS[selected].label}
            </div>
            {[
              { key: 'x', label: 'X (px)' },
              { key: 'y', label: 'Y (px)' },
              { key: 'w', label: 'Largura (px)' },
              { key: 'h', label: 'Altura (px)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-gb-muted">{label}</span>
                <input
                  type="number"
                  className="gb-input"
                  style={{ width: 90 }}
                  value={sel[key]}
                  min={0}
                  max={key === 'x' || key === 'w' ? TV_REF_W : TV_REF_H}
                  onChange={e => update(selected, { [key]: parseInt(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gb-muted text-sm">
            👆 Clique em uma área no preview para selecioná-la e ajustar os valores.
          </p>
        )}
      </div>

      <div className="flex gap-6 flex-wrap items-start">

        {/* Preview da TV */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gb-muted text-center">Preview (escala 1:{Math.round(1/scale)})</p>
          <div
            className="relative rounded-xl overflow-hidden border-2 border-white/10 bg-[#111] shrink-0"
            style={{ width: PREVIEW_W, height: PREVIEW_H }}
          >
            {/* Grade de referência */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: `${scale * 108}px ${scale * 192}px`,
              }}
            />

            {Object.entries(local).map(([key, pos]) => {
              const cfg = WIDGET_LABELS[key]
              const isSelected = selected === key
              return (
                <Rnd
                  key={key}
                  position={{ x: Math.round(pos.x * scale), y: Math.round(pos.y * scale) }}
                  size={{ width: `${Math.round(pos.w * scale)}px`, height: `${Math.round(pos.h * scale)}px` }}
                  minWidth={scale * 80}
                  minHeight={scale * 40}
                  onDragStop={(_, d) => update(key, {
                    x: Math.round(d.x / scale),
                    y: Math.round(d.y / scale),
                  })}
                  onResizeStop={(_, __, ref, ___, position) => update(key, {
                    w: Math.round(parseInt(ref.style.width)  / scale),
                    h: Math.round(parseInt(ref.style.height) / scale),
                    x: Math.round(position.x / scale),
                    y: Math.round(position.y / scale),
                  })}
                  onClick={() => setSelected(key)}
                  style={{ zIndex: isSelected ? 10 : 1 }}
                >
                  <div
                    className="w-full h-full rounded flex flex-col items-center justify-center text-center cursor-move select-none transition-all"
                    style={{
                      background: cfg.color + (isSelected ? '55' : '22'),
                      border: `${isSelected ? 2 : 1}px solid ${cfg.color}${isSelected ? 'ff' : '88'}`,
                      fontSize: scale * 13,
                    }}
                  >
                    <span style={{ fontSize: Math.max(scale * 18, 12) }}>{cfg.icon}</span>
                    <span style={{ color: cfg.color, fontWeight: 700, fontSize: Math.max(scale * 11, 10), lineHeight: 1.2 }}>
                      {cfg.label}
                    </span>
                    <span style={{ color: '#aaa', fontSize: Math.max(scale * 9, 9) }}>
                      {pos.w}×{pos.h}
                    </span>
                  </div>
                </Rnd>
              )
            })}
          </div>
        </div>

        {/* Legenda + ações */}
        <div className="flex flex-col gap-4 flex-1 min-w-[200px]">
          <div className="glass-card p-4 flex flex-col gap-2">
            <p className="text-xs text-gb-muted font-semibold uppercase tracking-wider mb-1">Áreas</p>
            {Object.entries(WIDGET_LABELS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                style={{
                  background: selected === key ? cfg.color + '22' : 'transparent',
                  border: `1px solid ${selected === key ? cfg.color : 'transparent'}`,
                }}
              >
                <span>{cfg.icon}</span>
                <span className="text-sm font-medium text-white">{cfg.label}</span>
                <span className="text-xs text-gb-muted ml-auto">
                  {local[key].w}×{local[key].h}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="btn-primary w-full"
            >
              {saving ? 'Salvando...' : hasChanges ? '💾 Salvar Layout' : '✓ Layout Salvo'}
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost w-full text-sm"
            >
              ↩️ Resetar para o padrão
            </button>
          </div>

          <div className="glass-card p-3">
            <p className="text-xs text-gb-muted leading-relaxed">
              💡 <strong className="text-white">Dica:</strong> Arraste as áreas para reposicioná-las.
              Puxe pelas bordas/cantos para redimensionar.
              Os valores em px são relativos à tela da TV (1080×1920).
            </p>
          </div>

          <details className="mt-4">
            <summary className="text-xs text-gb-muted cursor-pointer">Ver código fonte do layout</summary>
            <div className="text-[10px] text-gb-muted bg-black p-2 mt-2 rounded overflow-x-auto whitespace-pre">
              {`PREVIEW_W: ${PREVIEW_W}px | PREVIEW_H: ${PREVIEW_H}px | scale: ${scale.toFixed(4)}\n\n`}
              {JSON.stringify(local, null, 2)}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
