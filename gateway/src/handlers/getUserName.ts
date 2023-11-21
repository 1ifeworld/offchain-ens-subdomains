import { createKysely } from '../db/kysely';
import { Env } from '../env';
import type { IRequest } from 'itty-router'

import { parseNameFromDb } from './functions/utils';

export async function getUsernameById(request: IRequest, env: Env) {
  const id = request.params.id;
  const db = createKysely(env);

  try {
    const results = await db
      .selectFrom('names')
      .selectAll()
      .where('id', '=', id)
      .execute();

    const safeParse = parseNameFromDb(results);

    if (safeParse.length === 0) {
      return new Response('Username not found', { status: 404 });
    }

    const username = safeParse[0].name;

    return new Response(JSON.stringify({ username }), { status: 200 });
  } catch (error) {
    console.error('Error fetching username by ID:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
