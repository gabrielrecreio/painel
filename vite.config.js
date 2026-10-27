import fs from 'fs'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Em `npm run dev`, executa as funções de /api (Vercel API Routes) localmente,
 * com as variáveis do .env.local. Em produção quem roda é a própria Vercel.
 */
function vercelApiDev() {
  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const match = /^\/api\/([\w-]+)$/.exec(url.pathname)
        if (!match || !fs.existsSync(path.resolve('api', `${match[1]}.js`))) return next()

        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          req.query = Object.fromEntries(url.searchParams)
          req.body = raw ? JSON.parse(raw) : undefined

          // Helpers que a Vercel adiciona no `res`
          res.status = (code) => { res.statusCode = code; return res }
          res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); return res }
          res.send = (body) => { res.end(body); return res }

          const { default: handler } = await server.ssrLoadModule(`/api/${match[1]}.js`)
          await handler(req, res)
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiDev()],
})
