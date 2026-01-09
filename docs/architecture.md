# TimeDonto — Arquitetura do Sistema

Este documento define a arquitetura do TimeDonto (MVP v1.0.0), incluindo organização de pastas, camadas, módulos de domínio, multi-tenant, autenticação, comunicação frontend↔backend e padrões de desenvolvimento.

---

## 1. Visão Geral

TimeDonto é um **SaaS multi-tenant** para gestão de clínicas odontológicas, construído em cima de:

* **Next.js (App Router)** — frontend e backend na mesma base
* **React** — componentes Server e Client
* **TypeScript** — tipagem forte
* **PostgreSQL** — banco relacional principal
* **Prisma ORM** — acesso ao banco
* **Auth.js / NextAuth** — autenticação
* **Stripe** — billing e assinatura

Arquitetura orientada a módulos de domínio (feature-first), seguindo princípios de Clean Architecture e SOLID.

---

## 2. Camadas Lógicas

Separação em 4 camadas principais:

1. **Presentation (UI / Pages / Components)**

   * Next.js App Router (`/src/app`)
   * Componentes React (Server e Client)
   * Formulários, tabelas, telas de listagem e detalhes

2. **Application (Use Cases / Services)**

   * Funções de caso de uso (ex.: `createPatient`, `scheduleAppointment`)
   * Orquestram validações, regras de negócio e chamadas a repositórios
   * Não conhecem detalhes de UI

3. **Domain (Entidades / Tipos / Regras de negócio)**

   * Tipos e modelos de domínio (TypeScript + Zod)
   * Regras de negócio puras
   * Não sabem nada de HTTP, Next.js ou Prisma

4. **Infrastructure (Prisma / Stripe / Email / Adapters)**

   * Implementações concretas de repositórios (Prisma)
   * Adapters para Stripe e outros serviços
   * Configurações de banco, env, etc.

---

## 3. Estrutura de Pastas

Estrutura base proposta:

```bash
/src
  /app                # Next.js App Router (rotas, layout, UI)
    /(public)         # Páginas públicas (marketing, landing, login, signup)
    /(app)            # Áreas autenticadas (dashboard)
      /dashboard
      /patients
      /appointments
      /settings
    /api              # Route Handlers HTTP (REST-ish)
      /auth
      /webhooks
  /modules            # Domínios principais (feature modules)
    /auth
    /clinics
    /users
    /dentists
    /patients
    /appointments
    /records          # Prontuário
    /finance
    /billing
    /shared           # Coisas reutilizáveis de domínio
  /components         # Componentes UI reutilizáveis
    /ui               # Botões, inputs, modais etc.
    /layout           # Layouts, headers, sidebars
  /lib
    auth              # helpers de sessão / permissões
    db                # prisma client
    validators        # esquemas Zod
    logger            # logger simples
    utils             # helpers genéricos
  /config             # config de env, roles, constants
/prisma
  schema.prisma       # modelo de dados
```

**Regras importantes:**

* **Nenhum código de domínio dentro de `/app`**.
* `/app` chama funções de **Application Layer** que estão em `/modules/**/application`.
* Infraestrutura (Prisma, Stripe) fica em `/modules/**/infra` ou `/lib`.

---

## 4. Módulos de Domínio

Cada módulo em `/modules` segue um padrão interno:

```bash
/modules/<feature>
  /domain        # Tipos, entidades, regras de negócio puras
  /application   # Casos de uso (use cases / services)
  /infra         # Repositórios Prisma, adapters externos
  /mappers       # Conversão entre tipos (DTOs <-> domínio)
```

### 4.1. Módulos principais

* `auth`

  * Login, logout, sessão atual
  * Callback do Auth.js/NextAuth
* `clinics`

  * Entidade `Clinic`
  * Configuração da clínica, dados gerais
* `users`

  * Usuários internos da clínica
  * Papéis: Owner, Admin, Dentist, Receptionist, Financeiro
* `dentists`

  * Agenda,Relatório,Orçamento, Cadastro de pacientes
  
* `patients`

  * Cadastro de pacientes, dados pessoais, contatos
* `appointments`

  * Agenda, marcação, remarcação, cancelamento
* `records` (prontuário)

  * Histórico de atendimentos por paciente
* `finance`

  * Pagamentos, caixa, relatórios básicos
* `billing`

  * Plano SaaS, Stripe, assinaturas, webhooks

Obs: Incluir os novos módulos adicionados nos arquivos anteriores
---

## 5. Multi-Tenant

### 5.1. Estratégia

* Multi-tenant por **coluna** (`clinicId`) na maioria das tabelas.
* Cada `User` pertence a **uma única** `Clinic`.
* Todas as consultas a domínios críticos devem sempre filtrar por `clinicId`.

### 5.2. Regras

* Qualquer tabela que contenha dados de negócio (pacientes, agenda, prontuário, financeiro) deve ter campo `clinicId`.
* O contexto da clínica vem da sessão do usuário autenticado (`session.user.clinicId`).
* Nunca permitir que um usuário acesse dados de outra clínica via ID parametrizado sem checar `clinicId`.

Exemplo (pseudo-código) de regra de acesso:

```ts
const clinicId = session.user.clinicId;

const patient = await patientRepo.findById({ id: patientId, clinicId });
// Se não encontrar, retorna 404 mesmo que o ID exista em outra clínica.
```

---

## 6. Autenticação e Autorização

### 6.1. Autenticação

* Usar **Auth.js / NextAuth** com estratégia baseada em email+senha no MVP.
* Durante o login, carregar:

  * `userId`
  * `clinicId`
  * `role` (Owner, Admin, Dentist, Receptionist)

Essas informações ficam disponíveis na `session`.

### 6.2. Autorização

* Sistema de **roles** simples baseado em enum:

```ts
type UserRole = 'OWNER' | 'ADMIN' | 'DENTIST' | 'RECEPTIONIST';
```

* Criação de um helper de autorização em `/lib/auth`:

```ts
canAccess(resource, action, role)
```

* As permissões definidas em `requirements.md` guiam a implementação de regras em:

  * Middleware de rota
  * Casos de uso críticos (ex.: acesso ao prontuário, financeiro, billing)

---

## 7. Estilo de API e Comunicação

### 7.1. Backend

* Uso de **Next.js Route Handlers** em `/app/api/**` para:

  * Endpoints REST-like para consumo via fetch/Axios quando necessário
  * Webhooks (Stripe, etc.)
* Onde fizer sentido, utilizar **Server Actions** para formulários internos.

Padrão de pastas:

```bash
/app/api
  /auth
    route.ts
  /patients
    route.ts       # POST, GET (lista)
    /[id]
      route.ts     # GET, PUT, DELETE
  /appointments
  /billing
    /stripe-webhook
      route.ts
```

### 7.2. Validação

* Utilização de **Zod** para:

  * Validar inputs de API
  * Tipar DTOs de entrada/saída
* Somente dados **já validados** chegam à camada de domínio.

---

## 8. Fluxo típico: UI → Caso de Uso → Repositório

Exemplo: Criação de paciente.

1. Usuário preenche formulário de paciente na UI (`/app/(app)/patients/new`).
2. Submit chama:

   * Server Action **ou**
   * `POST /api/patients`
3. Endpoint / Server Action:

   * Lê sessão (auth)
   * Valida dados com Zod
   * Chama `createPatientUseCase` em `/modules/patients/application`.
4. `createPatientUseCase`:

   * Aplica regras de negócio necessárias
   * Usa `patientRepository` (infra/Prisma) para persistir.
5. Retorna DTO para UI.

---

## 9. Banco de Dados (Visão Macro)

Detalhes concretos estarão em `data-model.md` e `schema.prisma`.
Aqui fica apenas a visão de entidades principais:

* `Clinic`
* `User` (com `role` e `clinicId`)
* `Dentist`
* `Patient`
* `Appointment`
* `Record` (prontuário)
* `TreatmentPlan` / `Budget`
* `Payment`
* `Subscription` (Stripe)
* `AuditLog` / `AccessLog`

---

## 10. Logs e Auditoria

* Camada de infra terá um serviço simples de log (ex.: `logger.ts`).
* Operações sensíveis (acesso a prontuário, alterações financeiras) devem registrar:

  * `userId`
  * `clinicId`
  * ação executada
  * timestamp

---

## 11. Configuração e Ambientes

* Arquivo `.env` contendo:

  * `DATABASE_URL`
  * `NEXTAUTH_SECRET`
  * `NEXTAUTH_URL`
  * `STRIPE_SECRET_KEY`
  * `STRIPE_WEBHOOK_SECRET`
* Os acessos ao `process.env` ficam em `/config/env.ts`, com validação via Zod.

---

## 12. Padrões Gerais

* Sempre usar **TypeScript estrito** (`strict: true`).
* Nenhuma chamada direta a `prisma` fora da camada de **infra**.
* Regras de negócio sempre em funções puras, testáveis.
* UI desacoplada dos detalhes de banco.

---

FIM DO ARQUIVO — `architecture.md`

---