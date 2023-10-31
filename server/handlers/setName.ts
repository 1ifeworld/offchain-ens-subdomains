import { verifyMessage } from 'ethers/lib/utils'
import { IRequest } from 'itty-router'

import { Env } from '../env'
import { ZodNameWithSignature, ZodName } from '../models'
import { get } from './functions/get'
import { set } from './functions/set'

export async function setName(request: IRequest, env: Env): Promise<Response> {
  const body = await request.json()
  console.log("BODY")
  const safeParse = ZodName.safeParse(body)

  if (!safeParse.success) {
    const response = { success: false, error: safeParse.error }
    console.log("NOT PARSED")
    return Response.json(response, { status: 400 })
  }
  console.log("PRESAFE", safeParse.data)
  const { name, owner } = safeParse.data
  console.log("SAFEPARSE", safeParse.data)

  // Only allow 3LDs, no nested subdomains
  if (name.split('.').length !== 3) {
    console.log("SPLIT")
    const response = { success: false, error: 'Invalid name' }
    return Response.json(response, { status: 400 })
  }

  // // Validate signature
  // try {
  //   const signer = verifyMessage(signature.message, signature.hash)
  //   if (signer.toLowerCase() !== owner.toLowerCase()) {
  //     throw new Error('Invalid signer')
  //   }
  // } catch (err) {
  //   console.error(err)
  //   const response = { success: false, error: err }
  //   return Response.json(response, { status: 401 })
  // }

  // Check if the name is already taken
  const existingName = await get(name, env)
  console.log("EXISTINGNAME")

  // If the name is owned by someone else, return an error
  if (existingName && existingName.owner !== owner) {
    const response = { success: false, error: 'Name already taken' }
    return Response.json(response, { status: 409 })
  }

  // Save the name
  try {
    console.log("AWAITINGSET")
    await set(safeParse.data, env)
    const response = { success: true }
    return Response.json(response, { status: 201 })
  } catch (err) {
    console.error(err)
    const response = { success: false, error: 'Error setting name' }
    return Response.json(response, { status: 500 })
  }
}