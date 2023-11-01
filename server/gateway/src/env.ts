import {D1Database} from '@cloudflare/workers-types'
export interface Env {
    PRIVATE_KEY: string
    DB: D1Database
  }
