import { createKysely } from '../db/kysely';
import { Env } from '../env';
import type { IRequest } from 'itty-router'
import zod from 'zod';


import { parseNameFromDb } from './functions/utils';

export async function getUsernameById(request: IRequest, env: Env) {
  const schema = zod.object({
    id: zod.string(),
  });
  const safeParse = schema.safeParse(request.params);

  if (!safeParse.success) {
    const response = { error: safeParse.error }
    return Response.json(response, { status: 400 });
  }
  const { id } = safeParse.data;
	console.log("Received ID:", id);
  const db = createKysely(env);

  try {
    const results = await db
      .selectFrom('names')
      .selectAll()
      .where('id', '=', id)
      .execute();

    const safeParse = parseNameFromDb(results);

    if (safeParse.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Username not found' }), { status: 404 });
    }

    const username = safeParse[0].name;

    return new Response(JSON.stringify({ success: true, username }), { status: 200 });
  } catch (error) {
    console.error('Error fetching username by ID:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), { status: 500 });
  }
}
