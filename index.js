/** Host half of the Mail bundle: agent tools and the review-panel HTTP route. */

import { MailService } from './lib/service.js'

export const inject = ['tools']

const ROUTE = '/mail-rpc'
const MAX_BODY_BYTES = 2 * 1024 * 1024

/** Read and parse a JSON request body with a hard size bound. */
async function readJson(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error('Request body is too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return null
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sendJson(response, value, status = 200) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(JSON.stringify(value))
}

/**
 * Register the mail tools and the authenticated review-panel route.
 * @param {import('@deepseek-ai/cordis').Context} ctx - host plugin context.
 * @param {object} config - loader row config.
 */
export async function apply(ctx, config) {
  const service = new MailService(ctx, config)

  for (const tool of service.tools()) {
    ctx.effect(() => ctx.tools.register(tool), `dsh-mail: ${tool.name}`)
  }

  ctx.effect(() => {
    service.startWatcher()
    return () => service.stopWatcher()
  }, 'dsh-mail: watcher')

  ctx.inject(['connection', 'webServer'], webCtx => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => {
        const rejection = webCtx.connection.requestRejection(request)
        if (rejection !== undefined) {
          response.writeHead(rejection)
          response.end(rejection === 401 ? 'unauthorized' : 'forbidden')
          return
        }
        if (request.method !== 'POST') {
          response.writeHead(405)
          response.end()
          return
        }
        const url = new URL(request.url ?? '/', 'http://localhost')
        const endpoint = url.pathname.startsWith(`${ROUTE}/`)
          ? url.pathname.slice(ROUTE.length + 1)
          : ''
        if (!/^[a-z]+(?:\/[a-z]+)?$/.test(endpoint)) {
          response.writeHead(404)
          response.end()
          return
        }
        const controller = new AbortController()
        request.once('close', () => controller.abort())
        ;(async () => {
          try {
            const body = await readJson(request)
            const value = await service.handleRpc(endpoint, body?.payload ?? null, controller.signal)
            sendJson(response, { ok: true, value })
          } catch (error) {
            sendJson(response, {
              ok: false,
              error: {
                code: 'mail/failed',
                message: error instanceof Error ? error.message : String(error),
                details: { endpoint },
              },
            })
          }
        })()
      },
    }), 'dsh-mail: review route')
  })
}
