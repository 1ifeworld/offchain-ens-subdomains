import { verifyMessage } from 'ethers/lib/utils'
import { IRequest } from 'itty-router'

import { Env } from '../env'
import { ZodNameWithSignature, ZodName } from '../models'
import { get } from './functions/get'
import { set } from './functions/set'


export async function setName(request: IRequest, env: Env): Promise<Response> {
  const body = await request.json()
  const safeParse = ZodName.safeParse(body)

  if (!safeParse.success) {
    const response = { success: false, error: safeParse.error }
    return Response.json(response, { status: 400 })
  }
  const { name, owner } = safeParse.data

  // Only allow 3LDs, no nested subdomains
  if (name.split('.').length !== 3) {
    const response = { success: false, error: 'Invalid name' }
    return Response.json(response, { status: 400 })
  }//   } //     throw new Error('Invalid signer') //   if (signer.toLowerCase() !== owner.toLowerCase()) { //   const signer = verifyMessage(signature.message, signature.hash) // try { // // Validate signature
  // } catch (err) {
  //   console.error(err)
  //   const response = { success: false, error: err }
  //   return Response.json(response, { status: 401 })
  // }

  // Check if the name is already taken
  ;('Checking existing name')
  const existingName = await get(name, env)

  // If the name is owned by someone else, return an error
  if (existingName && existingName.owner !== owner) {
    const response = { success: false, error: 'Name already taken' }
    return Response.json(response, { status: 409 })
  }

  // Save the name
  try {
    ;('Setting new name')
    await set(safeParse.data, env)
    const response = { success: true }
    return Response.json(response, { status: 201 })
  } catch (err) {
    console.error(err)
    console.error('Error caught in setName:', err)
    const errorMessage =
      err instanceof Error ? err.message : 'An unexpected error occurred'
    const response = { success: false, error: errorMessage }
    return Response.json(response, { status: 500 })
  }
}
