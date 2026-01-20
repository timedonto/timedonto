# Análise Profunda do Módulo Dentistas - TimeDonto

**Data:** 2025-01-XX  
**Versão do Sistema:** 1.0.0  
**Status Geral:** ⚠️ **ATENÇÃO** - Requer correções antes de produção

---

## 1. RESUMO EXECUTIVO

### Estado Atual
- ✅ **Modelo de Dados:** Bem estruturado, alinhado com schema.prisma
- ⚠️ **Regras de Negócio:** Parcialmente implementadas, com gaps críticos
- ⚠️ **Backend:** Use cases implementados, mas faltam validações importantes
- ⚠️ **APIs:** Funcionais, mas com possíveis vazamentos de dados
- ⚠️ **Frontend:** Funcional, mas UX pode ser melhorada
- ❌ **Integrações:** Faltam validações críticas em agendamentos

### Problemas Críticos Identificados
1. **P0 - CRÍTICO:** Agendamentos podem ser criados para dentistas com usuário inativo
2. **P0 - CRÍTICO:** Listagem de dentistas não filtra por status ativo do usuário
3. **P0 - CRÍTICO:** Falta validação de role DENTIST ao criar dentista (apenas warning)
4. **P1 - ALTO:** Dentista pode editar próprio perfil, mas não há validação de campos sensíveis
5. **P1 - ALTO:** DELETE hard delete sem verificar dependências (agendamentos, orçamentos, prontuários)

---

## 2. MODELO DE DADOS

### 2.1. Estrutura da Entidade Dentist

**Schema Prisma:**
```prisma
model Dentist {
  id           String   @id @default(cuid())
  clinicId     String
  userId       String   @unique
  cro          String
  specialty    String?
  workingHours Json?
  bankInfo     Json?
  commission   Decimal? @db.Decimal(5, 2)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  // Relacionamentos
  clinic         Clinic
  user           User
  appointments   Appointment[]
  records        Record[]
  treatmentPlans TreatmentPlan[]
  dentistProcedures DentistProcedure[]
}
```

**Status:** ✅ **OK**

**Análise:**
- Estrutura correta e alinhada com `data-model.md`
- Relacionamento 1:1 com User está correto (`userId @unique`)
- Campo `clinicId` presente (multi-tenant)
- Campos opcionais bem definidos
- Relacionamentos com outras entidades corretos

**Inconsistências com data-model.md:**
- ❌ `data-model.md` não menciona `bankInfo` e `commission`, mas estão no schema (OK - evolução)
- ✅ `workingHours` como JSON está correto
- ✅ `specialty` como String? está correto (permite múltiplas especialidades separadas por vírgula)

### 2.2. Relacionamento User ↔ Dentist

**Status:** ⚠️ **ATENÇÃO**

**Estrutura:**
- User 1:1 Dentist (correto)
- User tem campo `isActive` (Boolean)
- Dentist NÃO tem campo `isActive` próprio

**Problema Identificado:**
- O status ativo/inativo do dentista depende do `user.isActive`
- Isso está correto conceitualmente, mas cria dependências que precisam ser validadas em todos os lugares

**Impacto:**
- Listagens podem mostrar dentistas inativos
- Agendamentos podem ser criados para dentistas inativos
- Orçamentos podem ser criados para dentistas inativos

---

## 3. REGRAS DE NEGÓCIO

### 3.1. Relação User ↔ Dentist (1:1)

**Status:** ✅ **OK**

**Implementação:**
- `userId` é `@unique` no schema (garante 1:1)
- Validação em `create-dentist.ts` verifica se usuário já é dentista
- Cascade delete configurado corretamente

### 3.2. Validação de Role

**Status:** ⚠️ **ATENÇÃO**

**Implementação Atual:**
```typescript
// create-dentist.ts linha 84-88
if (user.role !== UserRole.DENTIST) {
  warning = `Atenção: O usuário tem o cargo "${user.role}" mas está sendo cadastrado como dentista. Considere alterar o cargo do usuário para "DENTIST".`
}
```

**Problema:**
- ❌ Apenas gera **warning**, não impede criação
- ❌ Permite criar dentista para usuário com role ADMIN, OWNER, RECEPTIONIST
- ⚠️ Isso pode causar confusão e problemas de permissão

**Recomendação:**
- **P0:** Tornar obrigatório que `user.role === DENTIST` OU
- **P1:** Auto-alterar role para DENTIST ao criar dentista (com permissão)

### 3.3. Ativação/Desativação

**Status:** ❌ **CRÍTICO**

**Problema:**
- Dentist não tem campo `isActive` próprio
- Status depende de `user.isActive`
- **Falta validação em múltiplos pontos:**

1. **Listagem de Dentistas:**
   - `list-dentists.ts` e `dentist.repository.ts` NÃO filtram por `user.isActive`
   - Retorna todos os dentistas, incluindo inativos

2. **Criação de Agendamentos:**
   - `create-appointment.ts` NÃO valida se dentista está ativo
   - Permite criar agendamento para dentista inativo

3. **Criação de Orçamentos:**
   - ✅ `create-treatment-plan.ts` VALIDA `dentist.user.isActive` (linha 64)
   - ✅ Correto!

4. **Seletores no Frontend:**
   - ✅ `appointment-form-modal.tsx` filtra por `dentist.user.isActive` (linha 133)
   - ✅ Correto no frontend, mas deveria ser no backend também

**Impacto:**
- Dentistas inativos aparecem em listagens
- Agendamentos podem ser criados para dentistas inativos (via API direta)
- Inconsistência entre frontend e backend

### 3.4. Comissão

**Status:** ✅ **OK**

**Implementação:**
- Campo `commission` como `Decimal?` (opcional)
- Validação Zod: 0-100% (linha 39-43 de `dentist.schema.ts`)
- Permite comissão global por dentista
- Comissão por procedimento está em `Procedure.commissionPercentage`

**Observação:**
- Não há lógica de cálculo de comissão ainda (não é problema do módulo Dentistas)

### 3.5. Especialidades

**Status:** ⚠️ **ATENÇÃO**

**Implementação:**
- Campo `specialty` como `String?` (opcional)
- Permite string simples ou múltiplas separadas por vírgula (transform no schema)
- Lista de especialidades comuns em `COMMON_SPECIALTIES` (linha 274-300)

**Problemas:**
- ❌ Não há validação se especialidade existe na tabela `Specialty`
- ❌ Não há relacionamento direto com tabela `Specialty`
- ⚠️ Especialidades são texto livre, não normalizadas

**Impacto:**
- Pode haver inconsistências (ex: "Ortodontia" vs "Ortodontia e Ortopedia")
- Não há busca por especialidade normalizada
- Dificulta relatórios e filtros

**Recomendação:**
- **P2:** Considerar relacionamento Many-to-Many com `Specialty` no futuro
- **P1:** Validar especialidades contra lista de valores permitidos

---

## 4. BACKEND (USE CASES + REPOSITÓRIO)

### 4.1. Criação de Dentista

**Arquivo:** `src/modules/dentists/application/create-dentist.ts`

**Validações Implementadas:**
- ✅ Permissão (OWNER/ADMIN)
- ✅ Usuário existe e pertence à clínica
- ✅ Usuário está ativo
- ✅ Usuário não é dentista ainda
- ✅ CRO único na clínica
- ⚠️ Role DENTIST (apenas warning)

**Status:** ⚠️ **ATENÇÃO** - Falta tornar role DENTIST obrigatório

### 4.2. Edição de Dentista

**Arquivo:** `src/modules/dentists/application/update-dentist.ts`

**Validações Implementadas:**
- ✅ Permissão (OWNER/ADMIN)
- ✅ Dentista existe na clínica
- ✅ CRO único (se alterado)

**Problemas:**
- ❌ Não valida se `user.isActive` mudou (se usuário foi desativado)
- ❌ Não impede edição de dentista inativo (pode ser intencional)

**Status:** ✅ **OK** (com ressalvas)

### 4.3. Listagem de Dentistas

**Arquivo:** `src/modules/dentists/application/list-dentists.ts`

**Problema Crítico:**
- ❌ **NÃO filtra por `user.isActive`**
- ❌ Retorna dentistas inativos na listagem

**Código:**
```typescript
// dentist.repository.ts linha 15-79
async findMany(clinicId: string, filters?: ListDentistsInput): Promise<DentistOutput[]> {
  const where: Prisma.DentistWhereInput = {
    clinicId,
    // ❌ FALTA: user: { isActive: true }
  }
}
```

**Status:** ❌ **CRÍTICO** - P0

**Impacto:**
- Listagem mostra dentistas inativos
- Pode confundir usuários
- Inconsistente com `findActiveDentists()` que filtra corretamente

### 4.4. Repositório

**Arquivo:** `src/modules/dentists/infra/dentist.repository.ts`

**Métodos Críticos:**

1. **`findMany()`** - ❌ Não filtra por ativo
2. **`findActiveDentists()`** - ✅ Filtra corretamente por `user.isActive`
3. **`findBySpecialty()`** - ✅ Filtra por ativo
4. **`countActiveDentists()`** - ✅ Filtra corretamente

**Inconsistência:**
- Métodos específicos filtram por ativo
- Método genérico `findMany()` não filtra
- `list-dentists.ts` usa `findMany()` (problema)

### 4.5. Isolamento Multi-Tenant

**Status:** ✅ **OK**

**Validações:**
- ✅ Todos os métodos recebem `clinicId`
- ✅ Todas as queries filtram por `clinicId`
- ✅ Validação de pertencimento à clínica em use cases

**Sem problemas identificados.**

### 4.6. Impacto da Desativação do Usuário

**Status:** ❌ **CRÍTICO**

**Problema:**
- Quando `user.isActive = false`, o dentista fica "inativo"
- Mas não há validação em:
  - ❌ Listagem de dentistas
  - ❌ Criação de agendamentos
  - ✅ Criação de orçamentos (valida corretamente)

**Cenário de Risco:**
1. Admin desativa usuário (user.isActive = false)
2. Dentista ainda aparece em listagens
3. Agendamentos ainda podem ser criados para ele (via API)
4. Orçamentos são bloqueados corretamente

**Status:** ❌ **CRÍTICO** - P0

---

## 5. APIs

### 5.1. Rotas Disponíveis

**GET /api/dentists**
- ✅ Autenticação
- ✅ Retorna lista de dentistas
- ❌ **Não filtra por ativo**

**POST /api/dentists**
- ✅ Autenticação
- ✅ Permissão (OWNER/ADMIN)
- ✅ Validação de entrada
- ✅ Chama use case corretamente

**GET /api/dentists/[id]**
- ✅ Autenticação
- ✅ Validação de pertencimento à clínica
- ⚠️ **Não verifica permissão específica** (qualquer usuário autenticado pode ver)

**PATCH /api/dentists/[id]**
- ✅ Autenticação
- ✅ Permissão (OWNER/ADMIN)
- ✅ Validação de entrada

**DELETE /api/dentists/[id]**
- ✅ Autenticação
- ✅ Permissão (OWNER/ADMIN)
- ❌ **Hard delete sem verificar dependências**

### 5.2. Permissões por Role

**Status:** ⚠️ **ATENÇÃO**

**GET /api/dentists/[id]:**
- ❌ Qualquer usuário autenticado pode ver qualquer dentista
- ❌ Não verifica se é próprio perfil ou se tem permissão
- ⚠️ Deveria permitir: OWNER/ADMIN (todos) ou DENTIST (próprio perfil)

**Comparação:**
- `src/app/(app)/dentists/[id]/page.tsx` (linha 20) bloqueia para não-OWNER/ADMIN
- Mas API não valida isso

**Status:** ⚠️ **ATENÇÃO** - Possível vazamento de dados

### 5.3. Validação de Entrada

**Status:** ✅ **OK**

**Validações:**
- ✅ Todos os endpoints validam entrada com Zod
- ✅ Schemas bem definidos
- ✅ Mensagens de erro claras

### 5.4. Possíveis Vazamentos de Dados

**Problemas Identificados:**

1. **GET /api/dentists/[id]:**
   - ❌ Não valida permissão específica
   - ❌ Qualquer usuário pode ver qualquer dentista da clínica
   - ⚠️ DENTIST pode ver dados de outros dentistas (incluindo comissão, bankInfo)

2. **GET /api/dentists:**
   - ❌ Retorna todos os dentistas, incluindo inativos
   - ⚠️ Expõe dados de dentistas que não deveriam aparecer

**Status:** ⚠️ **ATENÇÃO** - P1

---

## 6. FRONTEND / UI

### 6.1. Listagem de Dentistas

**Arquivo:** `src/app/(app)/dentists/page.tsx`

**Status:** ⚠️ **ATENÇÃO**

**Problemas:**
- ❌ Não filtra dentistas inativos no frontend
- ❌ Mostra todos os dentistas retornados pela API
- ⚠️ Depende do backend para filtrar (que não está filtrando)

**Recomendação:**
- Filtrar no frontend como workaround temporário
- Corrigir backend para filtrar corretamente

### 6.2. Perfil do Dentista

**Arquivo:** `src/app/(app)/dentists/[id]/page.tsx`

**Status:** ✅ **OK**

**Implementação:**
- ✅ Bloqueia acesso para não-OWNER/ADMIN (linha 20)
- ✅ Usa Server Action `getDentist()` que valida permissão
- ✅ Mostra informações completas do dentista

**Observação:**
- Página administrativa (OWNER/ADMIN apenas)
- Dentista próprio perfil usa `/profile` (diferente)

### 6.3. Diferença entre "Meu Perfil" e "Ver Dentista"

**Status:** ✅ **OK**

**Implementação:**

1. **"Meu Perfil" (`/profile`):**
   - Arquivo: `src/app/(app)/profile/`
   - Usa `updateDentistProfile()` (permite auto-edição)
   - Validação: próprio perfil OU OWNER/ADMIN

2. **"Ver Dentista" (`/dentists/[id]`):**
   - Arquivo: `src/app/(app)/dentists/[id]/`
   - Visão administrativa completa
   - Apenas OWNER/ADMIN
   - Mostra tabs: Info, Agenda, Serviços, Prontuários, Financeiro

**Status:** ✅ **OK** - Separação clara

### 6.4. UX e Clareza para Gerente x Dentista

**Status:** ⚠️ **ATENÇÃO**

**Problemas:**
- ⚠️ Dentista inativo ainda aparece em listagens (pode confundir)
- ⚠️ Não há indicador visual claro de status ativo/inativo na listagem principal
- ✅ Há indicador no perfil detalhado (`dentist-profile-header.tsx` linha 59)

**Recomendação:**
- Adicionar badge/indicador de status na listagem
- Filtrar inativos por padrão (com opção de mostrar)

---

## 7. INTEGRAÇÕES

### 7.1. Agenda (Appointments)

**Status:** ❌ **CRÍTICO**

**Problema:**
- `create-appointment.ts` **NÃO valida** se dentista está ativo
- Permite criar agendamento para dentista inativo (via API)

**Código:**
```typescript
// create-appointment.ts
// ❌ FALTA validação:
// const dentist = await dentistRepository.findById(...)
// if (!dentist.user.isActive) { return error }
```

**Impacto:**
- Agendamentos podem ser criados para dentistas inativos
- Pode causar confusão e problemas operacionais

**Status:** ❌ **CRÍTICO** - P0

### 7.2. Orçamentos (Treatment Plans)

**Status:** ✅ **OK**

**Validação:**
```typescript
// create-treatment-plan.ts linha 64
if (!dentist.user.isActive) {
  return { success: false, error: 'Dentista está inativo' }
}
```

**Status:** ✅ **OK** - Validação correta

### 7.3. Serviços (Procedures)

**Status:** ✅ **OK**

**Implementação:**
- `update-dentist-procedures.ts` gerencia vínculo dentista-procedimento
- Valida permissão (OWNER/ADMIN)
- Usa transação para garantir atomicidade

**Status:** ✅ **OK**

### 7.4. Prontuários (Records)

**Status:** ⚠️ **NÃO ANALISADO**

**Observação:**
- Prontuários têm relacionamento com Dentist
- Não foi verificado se há validação de status ativo
- Recomendação: Verificar se prontuários podem ser criados para dentista inativo

### 7.5. Relatórios

**Status:** ⚠️ **ATENÇÃO**

**Implementação:**
- `src/app/api/reports/appointments/route.ts` filtra por dentista
- Se DENTIST, busca dentista associado ao usuário (linha 83-98)
- ✅ Filtra corretamente

**Status:** ✅ **OK**

---

## 8. REGRAS CRÍTICAS

### 8.1. Dentista Inativo Pode Aparecer na Agenda?

**Resposta:** ❌ **SIM (PROBLEMA)**

**Análise:**
- ❌ `create-appointment.ts` não valida status ativo
- ✅ `appointment-form-modal.tsx` filtra no frontend (linha 133)
- ⚠️ Mas API permite criar diretamente

**Status:** ❌ **CRÍTICO** - P0

### 8.2. Dentista Pode Editar o Próprio Perfil?

**Resposta:** ✅ **SIM (CORRETO)**

**Implementação:**
- `update-dentist-profile.ts` permite auto-edição
- Validação: próprio perfil OU OWNER/ADMIN (linha 43)
- Pode editar: nome, email, CRO, especialidade, horários, dados bancários, comissão

**Problema Potencial:**
- ⚠️ Dentista pode alterar própria comissão (pode ser intencional ou não)
- ⚠️ Dentista pode alterar CRO (pode ser problemático)

**Status:** ⚠️ **ATENÇÃO** - P1 (revisar regras de negócio)

### 8.3. Quem Gerencia Serviços do Dentista?

**Resposta:** ✅ **OWNER/ADMIN (CORRETO)**

**Implementação:**
- `update-dentist-procedures.ts` valida permissão (linha 37)
- Apenas OWNER/ADMIN podem gerenciar procedimentos do dentista
- Dentista não pode alterar próprios procedimentos

**Status:** ✅ **OK**

---

## 9. DIAGNÓSTICO DO ESTADO ATUAL

### 9.1. Por Categoria

| Categoria | Status | Observações |
|-----------|--------|-------------|
| **Modelo de Dados** | ✅ OK | Estrutura correta, alinhada com schema |
| **Regras de Negócio** | ⚠️ ATENÇÃO | Faltam validações críticas de status |
| **Backend (Use Cases)** | ⚠️ ATENÇÃO | Listagem não filtra ativos, falta validação em agendamentos |
| **Repositório** | ⚠️ ATENÇÃO | Inconsistência: `findMany()` não filtra, outros métodos filtram |
| **APIs** | ⚠️ ATENÇÃO | Possível vazamento de dados em GET /api/dentists/[id] |
| **Frontend** | ⚠️ ATENÇÃO | Mostra dentistas inativos, depende de backend |
| **Integrações** | ❌ CRÍTICO | Agendamentos não validam status ativo |

### 9.2. Severidade dos Problemas

**P0 - BLOQUEADORES (Críticos):**
1. ❌ Listagem de dentistas não filtra por `user.isActive`
2. ❌ Criação de agendamentos não valida se dentista está ativo
3. ⚠️ Role DENTIST não é obrigatório ao criar dentista (apenas warning)

**P1 - ALTO (Importantes):**
1. ⚠️ GET /api/dentists/[id] não valida permissão específica (qualquer usuário pode ver)
2. ⚠️ DELETE hard delete sem verificar dependências
3. ⚠️ Dentista pode editar própria comissão e CRO (revisar regra de negócio)
4. ⚠️ Especialidades não são normalizadas (texto livre)

**P2 - MÉDIO (Melhorias):**
1. ⚠️ Adicionar indicador visual de status na listagem
2. ⚠️ Considerar relacionamento Many-to-Many com Specialty
3. ⚠️ Validar especialidades contra lista de valores permitidos

---

## 10. LISTA DE CORREÇÕES P0 (BLOQUEADORES)

### 10.1. Filtrar Dentistas Ativos na Listagem

**Arquivo:** `src/modules/dentists/infra/dentist.repository.ts`

**Mudança:**
```typescript
// Linha 15-18
async findMany(clinicId: string, filters?: ListDentistsInput): Promise<DentistOutput[]> {
  const where: Prisma.DentistWhereInput = {
    clinicId,
    user: { isActive: true } // ✅ ADICIONAR
  }
}
```

**Impacto:**
- Listagem só retorna dentistas ativos
- Consistente com outros métodos do repositório
- Alinha frontend e backend

### 10.2. Validar Status Ativo ao Criar Agendamento

**Arquivo:** `src/modules/appointments/application/create-appointment.ts`

**Mudança:**
```typescript
// Adicionar após validação de conflito (linha 43)
const dentist = await dentistRepository.findById(validatedData.dentistId, clinicId)
if (!dentist) {
  return {
    success: false,
    error: 'Dentista não encontrado'
  }
}

if (!dentist.user.isActive) {
  return {
    success: false,
    error: 'Não é possível criar agendamento para dentista inativo'
  }
}
```

**Impacto:**
- Impede criação de agendamentos para dentistas inativos
- Consistente com validação em orçamentos

### 10.3. Tornar Role DENTIST Obrigatório

**Arquivo:** `src/modules/dentists/application/create-dentist.ts`

**Mudança:**
```typescript
// Linha 84-88 - Alterar de warning para erro
if (user.role !== UserRole.DENTIST) {
  return {
    success: false,
    error: 'Apenas usuários com cargo DENTIST podem ser cadastrados como dentistas'
  }
}
```

**Impacto:**
- Garante consistência entre role e entidade Dentist
- Evita confusão e problemas de permissão

---

## 11. LISTA DE CORREÇÕES P1

### 11.1. Validar Permissão em GET /api/dentists/[id]

**Arquivo:** `src/app/api/dentists/[id]/route.ts`

**Mudança:**
```typescript
// Adicionar após linha 28
const userRole = session.user.role as UserRole
const isOwnerOrAdmin = userRole === UserRole.OWNER || userRole === UserRole.ADMIN
const isOwnProfile = session.user.id === dentist.userId

if (!isOwnerOrAdmin && !isOwnProfile) {
  return NextResponse.json(
    { success: false, error: 'Permissão insuficiente' },
    { status: 403 }
  )
}
```

**Impacto:**
- Impede que DENTIST veja dados de outros dentistas
- Protege informações sensíveis (comissão, bankInfo)

### 11.2. Verificar Dependências Antes de Deletar

**Arquivo:** `src/app/api/dentists/[id]/route.ts` (DELETE)

**Mudança:**
```typescript
// Adicionar antes de deletar (linha 162)
// Verificar agendamentos futuros
const futureAppointments = await prisma.appointment.count({
  where: {
    dentistId,
    clinicId: session.user.clinicId,
    date: { gte: new Date() },
    status: { not: 'CANCELED' }
  }
})

if (futureAppointments > 0) {
  return NextResponse.json(
    { success: false, error: 'Não é possível deletar dentista com agendamentos futuros' },
    { status: 400 }
  )
}

// Verificar orçamentos abertos
const openTreatmentPlans = await prisma.treatmentPlan.count({
  where: {
    dentistId,
    clinicId: session.user.clinicId,
    status: 'OPEN'
  }
})

if (openTreatmentPlans > 0) {
  return NextResponse.json(
    { success: false, error: 'Não é possível deletar dentista com orçamentos abertos' },
    { status: 400 }
  )
}
```

**Impacto:**
- Impede deletar dentista com dependências ativas
- Protege integridade dos dados

### 11.3. Revisar Regras de Edição de Perfil

**Arquivo:** `src/modules/dentists/application/update-dentist-profile.ts`

**Recomendação:**
- Definir quais campos dentista pode editar:
  - ✅ Pode: nome, email, workingHours
  - ⚠️ Revisar: CRO, specialty, bankInfo, commission
- Se dentista não pode editar comissão, adicionar validação:
```typescript
if (currentUserId === userId && validatedData.commission !== undefined) {
  return {
    success: false,
    error: 'Você não pode alterar sua própria comissão'
  }
}
```

---

## 12. LISTA DE MELHORIAS P2

### 12.1. Adicionar Indicador Visual de Status

**Arquivo:** `src/app/(app)/dentists/columns.tsx`

**Mudança:**
- Adicionar badge/indicador de status ativo/inativo na coluna
- Usar componente Badge do shadcn/ui

### 12.2. Normalizar Especialidades

**Recomendação:**
- Considerar relacionamento Many-to-Many com `Specialty`
- Ou validar contra lista de valores permitidos
- Melhorar busca e filtros

### 12.3. Adicionar Filtro de Status na Listagem

**Recomendação:**
- Adicionar filtro "Mostrar inativos" na UI
- Filtrar por padrão, mas permitir mostrar todos

---

## 13. RISCOS TÉCNICOS

### 13.1. Se o Módulo Permanecer Como Está

**Riscos Identificados:**

1. **Agendamentos para Dentistas Inativos:**
   - ⚠️ Risco: Operacional
   - Impacto: Agendamentos podem ser criados para dentistas que não trabalham mais
   - Probabilidade: Média (depende de uso da API direta)

2. **Vazamento de Dados:**
   - ⚠️ Risco: Segurança/Privacidade
   - Impacto: DENTIST pode ver comissão e dados bancários de outros dentistas
   - Probabilidade: Baixa (requer conhecimento técnico)

3. **Inconsistência de Dados:**
   - ⚠️ Risco: Integridade
   - Impacto: Dentistas inativos aparecem em listagens, causando confusão
   - Probabilidade: Alta (acontece sempre)

4. **Hard Delete sem Validação:**
   - ⚠️ Risco: Integridade
   - Impacto: Deletar dentista com agendamentos/orçamentos ativos pode quebrar relacionamentos
   - Probabilidade: Média (depende de uso)

### 13.2. Priorização de Correções

**Ordem Recomendada:**
1. **P0.1** - Filtrar ativos na listagem (rápido, alto impacto)
2. **P0.2** - Validar status em agendamentos (rápido, alto impacto)
3. **P0.3** - Tornar role DENTIST obrigatório (rápido, médio impacto)
4. **P1.1** - Validar permissão em GET (rápido, médio impacto)
5. **P1.2** - Verificar dependências no DELETE (médio, alto impacto)
6. **P1.3** - Revisar regras de edição (médio, baixo impacto)

---

## 14. CHECKLIST DE CORREÇÕES

### 14.1. Antes de Avançar (P0)

- [ ] **P0.1** - Filtrar dentistas ativos em `dentist.repository.findMany()`
- [ ] **P0.2** - Validar status ativo em `create-appointment.ts`
- [ ] **P0.3** - Tornar role DENTIST obrigatório em `create-dentist.ts`
- [ ] **Teste:** Listagem não mostra dentistas inativos
- [ ] **Teste:** Não é possível criar agendamento para dentista inativo
- [ ] **Teste:** Não é possível criar dentista para usuário sem role DENTIST

### 14.2. Antes de Produção (P1)

- [ ] **P1.1** - Validar permissão em GET /api/dentists/[id]
- [ ] **P1.2** - Verificar dependências antes de deletar dentista
- [ ] **P1.3** - Revisar e documentar regras de edição de perfil
- [ ] **Teste:** DENTIST não pode ver dados de outros dentistas
- [ ] **Teste:** Não é possível deletar dentista com dependências

### 14.3. Melhorias Futuras (P2)

- [ ] Adicionar indicador visual de status na listagem
- [ ] Considerar normalização de especialidades
- [ ] Adicionar filtro de status na UI

---

## 15. CONCLUSÃO

### 15.1. Estado Geral

O módulo Dentistas está **funcional**, mas possui **gaps críticos** que precisam ser corrigidos antes de produção:

- ✅ Estrutura de dados sólida
- ✅ Arquitetura limpa (Clean Architecture)
- ⚠️ Faltam validações críticas de status
- ⚠️ Possíveis vazamentos de dados
- ❌ Inconsistências entre frontend e backend

### 15.2. Recomendação Final

**Status:** ⚠️ **NÃO PRONTO PARA PRODUÇÃO**

**Ações Imediatas:**
1. Corrigir todos os itens P0 (bloqueadores)
2. Implementar itens P1 (importantes)
3. Testar cenários críticos
4. Revisar e documentar regras de negócio

**Estimativa de Correção:**
- P0: 2-4 horas
- P1: 4-6 horas
- **Total:** 6-10 horas

---

**Fim do Documento**
