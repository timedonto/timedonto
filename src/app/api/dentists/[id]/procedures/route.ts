import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database'

/**
 * GET /api/dentists/[id]/procedures
 * Retorna procedimentos vinculados a um dentista específico
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verificar autenticação
        const session = await auth()
        if (!session?.user?.clinicId) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { id: dentistId } = await params

        // Buscar procedimentos vinculados ao dentista
        const dentistProcedures = await prisma.dentistProcedure.findMany({
            where: {
                dentistId,
                dentist: {
                    clinicId: session.user.clinicId // Garantir isolamento multi-tenant
                },
                procedure: {
                    isActive: true, // Apenas procedimentos ativos
                    clinicId: session.user.clinicId // Garantir que procedimento pertence à clínica
                }
            },
            include: {
                procedure: {
                    include: {
                        specialty: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                procedure: {
                    name: 'asc'
                }
            }
        })

        // Mapear para formato esperado
        const procedures = dentistProcedures.map(dp => ({
            id: dp.procedure.id,
            name: dp.procedure.name,
            description: dp.procedure.description,
            baseValue: Number(dp.procedure.baseValue),
            commissionPercentage: Number(dp.procedure.commissionPercentage),
            isActive: dp.procedure.isActive,
            specialty: dp.procedure.specialty
        }))

        return NextResponse.json({
            success: true,
            data: procedures
        })

    } catch (error) {
        console.error('Erro ao buscar procedimentos do dentista:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
