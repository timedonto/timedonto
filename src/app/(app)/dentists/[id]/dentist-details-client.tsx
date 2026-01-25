'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { DentistProfileHeader } from './components/dentist-profile-header'
import { DentistInfoTab } from './components/dentist-info-tab'
import { DentistServicesTab } from './components/dentist-services-tab'
import { DentistScheduleTab } from './components/dentist-schedule-tab'
import { DentistFinancialTab } from './components/dentist-financial-tab'
import { DentistRecordsTab } from './components/dentist-records-tab'
import { DentistBudgetsTab } from './components/dentist-budgets-tab'
import { DentistEditModal } from './components/dentist-edit-modal'
import { updateDentistProceduresAction } from '../actions'
import {
    User,
    Calendar,
    FileText,
    FileSpreadsheet,
    DollarSign,
    Stethoscope,
} from 'lucide-react'

interface DentistDetailsClientProps {
    dentist: any
    availableProcedures: any[]
    currentUserRole: string
    currentUserId: string
}

export function DentistDetailsClient({
    dentist,
    availableProcedures,
    currentUserRole,
    currentUserId,
}: DentistDetailsClientProps) {
    const [activeTab, setActiveTab] = useState('info')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const router = useRouter()

    const canManageProcedures = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

    const handleSaveProcedures = async (procedureIds: string[]) => {
        const result = await updateDentistProceduresAction(dentist.id, procedureIds)
        return result
    }

    const handleEditSuccess = () => {
        // Recarregar a página para atualizar os dados
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dentists" className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                            </svg>
                            Profissionais
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{dentist.user.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Profile Header */}
            <DentistProfileHeader
                dentist={dentist}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                onEditClick={() => setIsEditModalOpen(true)}
            />

            {/* Edit Modal */}
            <DentistEditModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                dentist={dentist}
                currentUserRole={currentUserRole}
                onSuccess={handleEditSuccess}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                        <TabsList className="flex px-2 gap-10 bg-transparent h-auto p-0 w-full justify-start">
                            <TabsTrigger
                                value="info"
                                className="flex items-center justify-center border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-[#678380] hover:text-primary pb-4 pt-2 transition-colors whitespace-nowrap bg-transparent rounded-none"
                            >
                                <User className="w-4 h-4 mr-2" />
                                <p className="text-sm font-bold tracking-tight">Informações</p>
                            </TabsTrigger>
                            <TabsTrigger
                                value="schedule"
                                className="flex items-center justify-center border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-[#678380] hover:text-primary pb-4 pt-2 transition-colors whitespace-nowrap bg-transparent rounded-none"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                <p className="text-sm font-bold tracking-tight">Agenda</p>
                            </TabsTrigger>
                            <TabsTrigger
                                value="records"
                                className="flex items-center justify-center border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-[#678380] hover:text-primary pb-4 pt-2 transition-colors whitespace-nowrap bg-transparent rounded-none"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                <p className="text-sm font-bold tracking-tight">Prontuários</p>
                            </TabsTrigger>
                            <TabsTrigger
                                value="budgets"
                                className="flex items-center justify-center border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-[#678380] hover:text-primary pb-4 pt-2 transition-colors whitespace-nowrap bg-transparent rounded-none"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                <p className="text-sm font-bold tracking-tight">Orçamentos</p>
                            </TabsTrigger>
                            <TabsTrigger
                                value="financial"
                                className="flex items-center justify-center border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-[#678380] hover:text-primary pb-4 pt-2 transition-colors whitespace-nowrap bg-transparent rounded-none"
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                <p className="text-sm font-bold tracking-tight">Financeiro</p>
                            </TabsTrigger>
                            <TabsTrigger
                                value="services"
                                className="flex items-center justify-center border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-[#678380] hover:text-primary pb-4 pt-2 transition-colors whitespace-nowrap bg-transparent rounded-none"
                            >
                                <Stethoscope className="w-4 h-4 mr-2" />
                                <p className="text-sm font-bold tracking-tight">Serviços</p>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="info" className="mt-0">
                    <DentistInfoTab dentist={dentist} />
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                    <DentistScheduleTab dentistId={dentist.id} />
                </TabsContent>

                <TabsContent value="records" className="mt-0">
                    <DentistRecordsTab dentistId={dentist.id} />
                </TabsContent>

                <TabsContent value="budgets" className="mt-0">
                    <DentistBudgetsTab dentistId={dentist.id} />
                </TabsContent>

                <TabsContent value="financial" className="mt-0">
                    <DentistFinancialTab dentistId={dentist.id} />
                </TabsContent>

                <TabsContent value="services" className="mt-0">
                    <DentistServicesTab
                        dentist={dentist}
                        availableProcedures={availableProcedures}
                        onSave={handleSaveProcedures}
                        canManage={canManageProcedures}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
