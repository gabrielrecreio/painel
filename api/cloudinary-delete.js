import crypto from 'crypto'

/**
 * Vercel API Route: DELETE uma imagem do Cloudinary usando assinatura HMAC-SHA1.
 * Recebe: { publicId: string } no body JSON.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { publicId } = req.body || {}
  if (!publicId) {
    return res.status(400).json({ error: 'publicId is required' })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary env vars not configured' })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')

  const form = new URLSearchParams()
  form.append('public_id', publicId)
  form.append('timestamp', timestamp)
  form.append('api_key', apiKey)
  form.append('signature', signature)

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: 'POST', body: form }
  )

  const data = await cloudRes.json()
  return res.status(200).json(data)
}
