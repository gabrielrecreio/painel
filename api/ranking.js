/**
 * Vercel API Route: repassa o ranking de presenças do mês vindo do GB Frequência.
 * A chave (GB_PANEL_KEY) fica só aqui no servidor, nunca vai pro navegador da TV.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const baseUrl = process.env.GB_API_URL
  const panelKey = process.env.GB_PANEL_KEY

  if (!baseUrl || !panelKey) {
    return res.status(500).json({ error: 'GB_API_URL / GB_PANEL_KEY não configuradas' })
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/api/public/ranking`, {
      headers: { 'x-panel-key': panelKey },
    })
    const data = await upstream.json()
    if (!upstream.ok) return res.status(upstream.status).json(data)

    // Cache curto na borda da Vercel: presença confirmada aparece em ~1 min
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: `Falha ao buscar ranking: ${err.message}` })
  }
}
