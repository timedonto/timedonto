"use client"

import * as React from "react"
import { UserRole } from "@/types/roles"
import { Plus, CheckCircle2, XCircle, ShieldCheck, UserCog, Stethoscope, Contact } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { getColumns, User } from "./columns"

interface UsersClientProps {
    initialData: User[]
    onEdit: (user: User) => void
    onToggleStatus: (userId: string, currentStatus: boolean) => void
    onCreate: () => void
    loading?: boolean
    currentUserId?: string
}

export function UsersClient({
    initialData,
    onEdit,
    onToggleStatus,
    onCreate,
    loading = false,
    currentUserId,
}: UsersClientProps) {
    const columns = React.useMemo(
        () => getColumns({ onEdit, onToggleStatus, currentUserId }),
        [onEdit, onToggleStatus, currentUserId]
    )

    const roleOptions = [
        { label: "Proprietário", value: "OWNER", icon: ShieldCheck },
        { label: "Administrador", value: "ADMIN", icon: UserCog },
        { label: "Dentista", value: "DENTIST", icon: Stethoscope },
        { label: "Recepcionista", value: "RECEPTIONIST", icon: Contact },
    ]

    const statusOptions = [
        { label: "Ativo", value: "active", icon: CheckCircle2 },
        { label: "Inativo", value: "inactive", icon: XCircle },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
                    <p className="text-muted-foreground">
                        Gerencie o acesso dos colaboradores à clínica
                    </p>
                </div>
                <Button onClick={onCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Usuário
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={initialData}
                searchKey="name"
                searchPlaceholder="Filtrar por nome..."
                loading={loading}
                filters={[
                    {
                        columnId: "role",
                        title: "Cargo",
                        options: roleOptions,
                    },
                    {
                        columnId: "isActive",
                        title: "Status",
                        options: statusOptions,
                    },
                ]}
            />
        </div>
    )
}
