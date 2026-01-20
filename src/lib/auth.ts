import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/database'
import type { UserRole } from '@prisma/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Busca o usuário no banco
        const user = await prisma.user.findFirst({
          where: {
            email: email,
            isActive: true,
          },
          include: {
            clinic: true,
          },
        })

        if (!user) {
          return null
        }

        // Verifica a senha
        const isPasswordValid = await compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // Retorna os dados do usuário para a sessão
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          clinicId: user.clinicId,
          clinicName: user.clinic.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Primeira vez que o usuário faz login
      if (user) {
        token.id = user.id
        token.role = user.role
        token.clinicId = user.clinicId
        token.clinicName = user.clinicName
      }
      return token
    },
    async session({ session, token }) {
      // Adiciona os dados do token na sessão
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.clinicId = token.clinicId as string
        session.user.clinicName = token.clinicName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  trustHost: true,
  experimental: {
    enableWebAuthn: false,
  },
})