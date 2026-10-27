/**
 * Vercel API Route: foto de um aluno do ranking (?id=<studentId>&v=<versão>).
 * O parâmetro `v` muda quando o cadastro muda, então dá pra cachear por bastante tempo.
 */
export default async function handler(req, res) {
  const { id } = req.query || {}
  if (!/^[a-f0-9]{24}$/i.test(id || '')) {
    return res.status(400).json({ error: 'id inválido' })
  }

  const baseUrl = process.env.GB_API_URL
  const panelKey = process.env.GB_PANEL_KEY

  if (!baseUrl || !panelKey) {
    return res.status(500).json({ error: 'GB_API_URL / GB_PANEL_KEY não configuradas' })
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/api/public/ranking/photo/${id}`, {
      headers: { 'x-panel-key': panelKey },
    })
    if (!upstream.ok) return res.status(upstream.status).end()

    const image = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
    return res.status(200).send(image)
  } catch {
    return res.status(502).end()
  }
}
