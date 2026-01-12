import { hash } from 'bcryptjs'
import { prisma } from '@/lib/database'
import type { CreateClinicData, ApiResponse } from '@/types'

interface SignupResult {
  clinicId: string
  userId: string
}

export async function signupUseCase(
  data: CreateClinicData
): Promise<ApiResponse<SignupResult>> {
  try {
    const { clinicName, ownerName, email, password } = data

    // Verifica se já existe usuário com este email
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'Este email já está em uso',
      }
    }

    // Hash da senha
    const passwordHash = await hash(password, 12)

    // Cria clínica e usuário em transação
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          email: email,
        },
      })

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

    return {
      success: true,
      data: {
        clinicId: result.clinic.id,
        userId: result.user.id,
      },
    }
  } catch (error) {
    console.error('Erro no signup:', error)
    return {
      success: false,
      error: 'Erro ao criar conta. Tente novamente.',
    }
  }
}