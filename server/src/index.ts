import { Router, createCors } from 'itty-router'

import { Env } from '../env'
import {  getName, getNames, setName } from '../handlers'
import { getCcipRead } from './ccip-read/getCCIPRead'


const { preflight, corsify } = createCors()
const router = Router()

router
  .all('*', preflight)
  .get('/lookup/*', (request, env) => getCcipRead(request, env))
  .get('/get/:name', (request, env) => getName(request, env))
  .get('/names', (request, env) => getNames(env))
  .post('/set', (request, env) => setName(request, env))
  .all('*', () => new Response('Not found', { status: 404 }))

// Handle requests to the Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env).then(corsify)
  },
}