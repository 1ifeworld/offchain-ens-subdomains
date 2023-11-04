import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'

import { Env } from '../env'
import { NameInKysely } from '../models'
import { Pool } from 'pg';
export interface Database {
  names: NameInKysely
}

export function createKysely(env: Env): Kysely<Database> {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: pool
    }),
    plugins: [new CamelCasePlugin()],
  });
}


