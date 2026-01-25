import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDentist, getAvailableProcedures } from '../actions'
import { DentistDetailsClient } from './dentist-details-client'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export default async function DentistDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth()

    if (!session?.user?.id || !session?.user?.clinicId) {
        return (
            <div className="container mx-auto py-10">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600 font-medium">Acesso negado. Faça login para continuar.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const dentist = await getDentist(params.id)

    if (!dentist) {
        notFound()
    }

    // Verificar permissões: OWNER/ADMIN podem ver qualquer dentista, DENTIST apenas o próprio
    const isOwnerOrAdmin = session.user.role === UserRole.OWNER || session.user.role === UserRole.ADMIN
    const isOwnProfile = session.user.id === dentist.userId

    if (!isOwnerOrAdmin && !isOwnProfile) {
        return (
            <div className="container mx-auto py-10">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600 font-medium">Acesso negado. Você só pode visualizar seu próprio perfil.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const availableProcedures = await getAvailableProcedures()

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-in fade-in duration-500">
            <Suspense fallback={<DetailsLoading />}>
                <DentistDetailsClient
                    dentist={dentist}
                    availableProcedures={availableProcedures}
                    currentUserRole={session.user.role as any}
                    currentUserId={session.user.id}
                />
            </Suspense>
        </div>
    )
}

function DetailsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-[400px] md:col-span-1" />
                <Skeleton className="h-[400px] md:col-span-2" />
            </div>
        </div>
    )
}
