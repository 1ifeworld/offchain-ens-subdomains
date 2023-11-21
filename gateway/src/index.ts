import { Router, IRequest } from 'itty-router'
import { Env } from './env'
import { getName, getNames, setName, getId } from './handlers'
import { getCcipRead } from './handlers/getCcipRead'
import { Client } from 'pg'
import { createKysely } from './db/kysely'

const router = Router()

// CORS Headers function
function getCORSHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

// Pre-flight request handling
function handleOptions(request: Request): Response {
  // Set CORS headers for pre-flight requests
  const origin = request.headers.get('Origin') || '*'
  const headers = getCORSHeaders(origin)
  return new Response(null, { status: 204, headers })
}

router.all('*', async (request, env, ctx) => {
  // Create a Kysely instance
  const db = createKysely(env)

  // Store db in request for use in routes
  request.db = db
})

router.options('*', handleOptions)
router.post('/set', (request, env) => {
  return setName(request, env)
})
router.get('/get/:name', (request, env) => {
  return getName(request, env)
})
router.get('/names', (request: any, env) => {
  return getNames(env)
})
router.get('/id/:owner', (request: any, env) => {
  return getId(request, env)
});
router.get('/username/:id', (request, env) => {
  return getUsernameById(request, env);
});
router.get('/:sender/:data.json', (request, env) => {
  return getCcipRead(request, env)
})
router.all('*', () => {
  return new Response('Not found', { status: 404 })
})

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    try {
      const client = new Client({
        connectionString: env.DATABASE_URL,
      })
      await client.connect()

      let response: Response | undefined = await router.handle(
        request,
        env,
        ctx,
      )

      // Add database client cleanup to the waitUntil so it doesn't hold up the response
      ctx.waitUntil(client.end())

      // Apply the CORS headers to the response
      if (response) {
        const origin = request.headers.get('Origin') || '*'
        const corsHeaders = getCORSHeaders(origin)

        const newHeaders = new Headers(response.headers)
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value)
        })

        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        })
      }

      return response || new Response('Not found', { status: 404 })
    } catch (e) {
      console.error('Error in fetch handler:', e)
      return new Response('An error occurred', {
        status: 500,
        headers: getCORSHeaders('*'),
      })
    }
  },
}
