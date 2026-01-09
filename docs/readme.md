# TimeDonto — Plataforma SaaS para Gestão de Clínicas Odontológicas

**Versão:** 1.0.0 (MVP Comercial)

TimeDonto é uma plataforma SaaS moderna e escalável desenvolvida para auxiliar clínicas odontológicas a gerenciarem suas operações diárias.
O sistema oferece módulos essenciais como agenda, pacientes, prontuário, Relatórios, estoque, financeiro e controle de usuários — permitindo que qualquer clínica comece a utilizar imediatamente.

---

# Visão Geral do Produto

TimeDonto é uma solução **all-in-one** para clínicas odontológicas, projetada para ser simples, rápida e poderosa.
Seu objetivo é centralizar os principais fluxos de atendimento e gestão em uma única plataforma intuitiva, acessível e amigável para recepcionistas, dentistas e gestores.

---

# Público-Alvo

* Clínicas odontológicas de pequeno, médio e grande porte
* Consultórios individuais que desejam organização
* Redes com múltiplas unidades (multi-tenant via `clinic_id`)

---

# Modelo Multi-Tenant

Cada clínica possui **uma conta principal** (Owner).
O Owner é responsável por criar e gerenciar os usuários internos:

* Admin
* Dentista
* Recepcionista
* (Futuros perfis opcionais: Assistente, Financeiro, etc.)

Todos os dados são isolados automaticamente por `clinic_id`.

---

# Tecnologias Principais

**Frontend & Backend:**

* Next.js (versão atual / App Router)
* React (server & client components)

**Banco de Dados:**

* PostgreSQL

**ORM:**

* Prisma ORM

**Autenticação:**

* NextAuth / Auth.js (credentials ou OAuth, definido no projeto)

**Pagamentos e Assinatura:**

* Stripe Billing (mensalidade do SaaS)

**Infraestrutura Recomendada:**

* Frontend + Backend: Vercel
* Banco de Dados: Neon.tech / Railway
* Filas / Workers (futuro): Vercel Cron ou Inngest

---

### v1.0.0 — MVP Comercial (Primeiro Lançamento)

## Funcionalidades Principais

### 1. Autenticação & Onboarding

* Criação de conta da clínica
* Fluxo de onboarding inicial (nome da clínica, endereço, responsável)
* Login / Logout
* Recuperação de senha

### 2. Multi-tenant

* Cada clínica isolada por `clinic_id`
* Separação automática dos dados no banco
* Permissões básicas por usuário (Admin, Recepção, Dentista, Financeiro)

### 3. Gestão de Usuários da Clínica

* Cadastro de usuários internos
* Definição de cargos e permissões predefinidas
* Controle de acesso por módulo

### 4. Gestão de Dentistas

* Cadastro de dentistas por clinica de atuação
* Registro de CRO, especialidade e agenda de atuação
* Dados Bancários


### 5. Pacientes

* Cadastro de pacientes
* Histórico básico (informações pessoais + observações)
* Anexos simples (ex.: PDFs, imagens) — *opcional para o MVP, você decide*
*Prontuario vinculado

### 6. Agenda

* Visualização diária / semanal
* Criação de agendamentos
* Cancelamentos e remarcações
* Vinculação paciente + dentista

### 7. Prontuário Odontológico (Simplificado no MVP)

* Registro de atendimento com:

  * Motivo da consulta
  * Procedimentos realizados
  * Observações
* Histórico de atendimentos por paciente

### 8. Orçamentos / Planos de Tratamento (Simplificado)

* Criação de orçamento
* Lista de procedimentos e valores
* Status (Aberto, Aprovado, Rejeitado)

### 9. Financeiro Básico

* Registrar pagamentos (dinheiro, cartão, PIX)
* Controle simples de caixa
* Relatório financeiro diário / mensal
* Comissão dos dentista

### 10. Assinatura SaaS (Stripe)

* Plano único mensal (MVP)
* Checkout com Stripe
* Renovação automática
* Cancelamento de assinatura
Obs: A validar esse modelo de venda

### 11.Implementar 'Odontograma'
* Implementar modelo de Odontongrama simplificado

### 12. Infraestrutura e Segurança

* Logs básicos
* Proteção de rotas
* Validação e sanitização de inputs
* Boas práticas para dados sensíveis de saúde (sem LGPD avançada ainda)

### 13. Relatórios 
* Relação de Usuário
* Relação de Pacientes
* Relatorios Financeiros
* Relatório de Agenda (Por profissional e especialidade)

### 14. Estoque
* Cadastro de Materiais de consumo
* Cadastro de saída dos materias para os consultorios
* O estoque deve ser permissionado

---

# Resumo do MVP (v1.0)

O TimeDonto v1.0 colocará no ar um sistema **funcional para clínicas começarem a operar imediatamente**, com:

* Agenda
* Pacientes
* Dentistas
* Atendimentos
* Orçamentos
* Financeiro
* Relatórios
* Estoque
* Multi-tenant
* Autenticação
* Assinatura
---

# Estrutura Macro (conceitual)

```
/src
  /app
  /modules
    /auth
    /clinics
    /users
    /dentists
    /patients
    /appointments
    /records (prontuário)
    /finance
    /billing
  /lib
  /components
  /utils
```

*Detalhamento completo será definido no arquivo `architecture.md`.*

---

# Modelo de Negócio (Modelo a ser definido)

SaaS de assinatura mensal baseado em:

* Plano único
* Cobrança automática via Stripe
* Cancelamento a qualquer momento

---

# Objetivos do MVP

1. Colocar o produto no ar rapidamente com estabilidade.
2. Permitir que clínicas já utilizem o sistema no dia a dia.
3. Criar uma base sólida para iterações futuras.
4. Evitar complexidade desnecessária no início.

---

# CHANGELOG — v1.0.0

Inclui módulos essenciais:

* Autenticação e onboarding
* Multi-tenant
* Gestão de usuários
* Dentistas
* Pacientes
* Agenda
* Prontuário
* Relatorios
* Estoque
* Orçamentos
* Financeiro básico
* Assinaturas Stripe

---

# Suporte e Contato

(Repositório ainda a definir)
E-mail de suporte será configurado no lançamento.

---

# FIM DO ARQUIVO README.md

---
