# Análise Profunda do Módulo de Usuários - TimeDonto

**Data:** 2025-01-XX  
**Versão do Sistema:** 1.0.0  
**Status Geral:** ⚠️ **ATENÇÃO** - Requer correções críticas antes de produção

---

## 📋 Sumário Executivo

O módulo de Usuários está **funcionalmente implementado**, mas apresenta **vulnerabilidades críticas de segurança** e **falhas de validação** que podem comprometer a integridade do sistema multi-tenant. A arquitetura segue os padrões do projeto (Clean Architecture), mas há lacunas importantes em validações de entrada, segurança e regras de negócio.

**Prioridade de Correção:** 🔴 **CRÍTICA** - Não deve ir para produção sem correções.

---

## 1. Modelo de Dados

### 1.1. Entidade User no Schema Prisma

**Status:** ✅ **OK** - Alinhado com `data-model.md`

**Campos Implementados:**
- ✅ `id` (String, cuid)
- ✅ `clinicId` (String, FK → Clinic)
- ✅ `name` (String)
- ✅ `email` (String)
- ✅ `passwordHash` (String)
- ✅ `role` (UserRole enum)
- ✅ `isActive` (Boolean, default: true) - **Soft delete implementado**
- ✅ `createdAt` / `updatedAt` (DateTime)

**Relacionamentos:**
- ✅ `clinic` (1:N com Clinic)
- ✅ `dentist` (1:1 opcional com Dentist)
- ✅ `auditLogs` (1:N)
- ✅ `inventoryMovements` (1:N)

**Constraints:**
- ✅ `@@unique([clinicId, email])` - Email único por clínica
- ✅ `@@index([clinicId])` - Índice para queries multi-tenant

**Conformidade com data-model.md:**
- ✅ Todos os campos obrigatórios presentes
- ✅ Campo `isActive` adicionado (não estava no data-model.md, mas é necessário)
- ✅ Relacionamento com Dentist correto

**Problemas Identificados:**
- ⚠️ **Nenhum** - Modelo de dados está correto

---

## 2. Autenticação e Sessão

### 2.1. Configuração Auth.js / NextAuth

**Arquivo:** `src/lib/auth.ts`

**Status:** 🔴 **CRÍTICO** - Vulnerabilidade de segurança grave

**Problemas Críticos:**

#### 🔴 **CRÍTICO 1: Busca de usuário sem filtro por clinicId**

```24:32:src/lib/auth.ts
// Busca o usuário no banco
const user = await prisma.user.findFirst({
  where: {
    email: email,
    isActive: true,
  },
  include: {
    clinic: true,
  },
})
```

**Problema:** A busca por email **não filtra por clinicId**. Isso significa que:
- Se duas clínicas tiverem usuários com o mesmo email, o sistema pode autenticar o usuário errado
- Um usuário de uma clínica pode potencialmente acessar dados de outra clínica se o email coincidir
- Viola o princípio de isolamento multi-tenant

**Impacto:** 🔴 **CRÍTICO** - Quebra de isolamento de dados entre clínicas

**Solução Necessária:**
- Adicionar campo `clinicId` no formulário de login OU
- Usar subdomínio/domínio para identificar a clínica OU
- Adicionar campo de seleção de clínica no login

#### ⚠️ **ATENÇÃO: Email não é normalizado antes da busca**

O email é passado diretamente sem `.toLowerCase()`, mas o repositório normaliza. Isso pode causar inconsistências.

**Sessão e Tipagem:**

**Status:** ✅ **OK**

A sessão está corretamente tipada em `src/types/next-auth.d.ts`:
- ✅ `id`, `name`, `email`, `role`, `clinicId`, `clinicName` disponíveis
- ✅ Tipos corretos (UserRole do Prisma)
- ✅ Callbacks JWT e Session implementados corretamente

**Configuração:**
- ✅ Strategy: JWT (correto para multi-tenant)
- ✅ MaxAge: 24 horas
- ✅ Páginas customizadas (`/login`)

---

## 3. Permissões e Roles

### 3.1. Implementação de Roles

**Arquivo:** `src/config/permissions.ts`

**Status:** ✅ **OK** - Bem implementado

**Roles Definidas:**
- ✅ OWNER
- ✅ ADMIN
- ✅ DENTIST
- ✅ RECEPTIONIST

**Sistema de Permissões:**
- ✅ Centralizado em `permissions.ts`
- ✅ Função `hasPermission()` reutilizável
- ✅ Permissões bem definidas por role

**Hierarquia de Permissões:**
- ✅ OWNER > ADMIN > DENTIST > RECEPTIONIST (respeitada)

**Componente de Proteção:**
- ✅ `RequireRole` implementado em `src/components/auth/require-role.tsx`
- ✅ Verifica sessão via API
- ✅ Redireciona ou mostra erro apropriado

**Problemas Identificados:**
- ⚠️ **Nenhum crítico** - Sistema de permissões está correto

---

## 4. Backend (Use Cases + Repositórios)

### 4.1. Casos de Uso

**Arquivos:**
- `src/modules/users/application/create-user.ts`
- `src/modules/users/application/update-user.ts`
- `src/modules/users/application/list-users.ts`

**Status:** ⚠️ **ATENÇÃO** - Regras de negócio parcialmente implementadas

#### ✅ **Pontos Positivos:**

1. **Validação com Zod:**
   - ✅ Schemas definidos em `domain/user.schema.ts`
   - ✅ Validação de entrada nos use cases

2. **Regras de Negócio Implementadas:**
   - ✅ Apenas OWNER e ADMIN podem criar/editar usuários
   - ✅ ADMIN não pode criar OWNER
   - ✅ ADMIN não pode editar OWNER
   - ✅ ADMIN não pode promover para OWNER
   - ✅ Não pode desativar/rebaixar único OWNER
   - ✅ Email único por clínica validado

3. **Isolamento Multi-Tenant:**
   - ✅ Todas as queries filtram por `clinicId`
   - ✅ Repositório valida `clinicId` em todas as operações

#### 🔴 **Problemas Críticos:**

**CRÍTICO 2: Usuário pode desativar a si mesmo**

```26:130:src/modules/users/application/update-user.ts
export async function updateUser(params: UpdateUserParams): Promise<UpdateUserResult> {
  const { userId, clinicId, currentUserId, currentUserRole, data } = params
  // ... validações ...
  // ❌ FALTA: Verificação se currentUserId === userId e data.isActive === false
}
```

**Problema:** Um usuário pode desativar a si mesmo, bloqueando seu próprio acesso ao sistema.

**Impacto:** 🔴 **CRÍTICO** - Usuário pode se trancar fora do sistema

**Solução Necessária:**
```typescript
// Adicionar validação:
if (currentUserId === userId && validatedData.isActive === false) {
  return {
    success: false,
    error: 'Você não pode desativar sua própria conta'
  }
}
```

**CRÍTICO 3: Usuário pode alterar seu próprio role**

Não há validação que impeça um usuário de alterar seu próprio cargo (ex: ADMIN se promover a OWNER).

**Solução Necessária:**
```typescript
if (currentUserId === userId && validatedData.role && validatedData.role !== targetUser.role) {
  return {
    success: false,
    error: 'Você não pode alterar seu próprio cargo'
  }
}
```

#### ⚠️ **Atenção:**

1. **Falta validação de OWNER único na criação:**
   - Não há validação que impeça criar múltiplos OWNERs
   - Embora não seja crítico, pode ser uma regra de negócio desejada

2. **Tratamento de erros genérico:**
   - Erros retornam mensagens genéricas ("Erro interno do servidor")
   - Não diferencia tipos de erro (validação, negócio, sistema)

### 4.2. Repositório

**Arquivo:** `src/modules/users/infra/user.repository.ts`

**Status:** ✅ **OK** - Bem implementado

**Pontos Positivos:**
- ✅ Todas as queries filtram por `clinicId`
- ✅ Select explícito (nunca retorna `passwordHash` em listagens)
- ✅ Métodos auxiliares bem organizados
- ✅ Hash de senha com bcrypt (SALT_ROUNDS = 10)
- ✅ Email normalizado (toLowerCase)

**Problemas Identificados:**
- ⚠️ **Nenhum crítico**

**Observação:**
- O método `findByEmailWithPassword` existe mas não é usado no auth.ts (que busca diretamente via Prisma)

---

## 5. APIs

### 5.1. Rotas da API

**Arquivos:**
- `src/app/api/users/route.ts` (GET, POST)
- `src/app/api/users/[id]/route.ts` (GET, PATCH, DELETE)

**Status:** 🔴 **CRÍTICO** - Falta validação de entrada

#### 🔴 **CRÍTICO 4: Falta validação Zod nas rotas**

**POST /api/users:**
```90:106:src/app/api/users/route.ts
// Ler e validar body
let body
try {
  body = await request.json()
} catch {
  return NextResponse.json(
    { success: false, error: 'Body da requisição inválido' },
    { status: 400 }
  )
}

// Chamar use case
const result = await createUser({
  clinicId: session.user.clinicId,
  currentUserRole: userRole,
  data: body  // ❌ Body não é validado com Zod antes de passar para use case
})
```

**Problema:** O body é passado diretamente para o use case sem validação Zod na camada de API. Embora o use case valide, a validação deveria acontecer também na API para retornar erros HTTP apropriados.

**PATCH /api/users/[id]:**
Mesmo problema - body não é validado antes de chamar `updateUser`.

**Impacto:** ⚠️ **ATENÇÃO** - Não é crítico porque o use case valida, mas viola o padrão do projeto (validação em todas as camadas)

**Solução Necessária:**
```typescript
// Validar com Zod antes de chamar use case
const validation = createUserSchema.safeParse(body)
if (!validation.success) {
  return NextResponse.json(
    { success: false, error: validation.error.issues[0].message },
    { status: 400 }
  )
}
```

#### ✅ **Pontos Positivos:**

1. **Autenticação:**
   - ✅ Todas as rotas verificam sessão
   - ✅ Retorna 401 se não autenticado

2. **Autorização:**
   - ✅ GET e POST verificam role (OWNER ou ADMIN)
   - ✅ GET [id] permite qualquer usuário autenticado (pode ser questionável)

3. **Formato de Resposta:**
   - ✅ Consistente: `{ success: boolean, data?: any, error?: string }`
   - ✅ Status HTTP apropriados (201 para criação, 400 para erro de validação)

4. **Tratamento de Erros:**
   - ✅ Try/catch em todas as rotas
   - ✅ Logs de erro no servidor
   - ✅ Mensagens amigáveis ao cliente

#### ⚠️ **Atenção:**

1. **GET /api/users/[id] não verifica permissão:**
   - Qualquer usuário autenticado pode buscar qualquer usuário da mesma clínica
   - Pode ser intencional, mas deveria ser documentado

2. **DELETE usa PATCH internamente:**
   - DELETE chama `updateUser` com `isActive: false`
   - Funcional, mas pode ser confuso

---

## 6. Frontend / UI

### 6.1. Página de Usuários

**Arquivo:** `src/app/(app)/settings/users/page.tsx`

**Status:** ⚠️ **ATENÇÃO** - Funcional mas com melhorias necessárias

#### ✅ **Pontos Positivos:**

1. **Proteção de Rota:**
   - ✅ Usa `RequireRole` para proteger a página
   - ✅ Apenas OWNER e ADMIN podem acessar

2. **Gerenciamento de Estado:**
   - ✅ Loading states implementados
   - ✅ Tratamento de erros básico

3. **Integração com API:**
   - ✅ Fetch correto das APIs
   - ✅ Atualização após operações

#### ⚠️ **Problemas de UX:**

1. **Feedback de Erro:**
   - ⚠️ Usa `alert()` para erros (não é ideal)
   - ⚠️ Não mostra erros de validação de forma destacada

2. **Estados Vazios:**
   - ⚠️ Não há tratamento para lista vazia
   - ⚠️ Não há mensagem quando não há usuários

3. **Loading:**
   - ✅ Loading existe, mas poderia ser mais visual (skeleton)

### 6.2. Formulário de Usuário

**Arquivo:** `src/components/users/user-form-modal.tsx`

**Status:** ⚠️ **ATENÇÃO** - Funcional mas com problemas

#### ✅ **Pontos Positivos:**

1. **Validação:**
   - ✅ Usa react-hook-form com Zod
   - ✅ Validação client-side

2. **UX:**
   - ✅ Campos obrigatórios marcados
   - ✅ Senha opcional ao editar
   - ✅ Feedback de erros de validação

#### 🔴 **Problemas Críticos:**

**CRÍTICO 5: Formulário permite criar OWNER**

```63:67:src/components/users/user-form-modal.tsx
const roleOptions = [
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.DENTIST, label: 'Dentista' },
  { value: UserRole.RECEPTIONIST, label: 'Recepcionista' },
]
```

**Problema:** O formulário não permite selecionar OWNER, mas isso deveria ser validado também no backend. Além disso, se um OWNER criar outro usuário, o backend deveria permitir criar OWNER? (Regra de negócio não clara)

**Observação:** O backend já impede ADMIN de criar OWNER, mas OWNER pode criar OWNER. Isso pode ser intencional, mas deveria ser documentado.

#### ⚠️ **Atenção:**

1. **Senha:**
   - ⚠️ Validação mínima (6 caracteres) - pode ser fraca
   - ⚠️ Não há validação de força de senha

2. **Email:**
   - ⚠️ Não há feedback se email já existe até submeter
   - ⚠️ Poderia ter validação assíncrona

3. **Status:**
   - ⚠️ Checkbox de `isActive` só aparece ao editar
   - ⚠️ Não há confirmação ao desativar usuário

### 6.3. Tabela de Usuários

**Arquivo:** `src/app/(app)/settings/users/client.tsx` e `columns.tsx`

**Status:** ✅ **OK** - Bem implementado

**Pontos Positivos:**
- ✅ Usa DataTable reutilizável
- ✅ Filtros por role e status
- ✅ Busca por nome
- ✅ Ações (editar, ativar/desativar) bem organizadas

**Problemas Identificados:**
- ⚠️ **Nenhum crítico**

---

## 7. Regras Críticas de Negócio

### 7.1. Checklist de Regras

| Regra | Status | Observações |
|-------|--------|-------------|
| OWNER único por clínica | ⚠️ **PARCIAL** | Protegido contra desativação/rebaixamento, mas pode haver múltiplos OWNERs |
| ADMIN não pode rebaixar OWNER | ✅ **OK** | Implementado |
| Usuário não pode remover a si mesmo | 🔴 **FALTA** | **CRÍTICO** - Não implementado |
| Email único por clínica | ✅ **OK** | Validado no use case e constraint no DB |
| Apenas OWNER/ADMIN podem gerenciar usuários | ✅ **OK** | Implementado |
| Soft delete (isActive) | ✅ **OK** | Implementado |
| Não pode desativar único OWNER | ✅ **OK** | Implementado |

### 7.2. Regras Faltantes

1. 🔴 **Usuário não pode desativar a si mesmo**
2. 🔴 **Usuário não pode alterar seu próprio role**
3. ⚠️ **Validação de múltiplos OWNERs** (pode ser intencional)

---

## 8. Integrações

### 8.1. Relação User ↔ Dentist

**Status:** ✅ **OK**

**Implementação:**
- ✅ Relacionamento 1:1 opcional (User pode ter Dentist)
- ✅ Constraint `userId` único em Dentist
- ✅ Cascade delete configurado

**Observação:**
- Não há validação que impeça criar Dentist para usuário que não é DENTIST
- Pode ser intencional (usuário pode ter role diferente mas ser dentista)

### 8.2. Impactos em Outros Módulos

**Status:** ✅ **OK**

**Módulos que dependem de User:**
- ✅ AuditLog (userId)
- ✅ InventoryMovement (createdById)
- ✅ Dentist (userId)

**Observação:**
- Soft delete (isActive: false) não impede relacionamentos existentes
- Pode ser necessário validar `isActive` em queries de outros módulos

---

## 9. Segurança Multi-Tenant

### 9.1. Isolamento de Dados

**Status:** ✅ **OK** - Bem implementado

**Pontos Positivos:**
- ✅ Todas as queries do repositório filtram por `clinicId`
- ✅ APIs usam `session.user.clinicId` para filtrar
- ✅ Use cases recebem `clinicId` como parâmetro

**Problema Crítico:**
- 🔴 **Autenticação não filtra por clinicId** (já mencionado)

### 9.2. Validação de Acesso

**Status:** ✅ **OK**

- ✅ Middleware verifica autenticação
- ✅ APIs verificam sessão
- ✅ Componentes protegem rotas

---

## 10. Diagnóstico Final

### 10.1. Estado Atual

| Categoria | Status | Nota |
|-----------|--------|------|
| Modelo de Dados | ✅ OK | 10/10 |
| Autenticação | 🔴 CRÍTICO | 3/10 |
| Permissões | ✅ OK | 9/10 |
| Use Cases | ⚠️ ATENÇÃO | 7/10 |
| APIs | ⚠️ ATENÇÃO | 6/10 |
| Frontend | ⚠️ ATENÇÃO | 7/10 |
| Segurança Multi-Tenant | 🔴 CRÍTICO | 4/10 |
| **MÉDIA GERAL** | ⚠️ **ATENÇÃO** | **6.6/10** |

### 10.2. Problemas por Prioridade

#### 🔴 **CRÍTICOS (Bloqueadores para Produção):**

1. **Autenticação sem filtro por clinicId**
   - **Arquivo:** `src/lib/auth.ts:24-32`
   - **Impacto:** Quebra isolamento multi-tenant
   - **Prioridade:** P0 - Deve ser corrigido imediatamente

2. **Usuário pode desativar a si mesmo**
   - **Arquivo:** `src/modules/users/application/update-user.ts`
   - **Impacto:** Usuário pode se trancar fora do sistema
   - **Prioridade:** P0 - Deve ser corrigido imediatamente

3. **Usuário pode alterar seu próprio role**
   - **Arquivo:** `src/modules/users/application/update-user.ts`
   - **Impacto:** Escalação de privilégios
   - **Prioridade:** P0 - Deve ser corrigido imediatamente

#### ⚠️ **ATENÇÃO (Devem ser corrigidos antes de produção):**

4. **Falta validação Zod nas APIs**
   - **Arquivo:** `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`
   - **Impacto:** Viola padrão do projeto
   - **Prioridade:** P1 - Deve ser corrigido

5. **Formulário permite criar OWNER (regra de negócio não clara)**
   - **Arquivo:** `src/components/users/user-form-modal.tsx`
   - **Impacto:** Pode criar múltiplos OWNERs
   - **Prioridade:** P1 - Deve ser definido e implementado

6. **Feedback de erro no frontend (usa alert)**
   - **Arquivo:** `src/app/(app)/settings/users/page.tsx`
   - **Impacto:** UX ruim
   - **Prioridade:** P2 - Deve ser melhorado

#### 💡 **MELHORIAS (Podem ser feitas depois):**

7. Validação de força de senha
8. Validação assíncrona de email
9. Estados vazios na UI
10. Confirmação ao desativar usuário
11. Auditoria de ações sensíveis (criar/editar/desativar usuário)

---

## 11. Riscos Técnicos

### 11.1. Se o Módulo Permanecer Como Está

#### 🔴 **Riscos Críticos:**

1. **Quebra de Isolamento Multi-Tenant**
   - **Probabilidade:** Média
   - **Impacto:** Crítico
   - **Descrição:** Se duas clínicas tiverem usuários com o mesmo email, pode haver autenticação cruzada

2. **Auto-Bloqueio de Usuários**
   - **Probabilidade:** Alta
   - **Impacto:** Alto
   - **Descrição:** Usuários podem se desativar acidentalmente, bloqueando acesso

3. **Escalação de Privilégios**
   - **Probabilidade:** Média
   - **Impacto:** Crítico
   - **Descrição:** Usuários podem se promover a roles superiores

#### ⚠️ **Riscos Moderados:**

4. **Inconsistência de Dados**
   - **Probabilidade:** Baixa
   - **Impacto:** Médio
   - **Descrição:** Falta de validação Zod nas APIs pode permitir dados inválidos

5. **Múltiplos OWNERs**
   - **Probabilidade:** Baixa
   - **Impacto:** Baixo
   - **Descrição:** Se não for uma regra de negócio, pode causar confusão

---

## 12. Checklist de Correções Necessárias

### 12.1. Antes de Avançar para Próximo Módulo

#### 🔴 **Obrigatório (P0):**

- [ ] **Corrigir autenticação para filtrar por clinicId**
  - [ ] Adicionar campo de clínica no login OU
  - [ ] Usar subdomínio para identificar clínica OU
  - [ ] Implementar seleção de clínica no login
  - [ ] Atualizar `src/lib/auth.ts` para filtrar por clinicId

- [ ] **Impedir auto-desativação**
  - [ ] Adicionar validação em `update-user.ts`
  - [ ] Verificar se `currentUserId === userId && isActive === false`
  - [ ] Retornar erro apropriado

- [ ] **Impedir auto-alteração de role**
  - [ ] Adicionar validação em `update-user.ts`
  - [ ] Verificar se `currentUserId === userId && role !== targetUser.role`
  - [ ] Retornar erro apropriado

#### ⚠️ **Recomendado (P1):**

- [ ] **Adicionar validação Zod nas APIs**
  - [ ] Validar body em POST `/api/users`
  - [ ] Validar body em PATCH `/api/users/[id]`
  - [ ] Retornar erros HTTP apropriados

- [ ] **Definir regra de negócio para múltiplos OWNERs**
  - [ ] Decidir se múltiplos OWNERs são permitidos
  - [ ] Se não, adicionar validação na criação
  - [ ] Atualizar documentação

- [ ] **Melhorar feedback de erro no frontend**
  - [ ] Substituir `alert()` por toast/notificação
  - [ ] Mostrar erros de validação de forma destacada

#### 💡 **Opcional (P2):**

- [ ] Adicionar validação de força de senha
- [ ] Adicionar validação assíncrona de email
- [ ] Adicionar estados vazios na UI
- [ ] Adicionar confirmação ao desativar usuário
- [ ] Adicionar auditoria de ações sensíveis

### 12.2. Testes Necessários

- [ ] Testar autenticação com emails duplicados em clínicas diferentes
- [ ] Testar tentativa de auto-desativação
- [ ] Testar tentativa de auto-alteração de role
- [ ] Testar criação de múltiplos OWNERs (se não permitido)
- [ ] Testar validações de entrada nas APIs
- [ ] Testar isolamento multi-tenant (usuário de uma clínica não acessa outra)

---

## 13. Conclusão

O módulo de Usuários está **estruturalmente bem implementado**, seguindo os padrões do projeto (Clean Architecture, validação com Zod, isolamento multi-tenant). No entanto, apresenta **3 vulnerabilidades críticas de segurança** que **devem ser corrigidas antes de qualquer deploy para produção**:

1. Autenticação sem filtro por clinicId
2. Possibilidade de auto-desativação
3. Possibilidade de auto-alteração de role

Além disso, há **melhorias recomendadas** em validação de APIs e UX que devem ser implementadas.

**Recomendação Final:** 🔴 **NÃO APROVADO PARA PRODUÇÃO** até correção dos itens P0.

---

**Próximos Passos Sugeridos:**
1. Corrigir os 3 problemas críticos (P0)
2. Implementar validação Zod nas APIs (P1)
3. Melhorar feedback de erro no frontend (P1)
4. Realizar testes de segurança multi-tenant
5. Documentar regras de negócio (múltiplos OWNERs)

---

**Documento gerado em:** 2025-01-XX  
**Versão:** 1.0.0
