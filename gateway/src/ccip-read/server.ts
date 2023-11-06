import { Server } from '@ensdomains/ccip-read-cf-worker'
import { ensResolverAbi } from '../abi/ensResolverAbi'
import { Buffer } from 'node:buffer'
import { BytesLike, ethers } from 'ethers'
import { Result, hexConcat } from 'ethers/lib/utils'
import { Env } from '../env'
import { namehash } from 'viem'
import { normalize } from 'viem/ens'
import { Database, DatabaseResult } from './db'

const Resolver = new ethers.utils.Interface(ensResolverAbi)

export const RESOLVE_ABI = [
  'function resolve(bytes calldata name, bytes calldata data) external view returns (bytes memory result, uint64 expires, bytes memory sig)',
]

function decodeDnsName(dnsname: Buffer) {
  const labels: string[] = []
  let idx = 0
  while (true) {
    const len = dnsname.readUInt8(idx)
    if (len === 0) break
    labels.push(dnsname.slice(idx + 1, idx + len + 1).toString('utf8'))
    idx += len + 1
  }
  return labels.join('.')
}

const queryHandlers: {
  [key: string]: (
    db: Database,
    name: string,
    args: Result,
    env: Env,
  ) => Promise<DatabaseResult>
} = {
  'addr(bytes32)': async (db, name, _args, env) => {
    const { addr, ttl } = await db.addr(name, 60, env)

    return { result: [addr], ttl }
  },
  'addr(bytes32,uint256)': async (db, name, args, env) => {
    const { addr, ttl } = await db.addr(name, args[0], env)
    return { result: [addr], ttl }
  },
  'text(bytes32,string)': async (db, name, args, env) => {
    const { value, ttl } = await db.text(name, args[0], env)
    return { result: [value], ttl }
  },
  'contenthash(bytes32)': async (db, name, _args, env) => {
    const { contenthash, ttl } = await db.contenthash(name, env)
    return { result: [contenthash], ttl }
  },
}

async function query(
  db: Database,
  name: string,
  data: string,
  env: Env,
): Promise<{ result: BytesLike; validUntil: number }> {
  const { signature, args } = Resolver.parseTransaction({ data })

  if (normalize(name) !== name) {
    throw new Error('Name must be normalised')
  }

  if (namehash(name) !== args[0]) {
    throw new Error('Name does not match namehash')
  }

  const handler = queryHandlers[signature]
  if (handler === undefined) {
    throw new Error(`Unsupported query function ${signature} for data ${data}`)
  }
  if (handler === undefined) {
    throw new Error(`Unsupported query function ${signature}`)
  }

  const { result, ttl } = await handler(db, name, args.slice(1), env)

  return {
    result: Resolver.encodeFunctionResult(signature, result),
    validUntil: Math.floor(Date.now() / 1000 + ttl),
  }
}

export function makeServer(
  signer: ethers.utils.SigningKey,
  db: Database | Promise<Database>,
  env: Env,
) {
  const server = new Server()
  server.add(RESOLVE_ABI, [
    {
      type: 'resolve',
      func: async ([encodedName, data]: Result, request) => {
        try {
          const name = decodeDnsName(Buffer.from(encodedName.slice(2), 'hex'))

          // Query the database
          const { result, validUntil } = await query(await db, name, data, env)

          // Hash and sign the response
          let messageHash = ethers.utils.solidityKeccak256(
            ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
            [
              '0x1900',
              request?.to,
              validUntil,
              ethers.utils.keccak256(request?.data || '0x'),
              ethers.utils.keccak256(result),
            ],
          )

          const sig = signer.signDigest(messageHash)
          const sigData = hexConcat([sig.r, sig.s, new Uint8Array([sig.v])])
          return [result, validUntil, sigData]
        } catch (error: any) {
          console.error('Error in resolve:', error.message, error.stack)
          throw new Error(`Error in resolve function: ${error.message}`)
        }
      },
    },
  ])
  return server
}

export function makeApp(
  signer: ethers.utils.SigningKey,
  path: string,
  db: Database | Promise<Database>,
  env: Env,
) {
  return makeServer(signer, db, env).makeApp(path)
}
