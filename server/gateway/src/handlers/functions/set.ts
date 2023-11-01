import { createKysely } from '../../dv/kysely'
import { Env } from '../../env'
import { Name } from '../../models'
import { stringifyNameForDb } from './utils'

export async function set(nameData: Name, env: Env) {
  const db = createKysely(env);
  const body = stringifyNameForDb(nameData);

  try {
    await db
      .insertInto('names')
      .values(body)
      .onConflict((oc) => oc.column('name').doUpdateSet(body))
      .execute();
} catch (error) {
    console.error("Error in setting name:", error);
    throw error;
}
}
