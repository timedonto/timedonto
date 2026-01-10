import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Valida as variáveis de ambiente
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(parsedEnv.error.flatten().fieldErrors)
  throw new Error('Variáveis de ambiente inválidas')
}

export const env = parsedEnv.data