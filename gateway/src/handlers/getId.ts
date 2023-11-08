import type { IRequest } from 'itty-router'
import zod from 'zod'
import { Env } from '../env'
import { getIdByOwner } from './functions/id'


export async function getId(request: IRequest, env: Env) {
  const schema = zod.object({
    owner: zod.string(),
  })
  const safeParse = schema.safeParse(request.params)

  if (!safeParse.success) {
    const response = { error: safeParse.error }
    return new Response(JSON.stringify(response), { status: 400 })
  }

  const { owner } = safeParse.data

  try {
    const id = await getIdByOwner(owner, env) 
    if (id === null) {
      return new Response('Id not found', { status: 404 })
    }

    return new Response(JSON.stringify({ id }), { status: 200 })
  } catch (error) {
    console.error('Error fetching id by owner:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
