"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, User, Calendar, FileText, Stethoscope, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserRole } from '@/types/roles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Odontogram } from '@/components/records/odontogram';

interface RecordDetailsPageProps {
  params: Promise<{ id: string }>;
}

interface ProcedureData {
  code: string;
  description: string;
  tooth?: string;
}

interface RecordData {
  id: string;
  clinicId: string;
  patientId: string;
  dentistId: string;
  appointmentId: string | null;
  description: string;
  procedures: string | null;
  odontogram: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    name: string;
  };
  dentist: {
    id: string;
    specialty: string | null;
    user: {
      id: string;
      name: string;
    };
  };
  appointment: {
    id: string;
    date: string;
  } | null;
}

interface RecordApiResponse {
  success: boolean;
  data?: RecordData;
  error?: string;
}

export default function RecordDetailsPage({ params }: RecordDetailsPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { id } = use(params);
  
  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  const canViewRecords = session?.user?.role !== UserRole.RECEPTIONIST;

  // Redirect if not authorized
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (!canViewRecords) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, canViewRecords, router]);

  // Fetch record data
  useEffect(() => {
    if (canViewRecords && session) {
      fetchRecord();
    }
  }, [id, canViewRecords, session]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/records/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Prontuário não encontrado');
        } else if (response.status === 403) {
          setError('Acesso negado');
        } else {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        return;
      }

      const data: RecordApiResponse = await response.json();

      if (data.success && data.data) {
        setRecord(data.data);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('Erro ao buscar prontuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar prontuário');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (record) {
      router.push(`/patients/${record.patientId}`);
    } else {
      router.back();
    }
  };

  const handlePatientClick = () => {
    if (record) {
      router.push(`/patients/${record.patientId}`);
    }
  };

  // Parse procedures from JSON string
  const getProcedures = (): ProcedureData[] => {
    if (!record?.procedures) return [];
    try {
      return JSON.parse(record.procedures);
    } catch {
      return [];
    }
  };

  // Parse odontogram from JSON string
  const getOdontogram = (): Record<string, string> | null => {
    if (!record?.odontogram) return null;
    try {
      return JSON.parse(record.odontogram);
    } catch {
      return null;
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando prontuário...
        </div>
      </div>
    );
  }

  // Permission denied
  if (!canViewRecords) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar prontuários
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erro ao carregar prontuário</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="outline">
            Voltar
          </Button>
          <Button onClick={fetchRecord}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Record not found
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Prontuário não encontrado</h3>
          <p className="text-muted-foreground">
            O prontuário que você está procurando não existe ou foi removido
          </p>
        </div>
        <Button onClick={handleBack} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const procedures = getProcedures();
  const odontogram = getOdontogram();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Prontuário</h1>
          </div>
        </div>
      </div>

      {/* General Information Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-5 w-5" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Data do Registro</p>
              <p className="text-sm">
                {format(new Date(record.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Paciente</p>
              <Button
                variant="link"
                className="p-0 h-auto text-sm font-normal text-primary hover:underline text-left whitespace-normal"
                onClick={handlePatientClick}
              >
                {record.patient.name}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Dentista</p>
              <div className="text-sm">
                <p className="font-medium">Dr(a). {record.dentist.user.name}</p>
                {record.dentist.specialty && (
                  <p className="text-muted-foreground">{record.dentist.specialty}</p>
                )}
              </div>
            </div>
            {record.appointment && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Consulta Vinculada</p>
                <p className="text-sm">
                  {format(new Date(record.appointment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-5 w-5" />
            Descrição do Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {record.description}
          </p>
        </CardContent>
      </Card>

      {/* Procedures Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Stethoscope className="h-5 w-5" />
            Procedimentos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {procedures.length > 0 ? (
            <>
              {/* Mobile Card View for Procedures */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {procedures.map((procedure, index) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 border rounded-lg space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-primary">{procedure.code}</span>
                      {procedure.tooth && (
                        <Badge variant="outline" className="text-[10px]">
                          Dente {procedure.tooth}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{procedure.description}</p>
                  </div>
                ))}
              </div>

              {/* Tablet/Desktop View for Procedures */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Dente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.map((procedure, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {procedure.code}
                        </TableCell>
                        <TableCell>
                          {procedure.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {procedure.tooth || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum procedimento registrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Odontogram Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5" />
            Odontograma
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {odontogram && Object.keys(odontogram).length > 0 ? (
            <div className="w-full">
              <Odontogram
                data={odontogram}
                readOnly={true}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Odontograma não preenchido</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
