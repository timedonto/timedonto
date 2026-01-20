import { Suspense } from 'react'
import { getProfile } from './actions'
import { ProfileForm } from './profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Meu Perfil | Timedonto',
    description: 'Gerencie suas informações pessoais, horários e dados profissionais.',
}

export default async function ProfilePage() {
    const profile = await getProfile()

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Meu Perfil
                </h1>
                <p className="text-muted-foreground">
                    Gerencie suas informações e preferências de atendimento.
                </p>
            </div>

            <Suspense fallback={<ProfileLoading />}>
                <ProfileForm initialData={profile} />
            </Suspense>
        </div>
    )
}

function ProfileLoading() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="h-6 w-1/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-2/4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-muted animate-pulse rounded" />
                        <div className="h-10 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-10 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        </div>
    )
}
