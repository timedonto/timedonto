---
name: Análise Completa - Módulo Procedures
overview: ""
todos: []
---

# Análise Completa - Módulo Procedures (Serviços)

## 1. RESUMO EXECUTIVO

**Status Geral:** ⚠️ **ATENÇÃO** - Módulo funcional mas com problemas críticos de segurança e validação

**Principais Problemas:**

- ❌ Falta validação de `specialtyId` pertencente à mesma clínica
- ❌ Falta validação de `procedureId` ao associar a dentistas
- ❌ Procedimentos inativos podem ser usados em agendamentos
- ❌ Falta camada de Application (use cases)
- ❌ Falta campo `durationMinutes` no modelo Procedure
- ⚠️ Integração com outros módulos usa texto livre em vez de referência

---

## 2. MODELO DE DADOS

### 2.1. Estrutura da Entidade Procedure

**Arquivo:** `prisma/schema.prisma` (linhas 369-389)

```369:389:prisma/schema.prisma
model Procedure {
  id                   String   @id @default(cuid())
  clinicId             String
  specialtyId          String
  name                 String
  description          String?
  baseValue            Decimal  @db.Decimal(10, 2)
  commissionPercentage Decimal  @db.Decimal(5, 2)
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  clinic    Clinic    @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  specialty Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade)
  dentistProcedures DentistProcedure[]

  @@index([clinicId])
  @@index([specialtyId])
  @@index([clinicId, name])
  @@map("procedures")
}
```

**Análise:**

- ✅ Campos obrigatórios presentes: `name`, `baseValue`, `commissionPercentage`, `specialtyId`
- ✅ Relacionamento com `Specialty` correto
- ✅ Relacionamento com `Dentist` via `DentistProcedure` correto
- ✅ Campo `isActive` para controle de status
- ❌ **FALTA:** Campo `durationMinutes` (duração padrão do atendimento)
- ✅ Índices adequados para performance

**Status:** ⚠️ **ATENÇÃO** - Falta campo de duração

### 2.2. Relacionamento DentistProcedure

**Arquivo:** `prisma/schema.prisma` (linhas 390-403)

```390:403:prisma/schema.prisma
model DentistProcedure {
  id          String   @id @default(cuid())
  dentistId   String
  procedureId String
  createdAt   DateTime @default(now())

  dentist   Dentist   @relation(fields: [dentistId], references: [id], onDelete: Cascade)
  procedure Procedure @relation(fields: [procedureId], references: [id], onDelete: Cascade)

  @@unique([dentistId, procedureId])
  @@index([dentistId])
  @@index([procedureId])
  @@map("dentist_procedures")
}
```

**Análise:**

- ✅ Constraint `UNIQUE` evita duplicatas
- ✅ Índices adequados
- ✅ Cascade delete correto

**Status:** ✅ **OK**

---

## 3. REGRAS DE NEGÓCIO

### 3.1. Serviço Ativo/Inativo

**Implementação:**

- Campo `isActive` existe no modelo
- Toggle de status implementado em `toggleProcedureStatusAction`

**Problema Crítico:**

- ❌ **NÃO há validação** se procedimento está ativo ao:
  - Associar a dentista (`update-dentist-procedures.ts`)
  - Usar em agendamentos (campo `procedure` é texto livre)
  - Usar em orçamentos (não há referência a Procedure)

**Status:** ❌ **CRÍTICO** - P0

### 3.2. Duração Padrão do Atendimento

**Problema:**

- ❌ Campo `durationMinutes` **NÃO existe** no modelo Procedure
- Agendamentos têm `durationMinutes` mas não é vinculado ao procedimento
- Usuário precisa informar duração manualmente em cada agendamento

**Impacto:**

- UX ruim (usuário precisa lembrar duração de cada procedimento)
- Inconsistência (mesmo procedimento pode ter durações diferentes)

**Status:** ❌ **CRÍTICO** - P0

### 3.3. Valor Base e Comissão

**Implementação:**

- ✅ Campos `baseValue` e `commissionPercentage` existem
- ✅ Validação Zod: `baseValue >= 0`, `commissionPercentage` entre 0-100

**Problema:**

- ⚠️ Comissão não é validada ao criar orçamento/agendamento
- ⚠️ Valor pode ser alterado sem histórico

**Status:** ⚠️ **ATENÇÃO** - P1

### 3.4. Procedimento Pode Ser Usado por Múltiplos Dentistas?

**Resposta:** ✅ **SIM** (correto)

**Implementação:**

- Relacionamento many-to-many via `DentistProcedure`
- Um procedimento pode estar associado a múltiplos dentistas
- Um dentista pode ter múltiplos procedimentos

**Status:** ✅ **OK**

---

## 4. BACKEND (REPOSITÓRIO E USE CASES)

### 4.1. Estrutura de Arquivos

**Arquivos Existentes:**

- ✅ `src/modules/procedures/domain/procedure.schema.ts` - Schemas Zod
- ✅ `src/modules/procedures/infra/procedure.repository.ts` - Repositório Prisma
- ❌ **FALTA:** `src/modules/procedures/application/` - Use Cases

**Problema Arquitetural:**

- ❌ Lógica de negócio está em Server Actions (`src/app/(app)/services/actions.ts`)
- ❌ Não segue Clean Architecture (Domain → Application → Infra)
- ❌ Validações de regras de negócio misturadas com validações de entrada

**Status:** ❌ **CRÍTICO** - P0

### 4.2. Repositório

**Arquivo:** `src/modules/procedures/infra/procedure.repository.ts`

**Análise:**

**Pontos Positivos:**

- ✅ Métodos CRUD completos
- ✅ Filtro por `clinicId` em todas as queries
- ✅ Método `findMany` com filtros opcionais
- ✅ Método `mapToOutput` para transformação

**Problemas:**

1. **Falta Validação de SpecialtyId:**
```12:34:src/modules/procedures/infra/procedure.repository.ts
async create(clinicId: string, data: CreateProcedureData): Promise<ProcedureOutput> {
    const procedure = await prisma.procedure.create({
        data: {
            clinicId,
            specialtyId: data.specialtyId,
            // ... resto dos dados
        }
    })
}
```


- ❌ **NÃO valida** se `specialtyId` pertence à mesma `clinicId`
- ⚠️ Prisma pode lançar erro de foreign key, mas não é tratado adequadamente

2. **Update sem Validação:**
```93:137:src/modules/procedures/infra/procedure.repository.ts
async update(id: string, clinicId: string, data: UpdateProcedureData): Promise<ProcedureOutput | null> {
    // ... atualiza diretamente sem validar specialtyId
}
```


- ❌ Se `specialtyId` for alterado, não valida se pertence à clínica

3. **Delete é Soft Delete:**
```139:155:src/modules/procedures/infra/procedure.repository.ts
async delete(id: string, clinicId: string): Promise<boolean> {
    try {
        await prisma.procedure.update({
            where: { id, clinicId },
            data: { isActive: false }
        })
        return true
    } catch (error) {
        console.error('Erro ao inativar procedimento:', error)
        return false
    }
}
```


- ✅ Soft delete correto
- ⚠️ Mas não verifica se procedimento está em uso antes de inativar

**Status:** ❌ **CRÍTICO** - P0 (validações faltando)

### 4.3. Server Actions (Substituindo Use Cases)

**Arquivo:** `src/app/(app)/services/actions.ts`

**Análise:**

```76:84:src/app/(app)/services/actions.ts
export async function createProcedureAction(data: any) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])

    const validated = createProcedureSchema.parse(data)

    await procedureRepository.create(user.clinicId, validated)
    revalidatePath('/services')
    return { success: true }
}
```

**Problemas:**

1. ❌ **NÃO valida** se `specialtyId` pertence à clínica
2. ❌ **NÃO valida** se especialidade está ativa
3. ❌ Tratamento de erro genérico (apenas throw)
4. ❌ Retorno não padronizado (`{ success: true }` vs possível erro)

**Status:** ❌ **CRÍTICO** - P0

---

## 5. VALIDAÇÕES E SEGURANÇA

### 5.1. Validação de Entrada (Zod)

**Arquivo:** `src/modules/procedures/domain/procedure.schema.ts`

```7:31:src/modules/procedures/domain/procedure.schema.ts
export const createProcedureSchema = z.object({
  specialtyId: z
    .string()
    .cuid('ID da especialidade deve ser um CUID válido'),
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  baseValue: z.number({ coerce: true }).min(0, 'Valor base deve ser maior ou igual a 0'),
  commissionPercentage: z
    .number({ coerce: true })
    .min(0, 'Comissão deve ser maior ou igual a 0')
    .max(100, 'Comissão deve ser menor ou igual a 100'),
  isActive: z
    .boolean()
    .default(true)
    .optional()
})
```

**Análise:**

- ✅ Validações básicas corretas (tipo, tamanho, range)
- ❌ **FALTA:** Validação de existência e pertencimento à clínica (deve ser no backend)

**Status:** ⚠️ **ATENÇÃO** - P1

### 5.2. Isolamento Multi-Tenant

**Análise:**

**Pontos Positivos:**

- ✅ Todas as queries filtram por `clinicId`
- ✅ Server Actions usam `user.clinicId` da sessão

**Problemas:**

1. **Associação Dentista-Procedimento:**
```56:72:src/modules/dentists/application/update-dentist-procedures.ts
await prisma.$transaction(async (tx) => {
    // Remove all existing links for this dentist
    await tx.dentistProcedure.deleteMany({
        where: { dentistId }
    })

    // Add new links
    if (data.procedureIds.length > 0) {
        await tx.dentistProcedure.createMany({
            data: data.procedureIds.map(procedureId => ({
                dentistId,
                procedureId
            }))
        })
    }
})
```


- ❌ **NÃO valida** se `procedureId` pertence à mesma `clinicId`
- ❌ **NÃO valida** se procedimento está ativo
- ⚠️ Risco de associar procedimento de outra clínica (se IDs forem conhecidos)

**Status:** ❌ **CRÍTICO** - P0

### 5.3. Permissões por Role

**Análise:**

**Criação/Edição:**

```76:84:src/app/(app)/services/actions.ts
export async function createProcedureAction(data: any) {
    const user = await checkAuth([UserRole.OWNER, UserRole.ADMIN])
    // ...
}
```

- ✅ Apenas OWNER e ADMIN podem criar/editar
- ✅ DENTIST e RECEPTIONIST não têm acesso

**Listagem:**

```71:74:src/app/(app)/services/actions.ts
export async function getProceduresAction(specialtyId?: string) {
    const user = await checkAuth()
    return await procedureRepository.findMany(user.clinicId, { specialtyId })
}
```

- ✅ Qualquer usuário autenticado pode listar
- ⚠️ Mas filtra apenas ativos em `getAvailableProcedures` (linha 44)

**Status:** ✅ **OK** (com ressalvas)

---

## 6. INTEGRAÇÕES COM OUTROS MÓDULOS

### 6.1. Agendamentos (Appointments)

**Problema Crítico:**

- ❌ Campo `procedure` em `Appointment` é **String (texto livre)**
- ❌ **NÃO há** relacionamento FK com `Procedure`
- ❌ **NÃO há** validação se procedimento existe ou está ativo

**Arquivo:** `prisma/schema.prisma` (linha 163)

```155:179:prisma/schema.prisma
model Appointment {
  id              String            @id @default(cuid())
  clinicId        String
  dentistId       String
  patientId       String
  date            DateTime
  durationMinutes Int               @default(30)
  status          AppointmentStatus @default(SCHEDULED)
  procedure       String?
  notes           String?           @db.Text
  // ...
}
```

**Impacto:**

- Usuário pode digitar qualquer texto
- Não há consistência de dados
- Não há validação de procedimento inativo
- Não há cálculo automático de duração

**Status:** ❌ **CRÍTICO** - P0

### 6.2. Orçamentos (Treatment Plans)

**Análise:**

- ❌ `TreatmentItem` tem apenas `description` (texto livre)
- ❌ **NÃO há** relacionamento com `Procedure`
- ❌ Valor é informado manualmente (não vem de `baseValue`)

**Arquivo:** `prisma/schema.prisma` (linhas 226-238)

```226:238:prisma/schema.prisma
model TreatmentItem {
  id          String  @id @default(cuid())
  planId      String
  description String
  tooth       String?
  value       Decimal @db.Decimal(10, 2)
  quantity    Int     @default(1)

  plan TreatmentPlan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@index([planId])
  @@map("treatment_items")
}
```

**Impacto:**

- Não há reutilização de dados do Procedure
- Valores podem divergir do cadastro
- Não há validação de procedimento inativo

**Status:** ❌ **CRÍTICO** - P0

### 6.3. Prontuários (Records)

**Análise:**

- Campo `procedures` é **JSON** (estrutura livre)
- ❌ **NÃO há** relacionamento com `Procedure`

**Arquivo:** `prisma/schema.prisma` (linhas 181-201)

```181:201:prisma/schema.prisma

model Record {

id            String   @id @default(cuid())

clinicId      String

patientId     String

dentistId     String

appointmentId String?  @unique

description   String   @d