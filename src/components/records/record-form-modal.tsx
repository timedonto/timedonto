"use client";

import { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Odontogram } from './odontogram';

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
        return `Código do procedimento ${i + 1} é obrigatório`;
      }
      if (!proc.description.trim()) {
        return `Descrição do procedimento ${i + 1} é obrigatória`;
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Registro no Prontuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dentist Selection */}
          <div className="space-y-2">
            <Label htmlFor="dentistId">Dentista *</Label>
            {loadingDentists ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dentistas...
              </div>
            ) : (
              <Select
                value={formData.dentistId}
                onValueChange={(value) => handleInputChange('dentistId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id}>
                      Dr(a). {dentist.user.name} - CRO: {dentist.cro}
                      {dentist.specialty && ` (${dentist.specialty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o atendimento, diagnóstico, tratamento realizado..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {formData.description.length}/10 caracteres mínimos
            </div>
          </div>

          {/* Procedures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Procedimentos Realizados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProcedure}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Procedimento
              </Button>
            </div>

            {formData.procedures.length > 0 && (
              <div className="space-y-3">
                {formData.procedures.map((procedure, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Código *</Label>
                        <Input
                          placeholder="Ex: 01101"
                          value={procedure.code}
                          onChange={(e) => updateProcedure(index, 'code', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição *</Label>
                        <Input
                          placeholder="Ex: Consulta odontológica"
                          value={procedure.description}
                          onChange={(e) => updateProcedure(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Dente (opcional)</Label>
                        <Input
                          placeholder="Ex: 11, 21"
                          value={procedure.tooth || ''}
                          onChange={(e) => updateProcedure(index, 'tooth', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProcedure(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Odontogram */}
          <div className="space-y-4">
            <Label>Odontograma</Label>
            <div className="border rounded-lg p-4">
              <Odontogram
                data={formData.odontogram}
                onChange={handleOdontogramChange}
                readOnly={false}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Registro'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}