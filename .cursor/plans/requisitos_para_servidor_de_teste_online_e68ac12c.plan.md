---
name: Requisitos para Servidor de Teste Online
overview: Documentação completa com todas as informações necessárias para configurar um servidor de teste online do TimeDonto, incluindo variáveis de ambiente, banco de dados, dependências, serviços externos, configurações de deploy e checklist pré-deploy.
todos: []
isProject: false
---

# Requisitos para Servidor de Teste Online - TimeDonto

## 1. Variáveis de Ambiente

### Obrigatórias (validadas em `src/config/env.ts`)

As seguintes variáveis são **obrigatórias** e validadas via Zod:

- **`DATABASE_URL`** (string URL)
  - Formato: `postgresql://usuario:senha@host:porta/database?schema=public`
  - Exemplo produção: `postgresql://user:pass@db.example.com:5432/timedonto?schema=public`
  - **AÇÃO**: Gerar nova URL do banco de dados de produção

- **`NEXTAUTH_URL`** (string URL)
  - URL base da aplicação em produção
  - Exemplo: `https://timedonto.vercel.app` ou `https://app.timedonto.com.br`
  - **AÇÃO**: Configurar com a URL final do servidor de teste

- **`NEXTAUTH_SECRET`** (string, mínimo 32 caracteres)
  - Secret usado para assinar cookies e tokens JWT
  - **AÇÃO**: Gerar novo secret para produção
  - Como gerar: `openssl rand -base64 32` ou usar gerador online seguro

- **`NODE_ENV`** (enum: 'development' | 'production' | 'test')
  - Deve ser `production` em produção
  - **AÇÃO**: Configurar como `production`

### Opcionais (mencionadas na documentação, mas não validadas)

Estas variáveis são mencionadas na documentação mas **não estão implementadas** no código atual:

- **`STRIPE_SECRET_KEY`** (opcional - funcionalidade planejada)
  - Chave secreta da API do Stripe
  - **AÇÃO**: Configurar apenas se implementar billing/Stripe

- **`STRIPE_WEBHOOK_SECRET`** (opcional - funcionalidade planejada)
  - Secret para validar webhooks do Stripe
  - **AÇÃO**: Configurar apenas se implementar billing/Stripe

### Resumo de Ações para Variáveis

| Variável | Status | Ação Necessária |

|----------|--------|-----------------|

| `DATABASE_URL` | Obrigatória | Criar banco PostgreSQL e configurar URL |

| `NEXTAUTH_URL` | Obrigatória | Configurar URL do servidor de teste |

| `NEXTAUTH_SECRET` | Obrigatória | Gerar novo secret (32+ caracteres) |

| `NODE_ENV` | Obrigatória | Configurar como `production` |

| `STRIPE_SECRET_KEY` | Opcional | Não necessário (não implementado) |

| `STRIPE_WEBHOOK_SECRET` | Opcional | Não necessário (não implementado) |

---

## 2. Banco de Dados

### Tipo e Provider

- **Tipo**: PostgreSQL
- **Provider**: Prisma ORM
- **Schema**: Definido em `prisma/schema.prisma`

### Schema Completo

O banco possui **23 tabelas principais**:

#### Tabelas Core

- `clinics` - Clínicas (multi-tenant)
- `users` - Usuários do sistema
- `dentists` - Dentistas
- `patients` - Pacientes

#### Tabelas de Agendamento e Atendimento

- `appointments` - Agendamentos
- `attendances` - Atendimentos
- `attendance_cids` - CIDs dos atendimentos
- `attendance_procedures` - Procedimentos realizados
- `attendance_odontograms` - Odontogramas
- `clinical_documents` - Documentos clínicos (atestados, prescrições, etc.)

#### Tabelas de Prontuário

- `records` - Prontuários odontológicos

#### Tabelas de Tratamento e Financeiro

- `treatment_plans` - Planos de tratamento
- `treatment_items` - Itens dos planos
- `payments` - Pagamentos
- `payment_treatment_plans` - Relação pagamento/plano

#### Tabelas de Assinatura (Stripe)

- `subscriptions` - Assinaturas SaaS (campos: stripeCustomerId, stripeSubscriptionId)

#### Tabelas de Configuração

- `procedures` - Procedimentos cadastrados
- `specialties` - Especialidades odontológicas (23 especialidades)
- `cids` - Códigos CID-10
- `dentist_procedures` - Relação dentista/procedimento
- `dentist_specialties` - Relação dentista/especialidade

#### Tabelas de Estoque

- `inventory_items` - Itens de estoque
- `inventory_movements` - Movimentações de estoque

#### Tabelas de Auditoria

- `audit_logs` - Logs de auditoria

### Comandos de Migration

#### Rodar migrations em produção:

```bash
# 1. Gerar Prisma Client (necessário antes de rodar migrations)
npx prisma generate

# 2. Rodar todas as migrations pendentes
npx prisma migrate deploy

# OU, se preferir aplicar manualmente:
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

**IMPORTANTE**: Use `prisma migrate deploy` em produção (não `prisma migrate dev`), pois:

- Não cria novas migrations
- Aplica apenas migrations pendentes
- É seguro para ambientes de produção

#### Verificar status das migrations:

```bash
npx prisma migrate status
```

### Migrations Existentes

O projeto possui **12 migrations** já criadas:

1. `20260109201945_init` - Schema inicial
2. `20260115204751_add_payment_treatment_plan_relationship`
3. `20260117191421_add_procedures`
4. `20260120115755_add_procedure_fields_to_appointment`
5. `20260120144850_unify_specialties`
6. `20260120234712_add_contact_info_to_dentist`
7. `20260121001815_add_personal_info_to_dentist`
8. `20260121202235_add_attendance_module`
9. `20260122110556_timedonto_atendimento`
10. `20260122200022_add_cids_table`
11. `20260123155441_add_treatment_fields_to_attendance_procedure`
12. `20260123200000_add_discount_fields_and_procedure_link`

### Seed do Banco (Opcional)

Para popular o banco com dados de teste:

```bash
npx prisma db seed
```

O seed cria:

- 1 clínica de exemplo
- 4 usuários (1 owner, 2 dentistas, 1 recepcionista)
- 2 dentistas
- 58 CIDs globais
- 23 especialidades globais
- 5 procedimentos
- 4 pacientes
- 4 agendamentos

**Credenciais padrão do seed:**

- Email: `joao@sorrisoperfeito.com.br`
- Senha: `senha123`

### Serviços de Banco Recomendados

#### Opção 1: Neon (Recomendado para Next.js)

- **URL**: https://neon.tech
- **Vantagens**: 
  - Integração nativa com Vercel
  - Plano gratuito generoso
  - PostgreSQL serverless
- **Configuração**: Criar projeto → copiar connection string → usar como `DATABASE_URL`

#### Opção 2: Supabase

- **URL**: https://supabase.com
- **Vantagens**:
  - PostgreSQL gerenciado
  - Plano gratuito disponível
  - Dashboard completo
- **Configuração**: Criar projeto → Settings → Database → Connection string

#### Opção 3: Railway

- **URL**: https://railway.app
- **Vantagens**:
  - Deploy fácil
  - Integração com GitHub
- **Configuração**: Criar PostgreSQL service → copiar DATABASE_URL

#### Opção 4: Render

- **URL**: https://render.com
- **Vantagens**:
  - PostgreSQL gerenciado
  - Plano gratuito (com limitações)
- **Configuração**: Criar PostgreSQL database → copiar Internal/External URL

### Configurações de Conexão

A `DATABASE_URL` deve incluir:

- Usuário e senha
- Host e porta (geralmente 5432)
- Nome do banco
- Schema (geralmente `public`)
- Parâmetros de conexão (SSL, pool, etc.)

**Exemplo completo:**

```
postgresql://user:password@host:5432/timedonto?schema=public&sslmode=require&connection_limit=10
```

**Para produção, adicione:**

- `?sslmode=require` (SSL obrigatório)
- `?connection_limit=10` (limitar conexões)
- `?pool_timeout=20` (timeout do pool)

---

## 3. Dependências e Versões

### Versão do Node.js

- **Recomendada**: Node.js 20.x (baseado em `@types/node: ^20`)
- **Mínima**: Node.js 18.x (Next.js 16.1.1 requer Node 18+)
- **Verificar**: Não há arquivo `.nvmrc` ou `.node-version` no projeto

### Dependências Críticas

#### Framework e Core

- **next**: `16.1.1` - Framework principal
- **react**: `19.2.3` - Biblioteca React
- **react-dom**: `19.2.3` - React DOM
- **typescript**: `^5` - TypeScript

#### Autenticação

- **next-auth**: `^5.0.0-beta.30` - Autenticação (Auth.js v5)
- **bcryptjs**: `^3.0.3` - Hash de senhas

#### Banco de Dados

- **@prisma/client**: `^6.19.1` - Cliente Prisma
- **prisma**: `^6.19.1` - CLI Prisma (devDependency)

#### Validação e Formulários

- **zod**: `^4.3.5` - Validação de schemas
- **react-hook-form**: `^7.71.0` - Gerenciamento de formulários
- **@hookform/resolvers**: `^5.2.2` - Resolvers para react-hook-form

#### UI Components (Radix UI)

- `@radix-ui/react-checkbox`: `^1.3.3`
- `@radix-ui/react-dialog`: `^1.1.15`
- `@radix-ui/react-dropdown-menu`: `^2.1.16`
- `@radix-ui/react-label`: `^2.8`
- `@radix-ui/react-popover`: `^1.1.15`
- `@radix-ui/react-select`: `^2.2.6`
- `@radix-ui/react-separator`: `^1.1.8`
- `@radix-ui/react-slot`: `^1.2.4`
- `@radix-ui/react-switch`: `^1.2.6`
- `@radix-ui/react-tabs`: `^1.1.13`

#### Utilitários

- **date-fns**: `^4.1.0` - Manipulação de datas
- **lucide-react**: `^0.562.0` - Ícones
- **clsx**: `^2.1.1` - Utilitário para classes CSS
- **tailwind-merge**: `^3.4.0` - Merge de classes Tailwind
- **class-variance-authority**: `^0.7.1` - Variantes de componentes
- **@tanstack/react-table**: `^8.21.3` - Tabelas de dados

#### Styling

- **tailwindcss**: `^4` - Tailwind CSS
- **@tailwindcss/postcss**: `^4` - PostCSS para Tailwind

### Comandos de Build e Start

#### Desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

#### Build para Produção:

```bash
npm run build
# ou
yarn build
# ou
pnpm build
```

#### Start em Produção:

```bash
npm run start
# ou
yarn start
# ou
pnpm start
```

#### Lint:

```bash
npm run lint
```

### Instalação de Dependências

```bash
# Instalar todas as dependências
npm install

# Ou com yarn
yarn install

# Ou com pnpm
pnpm install
```

### Comandos Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Rodar migrations (desenvolvimento)
npx prisma migrate dev

# Rodar migrations (produção)
npx prisma migrate deploy

# Ver status das migrations
npx prisma migrate status

# Executar seed
npx prisma db seed
```

---

## 4. Serviços Externos Necessários

### Stripe (Planejado, NÃO Implementado)

**Status**: A funcionalidade de billing/Stripe está **planejada** mas **não implementada** no código atual.

#### O que está planejado:

- Checkout de assinatura SaaS
- Webhooks do Stripe
- Gerenciamento de assinaturas
- Tabela `subscriptions` já existe no schema

#### O que precisa ser configurado (quando implementar):

1. **Criar conta Stripe**

   - URL: https://stripe.com
   - Criar conta de teste ou produção

2. **Criar Produto e Preço**

   - Dashboard Stripe → Products → Create product
   - Definir preço mensal/anual
   - Obter `price_id`

3. **Configurar Webhook**

   - Dashboard Stripe → Developers → Webhooks
   - Endpoint: `https://seu-dominio.com/api/billing/stripe-webhook`
   - Eventos necessários:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copiar **Webhook Signing Secret**

4. **Variáveis de Ambiente**

   - `STRIPE_SECRET_KEY` - Chave secreta da API
   - `STRIPE_WEBHOOK_SECRET` - Secret do webhook

#### Endpoints Planejados (não implementados):

- `POST /api/billing/checkout-session` - Criar sessão de checkout
- `GET /api/billing/subscription` - Obter dados da assinatura
- `POST /api/billing/cancel` - Cancelar assinatura
- `POST /api/billing/stripe-webhook` - Webhook do Stripe

**AÇÃO**: Para servidor de teste, Stripe **não é necessário** a menos que você implemente a funcionalidade de billing.

---

## 5. Configurações de Deploy

### Comandos de Build e Start

#### Build:

```bash
npm run build
```

- Compila a aplicação Next.js
- Gera arquivos otimizados em `.next/`
- Valida TypeScript e gera tipos

#### Start:

```bash
npm run start
```

- Inicia servidor de produção
- Porta padrão: **3000** (configurável via `PORT` env var)
- Serve arquivos estáticos e API routes

### Porta Padrão

- **Porta padrão**: `3000`
- **Configurável**: Via variável de ambiente `PORT`
- **Next.js**: Automaticamente detecta a porta do ambiente (Vercel, Railway, etc.)

### Configurações Específicas por Plataforma

#### Vercel (Recomendado para Next.js)

**Vantagens:**

- Integração nativa com Next.js
- Deploy automático via GitHub
- SSL automático
- Edge Functions suportadas

**Configuração:**

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente no dashboard
3. Deploy automático

**Arquivo `vercel.json` (opcional):**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

**Variáveis de Ambiente no Vercel:**

- Configurar todas as variáveis obrigatórias
- `NEXTAUTH_URL` deve ser a URL do Vercel (ex: `https://timedonto.vercel.app`)

**Build Settings:**

- Build Command: `npm run build` (padrão)
- Output Directory: `.next` (automático)
- Install Command: `npm install` (padrão)

#### Railway

**Configuração:**

1. Conectar repositório
2. Criar PostgreSQL service
3. Configurar variáveis de ambiente
4. Railway detecta Next.js automaticamente

**Variáveis de Ambiente:**

- Configurar via dashboard Railway
- `DATABASE_URL` pode ser gerada automaticamente se usar PostgreSQL do Railway

#### Render

**Configuração:**

1. Criar novo Web Service
2. Conectar repositório
3. Build Command: `npm run build`
4. Start Command: `npm run start`
5. Environment: `Node`

**Variáveis de Ambiente:**

- Configurar via dashboard Render

#### Outras Plataformas

**Netlify:**

- Suporta Next.js mas não é ideal para aplicações server-side
- Melhor para sites estáticos

**AWS/GCP/Azure:**

- Requer configuração manual de servidor Node.js
- Usar Docker ou serviços gerenciados (ECS, Cloud Run, etc.)

### Arquivo `next.config.ts`

O arquivo atual está vazio (apenas configuração padrão):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Não requer alterações** para deploy básico. Configurações opcionais:

- `output: 'standalone'` - Para Docker
- `experimental: { serverActions: true }` - Já habilitado por padrão no Next.js 16

---

## 6. Checklist de Pré-Deploy

### Fase 1: Preparação do Ambiente

- [ ] **Criar banco de dados PostgreSQL**
  - Escolher serviço (Neon, Supabase, Railway, etc.)
  - Criar banco de dados
  - Anotar connection string

- [ ] **Configurar variáveis de ambiente**
  - [ ] `DATABASE_URL` - URL do banco de produção
  - [ ] `NEXTAUTH_URL` - URL do servidor de teste (ex: `https://timedonto.vercel.app`)
  - [ ] `NEXTAUTH_SECRET` - Gerar novo secret (32+ caracteres)
  - [ ] `NODE_ENV` - Configurar como `production`

- [ ] **Gerar NEXTAUTH_SECRET**
  ```bash
  openssl rand -base64 32
  # ou usar gerador online seguro
  ```


### Fase 2: Configuração do Banco

- [ ] **Rodar migrations**
  ```bash
  npx prisma generate
  npx prisma migrate deploy
  ```

- [ ] **Verificar migrations aplicadas**
  ```bash
  npx prisma migrate status
  ```

- [ ] **(Opcional) Rodar seed para dados de teste**
  ```bash
  npx prisma db seed
  ```


### Fase 3: Build e Teste Local

- [ ] **Instalar dependências**
  ```bash
  npm install
  ```

- [ ] **Testar build local**
  ```bash
  npm run build
  ```

- [ ] **Testar start local** (com variáveis de produção)
  ```bash
  npm run start
  ```

- [ ] **Verificar se não há erros no console**

### Fase 4: Configuração da Plataforma de Deploy

- [ ] **Conectar repositório** (GitHub/GitLab)
- [ ] **Configurar variáveis de ambiente** na plataforma
- [ ] **Configurar build settings** (se necessário)
- [ ] **Configurar domínio** (se aplicável)

### Fase 5: Deploy e Validação

- [ ] **Fazer deploy inicial**
- [ ] **Verificar logs do deploy**
- [ ] **Testar acesso à aplicação**
- [ ] **Testar login** (criar usuário ou usar seed)
- [ ] **Verificar conexão com banco** (testar criar paciente, etc.)
- [ ] **Verificar API routes** (testar endpoints)

### Fase 6: Pós-Deploy

- [ ] **Configurar monitoramento** (opcional)
- [ ] **Configurar backups do banco** (recomendado)
- [ ] **Documentar credenciais** (em local seguro)
- [ ] **Testar fluxos principais**:
  - [ ] Login/Logout
  - [ ] Criar paciente
  - [ ] Criar agendamento
  - [ ] Criar atendimento
  - [ ] Registrar pagamento

---

## 7. URLs e Endpoints Importantes

### URLs de Configuração

#### NEXTAUTH_URL

- **Uso**: URL base da aplicação
- **Exemplo desenvolvimento**: `http://localhost:3000`
- **Exemplo produção**: `https://timedonto.vercel.app` ou `https://app.timedonto.com.br`
- **Onde configurar**: Variável de ambiente
- **Importante**: Deve ser a URL pública acessível, sem trailing slash

### Endpoints de API

#### Autenticação

- `POST /api/auth/signin` - Login (gerenciado pelo NextAuth)
- `POST /api/auth/signout` - Logout (gerenciado pelo NextAuth)
- `GET /api/auth/session` - Obter sessão atual
- `[...nextauth]` - Rotas do NextAuth (callback, etc.)

#### Pacientes

- `GET /api/patients` - Listar pacientes
- `POST /api/patients` - Criar paciente
- `GET /api/patients/[id]` - Obter paciente
- `PUT /api/patients/[id]` - Atualizar paciente
- `DELETE /api/patients/[id]` - Deletar paciente
- `GET /api/patients/[id]/records` - Prontuários do paciente

#### Agendamentos

- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `GET /api/appointments/[id]` - Obter agendamento
- `PUT /api/appointments/[id]` - Atualizar agendamento
- `DELETE /api/appointments/[id]` - Deletar agendamento

#### Atendimentos

- `GET /api/attendances` - Listar atendimentos
- `POST /api/attendances` - Criar atendimento
- `GET /api/attendances/[id]` - Obter atendimento
- `PUT /api/attendances/[id]` - Atualizar atendimento

#### Financeiro

- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Criar pagamento
- `GET /api/payments/summary` - Resumo financeiro
- `GET /api/reports/finance` - Relatórios financeiros

#### Planos de Tratamento

- `GET /api/treatment-plans` - Listar planos
- `POST /api/treatment-plans` - Criar plano
- `GET /api/treatment-plans/[id]` - Obter plano
- `PATCH /api/treatment-plans/[id]` - Atualizar plano

#### Billing/Stripe (Não Implementado)

- `POST /api/billing/checkout-session` - Criar checkout
- `GET /api/billing/subscription` - Obter assinatura
- `POST /api/billing/cancel` - Cancelar assinatura
- `POST /api/billing/stripe-webhook` - Webhook do Stripe

### Webhooks Externos

#### Stripe Webhook (Quando Implementado)

- **Endpoint**: `POST /api/billing/stripe-webhook`
- **URL completa**: `https://seu-dominio.com/api/billing/stripe-webhook`
- **Autenticação**: Via assinatura do webhook (não via sessão)
- **Eventos**: 
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

**Configuração no Stripe:**

1. Dashboard → Developers → Webhooks
2. Add endpoint
3. URL: `https://seu-dominio.com/api/billing/stripe-webhook`
4. Selecionar eventos
5. Copiar Webhook Signing Secret

---

## 8. Arquivos de Configuração Importantes

### Arquivos que Podem Precisar de Ajustes

#### `next.config.ts`

- **Localização**: Raiz do projeto
- **Status**: Configuração padrão (vazia)
- **Ação**: Geralmente não requer alterações
- **Opcional**: Adicionar `output: 'standalone'` para Docker

#### `prisma/schema.prisma`

- **Localização**: `prisma/schema.prisma`
- **Status**: Completo e atualizado
- **Ação**: Não alterar (a menos que precise de novas migrations)
- **Importante**: Usar `prisma migrate deploy` em produção

#### `package.json`

- **Localização**: Raiz do projeto
- **Status**: Completo
- **Ação**: Verificar se todas as dependências estão instaladas
- **Scripts**: Já configurados corretamente

#### `src/config/env.ts`

- **Localização**: `src/config/env.ts`
- **Status**: Valida variáveis obrigatórias
- **Ação**: Não alterar (validação está correta)
- **Importante**: Adicionar novas variáveis aqui se necessário

#### `tsconfig.json`

- **Localização**: Raiz do projeto
- **Status**: Configuração TypeScript
- **Ação**: Geralmente não requer alterações

#### `.env` / `.env.local` (Não versionado)

- **Localização**: Raiz do projeto (gitignored)
- **Status**: Não existe no repositório (correto)
- **Ação**: Configurar variáveis na plataforma de deploy
- **Importante**: Nunca commitar arquivos `.env` com secrets

### Arquivos de Deploy Específicos

#### `vercel.json` (Opcional para Vercel)

- Criar se precisar de configurações customizadas
- Geralmente não necessário (Next.js detecta automaticamente)

#### `Dockerfile` (Se usar Docker)

- Não existe no projeto
- Criar se for fazer deploy em container

#### `.dockerignore`

- Não existe no projeto
- Criar se usar Docker

---

## Resumo Executivo

### Mínimo Necessário para Deploy

1. **Banco de Dados PostgreSQL**

   - Criar em Neon/Supabase/Railway
   - Obter `DATABASE_URL`

2. **Variáveis de Ambiente (4 obrigatórias)**

   - `DATABASE_URL` - URL do banco
   - `NEXTAUTH_URL` - URL do servidor
   - `NEXTAUTH_SECRET` - Secret gerado (32+ chars)
   - `NODE_ENV` - `production`

3. **Rodar Migrations**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Build e Deploy**
   ```bash
   npm run build
   npm run start
   ```


### Tempo Estimado de Setup

- **Banco de dados**: 5-10 minutos
- **Configuração de variáveis**: 5 minutos
- **Migrations**: 2-3 minutos
- **Deploy inicial**: 5-10 minutos
- **Total**: ~20-30 minutos

### Próximos Passos Após Deploy

1. Testar login (criar usuário ou usar seed)
2. Testar criação de paciente
3. Testar criação de agendamento
4. Verificar logs para erros
5. Configurar monitoramento (opcional)