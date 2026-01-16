"use client";

import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Stethoscope, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Odontogram } from './odontogram';
import { Badge } from '@/components/ui/badge';

interface RecordFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onSuccess: () => void;
}

interface Dentist {
  id: string;
  cro: string;
  specialty: string | null;
  user: {
    id: string;
    name: string;
  };
}

interface DentistsApiResponse {
  success: boolean;
  data?: Dentist[];
  error?: string;
}

interface Procedure {
  code: string;
  description: string;
  tooth?: string;
}

interface FormData {
  dentistId: string;
  description: string;
  procedures: Procedure[];
  odontogram: Record<string, string>;
}

export function RecordFormModal({ open, onOpenChange, patientId, onSuccess }: RecordFormModalProps) {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    dentistId: '',
    description: '',
    procedures: [],
    odontogram: {},
  });

  // Fetch dentists when modal opens
  useEffect(() => {
    if (open) {
      fetchDentists();
      // Reset form when modal opens
      setFormData({
        dentistId: '',
        description: '',
        procedures: [],
        odontogram: {},
      });
      setError(null);
    }
  }, [open]);

  const fetchDentists = async () => {
    try {
      setLoadingDentists(true);
      const response = await fetch('/api/dentists');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dentistas');
      }

      const data: DentistsApiResponse = await response.json();
      
      if (data.success && data.data) {
        setDentists(data.data);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Erro ao buscar dentistas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dentistas');
    } finally {
      setLoadingDentists(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addProcedure = () => {
    setFormData(prev => ({
      ...prev,
      procedures: [...prev.procedures, { code: '', description: '', tooth: '' }],
    }));
  };

  const updateProcedure = (index: number, field: keyof Procedure, value: string) => {
    setFormData(prev => ({
      ...prev,
      procedures: prev.procedures.map((proc, i) => 
        i === index ? { ...proc, [field]: value } : proc
      ),
    }));
  };

  const removeProcedure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      procedures: prev.procedures.filter((_, i) => i !== index),
    }));
  };

  const handleOdontogramChange = (data: Record<string, string>) => {
    setFormData(prev => ({
      ...prev,
      odontogram: data,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.dentistId) {
      return 'Selecione um dentista';
    }
    if (!formData.description || formData.description.length < 10) {
      return 'Descrição deve ter pelo menos 10 caracteres';
    }
    
    // Validate procedures
    for (let i = 0; i < formData.procedures.length; i++) {
      const proc = formData.procedures[i];
      if (!proc.code.trim()) {
        return `Item ${i + 1}: Código do procedimento é obrigatório`;
      }
      if (!proc.description.trim()) {
        return `Item ${i + 1}: Descrição do procedimento é obrigatória`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Prepare data for API
      const submitData = {
        dentistId: formData.dentistId,
        description: formData.description,
        procedures: formData.procedures.length > 0 ? formData.procedures.map(proc => ({
          code: proc.code,
          description: proc.description,
          ...(proc.tooth && { tooth: proc.tooth }),
        })) : undefined,
        odontogram: Object.keys(formData.odontogram).length > 0 ? formData.odontogram : undefined,
      };

      const response = await fetch(`/api/patients/${patientId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar registro');
      }

      if (result.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Erro ao criar registro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar registro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ClipboardList className="h-5 w-5 text-primary" />
            Novo Registro no Prontuário
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Dentist Selection */}
          <div className="space-y-2">
            <Label htmlFor="dentistId" className="text-xs sm:text-sm font-medium">Dentista responsável *</Label>
            {loadingDentists ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando profissionais...
              </div>
            ) : (
              <Select
                value={formData.dentistId}
                onValueChange={(value) => handleInputChange('dentistId', value)}
              >
                <SelectTrigger className="h-11 sm:h-10 text-sm">
                  <SelectValue placeholder="Selecione o dentista responsável" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id} className="py-3">
                      <div className="text-left w-full">
                        <div className="font-medium text-sm">Dr(a). {dentist.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          CRO: {dentist.cro} {dentist.specialty && `• ${dentist.specialty}`}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Anamnese / Evolução Clínica *</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhadamente o atendimento, queixas do paciente, diagnóstico e tratamentos realizados..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="resize-none text-sm min-h-[100px] sm:min-h-[120px]"
            />
            <div className="text-[10px] text-right text-muted-foreground uppercase font-bold">
              {formData.description.length} caracteres (mínimo 10)
            </div>
          </div>

          {/* Procedures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Procedimentos Realizados
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProcedure}
                className="flex items-center gap-2 h-9"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
                <span className="sm:hidden text-xs">Adicionar</span>
              </Button>
            </div>

            <div className="space-y-3">
              {formData.procedures.map((procedure, index) => (
                <div key={index} className="p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProcedure(index)}
                    className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive z-10"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remover procedimento</span>
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6 sm:pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Código *</Label>
                      <Input
                        placeholder="Ex: 01101"
                        value={procedure.code}
                        onChange={(e) => updateProcedure(index, 'code', e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                      <Label className="text-xs font-medium text-muted-foreground">Descrição *</Label>
                      <Input
                        placeholder="Ex: Restauração"
                        value={procedure.description}
                        onChange={(e) => updateProcedure(index, 'description', e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Dente (opcional)</Label>
                      <Input
                        placeholder="Ex: 11, 21"
                        value={procedure.tooth || ''}
                        onChange={(e) => updateProcedure(index, 'tooth', e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.procedures.length === 0 && (
                <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs italic">
                  Nenhum procedimento específico adicionado
                </div>
              )}
            </div>
          </div>

          {/* Odontogram */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Odontograma</Label>
            <div className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-950">
              <div className="overflow-x-auto">
                <div className="min-w-[600px] pb-2">
                  <Odontogram
                    data={formData.odontogram}
                    onChange={handleOdontogramChange}
                    readOnly={false}
                  />
                </div>
              </div>
              <div className="text-xs text-center text-muted-foreground border-t pt-3 mt-2">
                <span className="hidden sm:inline">Arraste horizontalmente para ver toda a arcada se necessário</span>
                <span className="sm:hidden">Deslize para ver toda a arcada</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md font-medium">
              {error}
            </div>
          )}

          </form>
        </div>

        {/* Form Actions - Fixed Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t bg-background">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto order-2 sm:order-1 h-11 sm:h-10"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-10"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Registro Completo'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
