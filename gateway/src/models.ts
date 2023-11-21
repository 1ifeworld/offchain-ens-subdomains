import { ColumnType, Generated } from 'kysely'
import z from 'zod'

export const ZodName = z.object({
  id: z.string().optional(),
  name: z.string().regex(/^[a-z0-9-.]+$/),
  owner: z.string(),
	signer: z.string().optional(),
	email: z.string().optional(),
  addresses: z.record(z.string()).optional(),
  texts: z.record(z.string()).optional(),
  contenthash: z.string().optional(),
})

export const ZodNameWithSignature = ZodName.extend({
  signature: z.object({
    hash: z.string(),
    message: z.string(),
  }),
})

export type Name = z.infer<typeof ZodName>
export type NameWithSignature = z.infer<typeof ZodNameWithSignature>

export interface NameInKysely {
  id: string
  name: string
  owner: string
	signer: string
	email: string
  addresses: string | null // D1 doesn't support JSON yet, we'll have to parse it manually
  texts: string | null // D1 doesn't support JSON yet, we'll have to parse it manually
  contenthash: string | null
  createdAt: ColumnType<Date, never, never>
  updatedAt: ColumnType<Date, never, string | undefined>
}
