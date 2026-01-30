"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    createProcedureSchema,
    CreateProcedureData,
    ProcedureOutput
} from "@/modules/procedures/domain/procedure.schema"
import { SpecialtyOutput } from "@/modules/specialties/domain/specialty.schema"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"

interface ProcedureFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    procedure?: ProcedureOutput
    specialties: SpecialtyOutput[]
    defaultSpecialtyId?: string
    onSubmit: (data: any) => Promise<void>
}

export function ProcedureForm({
    open,
    onOpenChange,
    procedure,
    specialties,
    defaultSpecialtyId,
    onSubmit
}: ProcedureFormProps) {
    const isEditing = !!procedure

    const form = useForm<CreateProcedureData>({
        resolver: zodResolver(createProcedureSchema) as Resolver<CreateProcedureData>,
        defaultValues: {
            specialtyId: defaultSpecialtyId || "",
            name: "",
            description: "",
            baseValue: 0,
            commissionPercentage: 0,
            isActive: true
        }
    })

    useEffect(() => {
        if (procedure) {
            form.reset({
                specialtyId: procedure.specialtyId,
                name: procedure.name,
                description: procedure.description || "",
                baseValue: Number(procedure.baseValue),
                commissionPercentage: Number(procedure.commissionPercentage),
                isActive: procedure.isActive
            })
        } else {
            form.reset({
                specialtyId: defaultSpecialtyId || "",
                name: "",
                description: "",
                baseValue: 0,
                commissionPercentage: 0,
                isActive: true
            })
        }
    }, [procedure, defaultSpecialtyId, form])

    const handleSubmit = async (data: CreateProcedureData) => {
        try {
            if (isEditing && procedure) {
                await onSubmit({ ...data, id: procedure.id })
            } else {
                await onSubmit(data)
            }
            onOpenChange(false)
            form.reset()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Procedimento" : "Novo Procedimento"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Edite os dados do procedimento."
                            : "Preencha os dados para criar um novo procedimento."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="specialtyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Especialidade</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma especialidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {specialties.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Limpeza" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="baseValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Base (R$)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0,00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="commissionPercentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comissão (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                placeholder="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descrição opcional..."
                                            className="resize-none"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Ativo</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value ?? true}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {isEditing ? "Salvar" : "Criar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
