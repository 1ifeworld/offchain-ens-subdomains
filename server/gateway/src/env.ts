import {D1Database} from '@cloudflare/workers-types'
export interface Env {
    PRIVATE_KEY: string
    DB: D1Database
		DATABASE_URL: string
		DB_USERNAME : string;
		DB_HOST : string;
		DB_PORT :string;
		DB_NAME : string;
  }
