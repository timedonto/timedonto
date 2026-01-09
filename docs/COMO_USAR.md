# =====================================================================
# COMO USAR ESTES ARQUIVOS NO CURSOR
# =====================================================================

## 📁 Arquivos Gerados

Você recebeu 3 arquivos essenciais:

```
timedonto-setup/
├── .cursorrules              → Regras para o Cursor seguir
├── prisma/
│   └── schema.prisma         → Modelo completo do banco de dados
└── docs/
    ├── SPRINT_0_SETUP.md     → Prompt da primeira sprint
    └── COMO_USAR.md          → Este arquivo
```

---

## 🚀 Passo a Passo para Começar

### 1. Prepare seu ambiente local

Antes de começar, você precisa ter instalado:
- [x] Node.js LTS (v18 ou v20) → https://nodejs.org
- [x] PostgreSQL → https://www.postgresql.org/download/
- [x] pgAdmin → https://www.pgadmin.org/download/
- [x] Git → https://git-scm.com/
- [x] Cursor → https://cursor.sh/

### 2. Crie o banco de dados no PostgreSQL

Abra o pgAdmin e crie um banco chamado `timedonto`:

```sql
CREATE DATABASE timedonto;
```

### 3. Crie o projeto no Cursor

1. Abra o Cursor
2. Crie uma nova pasta para o projeto
3. Abra um novo chat (Cmd+L ou Ctrl+L)

### 4. Configure o .cursorrules

**IMPORTANTE:** Copie o arquivo `.cursorrules` para a RAIZ do seu projeto.
O Cursor lê esse arquivo automaticamente e segue as regras.

```
seu-projeto/
├── .cursorrules  ← AQUI na raiz
├── src/
├── prisma/
└── ...
```

### 5. Crie a pasta /docs e coloque sua documentação

```
seu-projeto/
├── docs/
│   ├── changelog.md
│   ├── readme.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── api-spec.md
│   └── ui-flow.md
```

### 6. Execute a Sprint 0

No chat do Cursor, cole TODO o conteúdo do arquivo `SPRINT_0_SETUP.md`.
O Cursor vai executar etapa por etapa.

**Dica:** Se o Cursor parar no meio, diga "continue" ou "próxima etapa".

---

## 📋 Ordem das Sprints

Execute na seguinte ordem:

| Sprint | Descrição | Pré-requisito |
|--------|-----------|---------------|
| 0 | Setup do Projeto | Ambiente configurado |
| 1 | Auth + Multi-tenant | Sprint 0 completa |
| 2 | Usuários + Dentistas | Sprint 1 completa |
| 3 | Pacientes | Sprint 2 completa |
| 4 | Agenda | Sprint 3 completa |
| 5 | Prontuário + Odontograma | Sprint 4 completa |
| 6 | Orçamentos + Financeiro | Sprint 5 completa |
| 7 | Estoque + Relatórios | Sprint 6 completa |
| 8 | Stripe + Deploy | Sprint 7 completa |

---

## 💡 Dicas de Uso do Cursor

### Como pedir coisas ao Cursor

**❌ RUIM (muito vago):**
```
"Cria o módulo de pacientes"
```

**✅ BOM (específico):**
```
"Crie o módulo de pacientes seguindo a arquitetura em /docs/architecture.md.

Inclua:
1. Schema Zod para validação em /src/modules/patients/domain/patient.schema.ts
2. Use case createPatient em /src/modules/patients/application/create-patient.ts
3. Repositório Prisma em /src/modules/patients/infra/patient.repository.ts
4. API Route POST /api/patients em /src/app/api/patients/route.ts

Siga as regras de multi-tenant filtrando sempre por clinicId da sessão."
```

### Quando o Cursor errar

1. **Copie o erro** completo
2. **Cole no chat** e diga: "Este erro apareceu. Como resolver?"
3. O Cursor geralmente corrige

### Antes de pedir mudanças em código existente

Diga:
```
"Antes de alterar, me explique o que você vai fazer e quais arquivos serão modificados."
```

---

## 🔧 Comandos Úteis

```bash
# Iniciar desenvolvimento
npm run dev

# Rodar migrations
npx prisma migrate dev --name nome_da_migration

# Gerar Prisma Client após mudanças no schema
npx prisma generate

# Abrir Prisma Studio (visualizar banco no browser)
npx prisma studio

# Verificar lint
npm run lint

# Build de produção
npm run build
```

---

## 📝 Checklist por Sprint

### Sprint 0 - Setup ✓
- [ ] Projeto Next.js criado
- [ ] Dependências instaladas
- [ ] Estrutura de pastas criada
- [ ] Prisma configurado
- [ ] Migration inicial rodada
- [ ] `npm run dev` funciona
- [ ] `/api/health` retorna OK

### Sprint 1 - Auth
- [ ] Auth.js configurado
- [ ] Login funcionando
- [ ] Signup criando Clinic + User Owner
- [ ] Sessão contém clinicId e role
- [ ] Middleware protegendo rotas /app/*
- [ ] Logout funcionando

### Sprint 2 - Usuários + Dentistas
- [ ] CRUD de usuários
- [ ] Atribuição de roles
- [ ] CRUD de dentistas
- [ ] Horários de atendimento
- [ ] Permissões aplicadas

### Sprint 3 - Pacientes
- [ ] CRUD de pacientes
- [ ] Busca e filtros
- [ ] Tela de detalhes
- [ ] Validações Zod

### Sprint 4 - Agenda
- [ ] CRUD de agendamentos
- [ ] Validação de conflitos
- [ ] Status do atendimento
- [ ] Visualização calendário
- [ ] Filtros por dentista/data

### Sprint 5 - Prontuário
- [ ] Criar registro clínico
- [ ] Odontograma JSON
- [ ] Histórico por paciente
- [ ] Permissões (recepção não acessa)
- [ ] Audit log de acesso

### Sprint 6 - Orçamentos + Financeiro
- [ ] CRUD de orçamentos
- [ ] Itens do orçamento
- [ ] Aprovação/Rejeição
- [ ] Pagamentos
- [ ] Caixa básico
- [ ] Relatório financeiro

### Sprint 7 - Estoque + Relatórios
- [ ] CRUD de itens
- [ ] Movimentações
- [ ] Relatório de usuários
- [ ] Relatório de pacientes
- [ ] Relatório financeiro
- [ ] Relatório de estoque

### Sprint 8 - Stripe + Deploy
- [ ] Produto no Stripe
- [ ] Checkout
- [ ] Webhooks
- [ ] Bloqueio sem assinatura
- [ ] Deploy Vercel
- [ ] Banco produção

---

## ❓ Perguntas Frequentes

**P: O Cursor não segue as regras do .cursorrules**
R: Verifique se o arquivo está na raiz do projeto e reinicie o Cursor.

**P: Prisma dá erro de conexão**
R: Verifique se o PostgreSQL está rodando e a DATABASE_URL está correta.

**P: O código gerado não compila**
R: Cole o erro no chat e peça para corrigir. TypeScript strict pega muita coisa.

**P: Como voltar se o Cursor quebrar algo?**
R: Use Git! Faça commits frequentes. `git checkout .` desfaz mudanças.

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas em qualquer sprint, me envie:
1. O que você está tentando fazer
2. O erro ou problema que está enfrentando
3. Os arquivos relevantes

Vou te ajudar a criar o prompt correto para o Cursor resolver.

---

# Boa sorte com o TimeDonto! 🦷
