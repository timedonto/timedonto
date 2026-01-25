"use client"

import * as React from "react"
import { AttendanceStatus } from "@prisma/client"
import {
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle,
    Stethoscope,
    X,
    Play
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { getColumns, Attendance } from "./columns"
import { useRouter } from "next/navigation"

interface AttendanceClientProps {
    initialData: Attendance[]
    loading?: boolean
    selectedDate: string
    onDateChange: (date: string) => void
    onRefresh: () => void
}

export function AttendanceClient({
    initialData,
    loading = false,
    selectedDate,
    onDateChange,
    onRefresh,
}: AttendanceClientProps) {
    const router = useRouter()
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleView = (attendance: Attendance) => {
        router.push(`/attendances/${attendance.id}`)
    }

    const handleStart = async (attendance: Attendance) => {
        try {
            const response = await fetch(`/api/attendances/${attendance.id}/start`, {
                method: 'POST'
            })
            if (response.ok) {
                onRefresh()
                router.push(`/attendances/${attendance.id}`)
            }
        } catch (err) {
            console.error('Erro ao iniciar atendimento:', err)
        }
    }

    const handleFinish = async (attendance: Attendance) => {
        router.push(`/attendances/${attendance.id}?finish=true`)
    }

    const handleCancel = async (attendance: Attendance) => {
        if (!confirm('Deseja realmente cancelar este atendimento?')) return
        try {
            const response = await fetch(`/api/attendances/${attendance.id}/cancel`, {
                method: 'POST'
            })
            if (response.ok) {
                onRefresh()
            }
        } catch (err) {
            console.error('Erro ao cancelar atendimento:', err)
        }
    }

    const columns = React.useMemo(
        () => getColumns({ 
            onView: handleView,
            onStart: handleStart,
            onFinish: handleFinish,
            onCancel: handleCancel
        }),
        []
    )

    const statusOptions = [
        { label: "Check-in", value: "CHECKED_IN", icon: Clock },
        { label: "Em Atendimento", value: "IN_PROGRESS", icon: Play },
        { label: "Finalizado", value: "DONE", icon: CheckCircle2 },
        { label: "Cancelado", value: "CANCELED", icon: XCircle },
        { label: "Não Compareceu", value: "NO_SHOW", icon: AlertCircle },
    ]

    // Sort data: nearest first (by arrivalAt)
    const sortedData = React.useMemo(() => {
        return [...initialData].sort((a, b) => {
            const dateA = new Date(a.arrivalAt).getTime()
            const dateB = new Date(b.arrivalAt).getTime()
            return dateB - dateA // Mais recentes primeiro
        })
    }, [initialData])

    const dateFilter = (
        <div className="flex items-center gap-2">
            <div className="relative">
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="h-8 w-[150px] lg:w-[180px] pl-8"
                />
                <CalendarIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            </div>
            {selectedDate && (
                <Button
                    variant="ghost"
                    onClick={() => onDateChange("")}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )

    if (!isMounted) return null

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            searchKey="patientName"
            toolbarFilters={[
                {
                    columnId: "status",
                    title: "Status",
                    options: statusOptions,
                }
            ]}
            customFilters={dateFilter}
        />
    )
}
