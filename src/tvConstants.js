// Dimensões de referência do canvas da TV (portrait)
export const TV_REF_W = 1080
export const TV_REF_H = 1920

// Layout padrão das 5 áreas (coordenadas em px no canvas 1080×1920)
export const DEFAULT_LAYOUT = {
  header:   { x: 0, y: 0,    w: 1080, h: 130 },
  clock:    { x: 0, y: 140,  w: 1080, h: 180 },
  schedule: { x: 0, y: 330,  w: 1080, h: 700 },
  video:    { x: 0, y: 1040, w: 1080, h: 460 },
  banner:   { x: 0, y: 1510, w: 1080, h: 380 },
}

// Ranking de presenças: tempo na tela normal antes de girar e tempo exibindo o ranking
export const DEFAULT_RANKING_CONFIG = {
  enabled: true,
  intervalMinutes: 5,
  displaySeconds: 90,
}

export function parseRankingConfig(value) {
  try {
    const parsed = value ? JSON.parse(value) : {}
    return { ...DEFAULT_RANKING_CONFIG, ...parsed }
  } catch {
    return DEFAULT_RANKING_CONFIG
  }
}
