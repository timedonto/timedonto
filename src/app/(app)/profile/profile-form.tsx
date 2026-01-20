'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateDentistProfileSchema, UpdateDentistProfileInput, COMMON_SPECIALTIES } from '@/modules/dentists/domain/dentist.schema'
import { updateProfileAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, AlertCircle, Loader2, Save, User as UserIcon, Calendar, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileFormProps {
    initialData: {
        user: {
            id: string
            name: string
            email: string
            role: string
        }
        dentist: any | null
    }
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

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState('basic')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const form = useForm<UpdateDentistProfileInput>({
        resolver: zodResolver(updateDentistProfileSchema),
        defaultValues: {
            name: initialData.user.name,
            email: initialData.user.email,
            cro: initialData.dentist?.cro || '',
            specialty: initialData.dentist?.specialty || '',
            commission: initialData.dentist?.commission || 0,
            workingHours: initialData.dentist?.workingHours || {},
            bankInfo: initialData.dentist?.bankInfo || {},
        },
    })

    async function onSubmit(data: UpdateDentistProfileInput) {
        setMessage(null)
        startTransition(async () => {
            const result = await updateProfileAction(data)
            if (result.success) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil' })
            }
        })
    }

    return (
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-12">
                        <TabsTrigger value="basic" className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Básico</span>
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Atendimento</span>
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Financeiro</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-6 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Básicas</CardTitle>
                                <CardDescription>Dados pessoais e profissionais de identificação.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Seu nome" />
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
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="schedule" className="mt-6 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Horários de Atendimento</CardTitle>
                                <CardDescription>Defina os dias e horários que você atende na clínica.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div key={day.id} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">{day.label}</Label>
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name={`workingHours.${day.id}.enabled` as any}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {form.watch(`workingHours.${day.id}.enabled` as any) && (
                                            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                                                <FormField
                                                    control={form.control}
                                                    name={`workingHours.${day.id}.start` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Início</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="time" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`workingHours.${day.id}.end` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Término</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="time" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                        <Separator />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="finance" className="mt-6 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados Financeiros</CardTitle>
                                <CardDescription>Informações de repasse e conta bancária para recebimentos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                    disabled={initialData.user.role !== 'OWNER' && initialData.user.role !== 'ADMIN'}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {initialData.user.role !== 'OWNER' && initialData.user.role !== 'ADMIN'
                                                    ? 'Apenas administradores podem alterar a porcentagem de comissão.'
                                                    : 'Porcentagem de repasse sobre os procedimentos realizados.'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Dados Bancários</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="bankInfo.bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Banco</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Ex: Itaú, Nubank" />
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
                                                        <Input {...field} placeholder="CPF, Email ou Celular" />
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
                                                        <Input {...field} placeholder="0001" />
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
                                                        <Input {...field} placeholder="12345-6" />
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <CardFooter className="px-0 flex justify-end gap-4">
                    <Button type="submit" disabled={isPending} className="min-w-[150px]">
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
                </CardFooter>
            </form>
        </Form>
    )
}
