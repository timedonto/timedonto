'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateDentistProfileSchema, UpdateDentistProfileInput, COMMON_SPECIALTIES } from '@/modules/dentists/domain/dentist.schema'
import { updateDentistProfileAction, getAvailableSpecialtiesAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpecialtyOutput } from '@/modules/specialties/domain/specialty.schema'
import { DentistOutput } from '@/modules/dentists/domain/dentist.schema'

interface DentistEditModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    dentist: DentistOutput
    currentUserRole: string
    onSuccess?: () => void
}

const DAYS_OF_WEEK = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
]

export function DentistEditModal({ open, onOpenChange, dentist, currentUserRole, onSuccess }: DentistEditModalProps) {
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [availableSpecialties, setAvailableSpecialties] = useState<SpecialtyOutput[]>([])
    const [loadingSpecialties, setLoadingSpecialties] = useState(false)
    const [activeTab, setActiveTab] = useState('basic')

    const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

    // Função para formatar data para input date
    const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return ''
        try {
            const date = new Date(dateString)
            return date.toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    const form = useForm<UpdateDentistProfileInput & { specialtyIds?: string[] }>({
        resolver: zodResolver(updateDentistProfileSchema),
        defaultValues: {
            name: dentist.user.name,
            email: dentist.user.email,
            cro: dentist.cro,
            specialty: dentist.specialty || '',
            commission: dentist.commission ? Number(dentist.commission) : undefined,
            workingHours: dentist.workingHours || {},
            bankInfo: {
                bankName: (dentist.bankInfo as any)?.bankName || '',
                pixKey: (dentist.bankInfo as any)?.pixKey || '',
                agency: (dentist.bankInfo as any)?.agency || '',
                account: (dentist.bankInfo as any)?.account || '',
                accountType: (dentist.bankInfo as any)?.accountType || '',
            },
            contactInfo: {
                phone: (dentist.contactInfo as any)?.phone || '',
                whatsapp: (dentist.contactInfo as any)?.whatsapp || '',
            },
            personalInfo: {
                cpf: (dentist.personalInfo as any)?.cpf || '',
                birthDate: formatDateForInput((dentist.personalInfo as any)?.birthDate),
                gender: (dentist.personalInfo as any)?.gender || '',
            },
            specialtyIds: dentist.specialties?.map(s => s.id) || [],
        },
    })

    // Carregar especialidades disponíveis quando o modal abrir
    useEffect(() => {
        if (open && isOwnerOrAdmin) {
            setLoadingSpecialties(true)
            getAvailableSpecialtiesAction()
                .then(setAvailableSpecialties)
                .catch((error) => {
                    console.error('Erro ao carregar especialidades:', error)
                })
                .finally(() => {
                    setLoadingSpecialties(false)
                })
        }
    }, [open, isOwnerOrAdmin])

    // Resetar formulário quando o modal abrir ou o dentista mudar
    useEffect(() => {
        if (open) {
            form.reset({
                name: dentist.user.name,
                email: dentist.user.email,
                cro: dentist.cro,
                specialty: dentist.specialty || '',
                commission: dentist.commission ? Number(dentist.commission) : undefined,
                workingHours: dentist.workingHours || {},
                bankInfo: {
                    bankName: (dentist.bankInfo as any)?.bankName || '',
                    pixKey: (dentist.bankInfo as any)?.pixKey || '',
                    agency: (dentist.bankInfo as any)?.agency || '',
                    account: (dentist.bankInfo as any)?.account || '',
                    accountType: (dentist.bankInfo as any)?.accountType || '',
                },
                contactInfo: {
                    phone: (dentist.contactInfo as any)?.phone || '',
                    whatsapp: (dentist.contactInfo as any)?.whatsapp || '',
                },
                personalInfo: {
                    cpf: (dentist.personalInfo as any)?.cpf || '',
                    birthDate: formatDateForInput((dentist.personalInfo as any)?.birthDate),
                    gender: (dentist.personalInfo as any)?.gender || '',
                },
                specialtyIds: dentist.specialties?.map(s => s.id) || [],
            })
            setMessage(null)
            setActiveTab('basic')
        }
    }, [open, dentist, form])

    async function onSubmit(data: UpdateDentistProfileInput & { specialtyIds?: string[] }) {
        setMessage(null)
        
        // Limpar valores vazios de contactInfo, bankInfo e personalInfo
        const cleanedData = {
            ...data,
            contactInfo: data.contactInfo ? {
                phone: (data.contactInfo as any)?.phone?.trim() || null,
                whatsapp: (data.contactInfo as any)?.whatsapp?.trim() || null,
            } : null,
            bankInfo: data.bankInfo ? {
                bankName: (data.bankInfo as any)?.bankName?.trim() || null,
                pixKey: (data.bankInfo as any)?.pixKey?.trim() || null,
                agency: (data.bankInfo as any)?.agency?.trim() || null,
                account: (data.bankInfo as any)?.account?.trim() || null,
                accountType: (data.bankInfo as any)?.accountType?.trim() || null,
            } : null,
            personalInfo: data.personalInfo ? {
                cpf: (data.personalInfo as any)?.cpf?.trim() || null,
                birthDate: (data.personalInfo as any)?.birthDate?.trim() || null,
                gender: (data.personalInfo as any)?.gender?.trim() || null,
            } : null,
        }
        
        startTransition(async () => {
            const result = await updateDentistProfileAction(dentist.id, cleanedData)
            if (result.success) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
                setTimeout(() => {
                    onOpenChange(false)
                    onSuccess?.()
                }, 1500)
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil' })
            }
        })
    }

    const selectedSpecialtyIds = form.watch('specialtyIds') || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Perfil do Dentista</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {message && (
                            <div className={cn(
                                "p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300",
                                message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                            )}>
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Informações Básicas */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Informações Básicas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Nome completo" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder="seu@email.com" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="personalInfo.cpf"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CPF</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="000.000.000-00" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="personalInfo.birthDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data de Nascimento</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} type="date" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="personalInfo.gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gênero</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="M">Masculino</SelectItem>
                                                        <SelectItem value="F">Feminino</SelectItem>
                                                        <SelectItem value="O">Outro</SelectItem>
                                                        <SelectItem value="N">Prefiro não informar</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="cro"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CRO</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="CRO-SP 12345" />
                                                </FormControl>
                                                <FormDescription>Formato: CRO-UF 00000</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isOwnerOrAdmin && (
                                        <FormField
                                            control={form.control}
                                            name="commission"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Comissão (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Porcentagem de repasse sobre procedimentos</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Especialidades - usando lista fixa ou relacionamento many-to-many */}
                                {isOwnerOrAdmin && availableSpecialties.length > 0 ? (
                                    <FormField
                                        control={form.control}
                                        name="specialtyIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Especialidades</FormLabel>
                                                <FormControl>
                                                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                                                        {loadingSpecialties ? (
                                                            <div className="flex items-center justify-center py-4">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span className="ml-2 text-sm text-muted-foreground">Carregando especialidades...</span>
                                                            </div>
                                                        ) : (
                                                            availableSpecialties.map((specialty) => {
                                                                const isChecked = selectedSpecialtyIds.includes(specialty.id)
                                                                return (
                                                                    <div key={specialty.id} className="flex items-center space-x-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`specialty-${specialty.id}`}
                                                                            checked={isChecked}
                                                                            onChange={(e) => {
                                                                                const currentIds = selectedSpecialtyIds
                                                                                if (e.target.checked) {
                                                                                    field.onChange([...currentIds, specialty.id])
                                                                                } else {
                                                                                    field.onChange(currentIds.filter((id) => id !== specialty.id))
                                                                                }
                                                                            }}
                                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                        />
                                                                        <label
                                                                            htmlFor={`specialty-${specialty.id}`}
                                                                            className="text-sm font-normal leading-none cursor-pointer"
                                                                        >
                                                                            {specialty.name}
                                                                        </label>
                                                                    </div>
                                                                )
                                                            })
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormDescription>Selecione todas as especialidades do dentista</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="specialty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Especialidade</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma especialidade" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {COMMON_SPECIALTIES.map((spec) => (
                                                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                </div>

                                <Separator />

                                {/* Informações de Contato */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Informações de Contato</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="contactInfo.phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Telefone Principal</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ''} placeholder="(11) 99999-9999" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contactInfo.whatsapp"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>WhatsApp de Atendimento</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ''} placeholder="(11) 99999-9999" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Dados Bancários */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold">Dados Bancários (Opcional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bankInfo.bankName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Banco</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Ex: Itaú, Nubank" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankInfo.pixKey"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Chave PIX</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="CPF, Email ou Celular" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bankInfo.agency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Agência</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="0001" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankInfo.account"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Conta</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="12345-6" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankInfo.accountType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Conta</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="checking">Corrente</SelectItem>
                                                        <SelectItem value="savings">Poupança</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
