import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Schema de validação
const signupSchema = z.object({
  clinicName: z.string().min(2, 'Nome da clínica deve ter pelo menos 2 caracteres'),
  ownerName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Valida os dados
    const validatedData = signupSchema.safeParse(body)
    
    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, error: validatedData.error.errors[0].message },
        { status: 400 }
      )
    }

    const { clinicName, ownerName, email, password } = validatedData.data

    // Verifica se já existe um usuário com este email
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const passwordHash = await hash(password, 12)

    // Cria a clínica e o usuário owner em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria a clínica
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          email: email,
        },
      })

      // 2. Cria o usuário owner
      const user = await tx.user.create({
        data: {
          clinicId: clinic.id,
          name: ownerName,
          email: email,
          passwordHash: passwordHash,
          role: 'OWNER',
          isActive: true,
        },
      })

      return { clinic, user }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          clinicId: result.clinic.id,
          userId: result.user.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro no signup:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}