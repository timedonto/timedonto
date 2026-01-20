"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    createSpecialtySchema,
    CreateSpecialtyData,
    UpdateSpecialtyData,
    SpecialtyOutput
} from "@/modules/specialties/domain/specialty.schema"
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
import { useEffect } from "react"

interface SpecialtyFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    specialty?: SpecialtyOutput
    onSubmit: (data: any) => Promise<void>
}

export function SpecialtyForm({
    open,
    onOpenChange,
    specialty,
    onSubmit
}: SpecialtyFormProps) {
    const isEditing = !!specialty

    const form = useForm<CreateSpecialtyData>({
        resolver: zodResolver(createSpecialtySchema),
        defaultValues: {
            name: "",
            description: "",
            isActive: true
        }
    })

    useEffect(() => {
        if (specialty) {
            form.reset({
                name: specialty.name,
                description: specialty.description || "",
                isActive: specialty.isActive
            })
        } else {
            form.reset({
                name: "",
                description: "",
                isActive: true
            })
        }
    }, [specialty, form])

    const handleSubmit = async (data: CreateSpecialtyData) => {
        try {
            if (isEditing && specialty) {
                await onSubmit({ ...data, id: specialty.id })
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
                        {isEditing ? "Editar Especialidade" : "Nova Especialidade"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Edite os dados da especialidade."
                            : "Preencha os dados para criar uma nova especialidade."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Ortodontia" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
