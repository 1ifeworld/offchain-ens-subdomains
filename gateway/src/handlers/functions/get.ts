import { createKysely } from '../../db/kysely'
import { Env } from '../../env'
import { Name } from '../../models'
import { parseNameFromDb } from './utils'

export async function get(name: string, env: Env): Promise<Name | null> {
  ;('Entering get function') // Log entry to function
  try {
    const db = createKysely(env)
    ;('Executing database query')
    const record = await db
      .selectFrom('names')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst()

    if (!record) {
      ;('No record found')
      return null
    }
    ;('Parsing record from database')
    return parseNameFromDb(record)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error caught in get function:', error, error.stack)
    } else {
      console.error('Error caught in get function:', error)
    }
    throw error // Re-throw the error to be handled by the calling function
  }
}
