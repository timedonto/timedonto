# TimeDonto — UI Flow (MVP v1.0.0)

Este documento define o fluxo das principais telas do sistema, garantindo que a navegação seja consistente, clara e adequada aos papéis dos usuários.

---

# 1. Estrutura Geral da Aplicação

### Áreas principais:

1. **Pública (sem autenticação)**

   * Landing Page *(opcional)*
   * Login
   * Signup (Criar Clínica)

2. **Área Autenticada**

   * Dashboard
   * Agenda
   * Pacientes
   * Dentistas
   * Orçamentos
   * Financeiro
   * Estoque
   * Configurações da Clínica
   * Relatórios
   * Billing (somente Owner)

Cada área autenticada segue o layout com:

* Sidebar
* Header com perfil do usuário
* Conteúdo principal

---

# 2. Fluxo de Login e Signup

## 2.1. Fluxo de Signup (Criar Clínica)

**Página: `/signup`**

Passos:

1. Usuário preenche:

   * Nome da clínica
   * Nome do responsável (Owner)
   * Email
   * Senha
2. Backend cria:

   * `Clinic`
   * `User (Owner)`
3. Redireciona para onboarding.

---

## 2.2. Fluxo de Login

**Página: `/login`**

1. Usuário insere email e senha.
2. Se válido:

   * Carrega sessão
   * Busca `role` e `clinicId`
3. Redireciona para `/dashboard`.

---

# 3. Onboarding da Clínica (primeiro acesso)

**Página: `/onboarding`**

Owner pode atualizar dados iniciais:

* Nome da clínica
* Telefone
* Endereço

Após concluir → `/dashboard`

---

# 4. Dashboard

**Página: `/dashboard`**

Exibe cards com visão geral:

* Consultas do dia
* Pacientes cadastrados
* Dentistas ativos
* Caixa do dia (Owner/Admin)
* Status da assinatura (Owner)

Permissões:

* **Todos os usuários autenticados** acessam, com visões diferentes:

  * Dentist → agenda pessoal
  * Receptionist → próximos atendimentos
  * Admin/Owner → visão geral completa

---

# 5. Agenda (Appointments)

## **Página: `/appointments`**

Componentes:

* Filtro de dentista
* Visualização diária / semanal
* Botão "Novo agendamento"

### Fluxo: Criar agendamento

1. Usuário abre modal/formulário:

   * Seleciona dentista
   * Seleciona paciente
   * Horário
   * Notas
   * Especialidades
   * Status da agenda
2. Backend valida:

   * Conflitos de horário
   * Existência de paciente e dentista

### Fluxo: Editar agendamento

* Alterar horário
* Alterar status (Confirmado / Cancelado, Falta, Presente,Remarcado)

### Fluxo: Cancelar

* Somente altera status → CANCELED

Permissões:

* Owner, Admin, Receptionist = total
* Dentist = pode visualizar próprios agendamentos apenas

---

# 6. Dentistas

## **Página: `/dentists` (lista)**

Lista de dentistas da clínica.
Campos:

* Nome
* CRO
* Especialidade
* Status
* Dados Bancários

Botões:

* Criar dentista
* Editar
* Ver agenda (opcional)

---

## **Página: `/dentists/new`**

Formulário:

* Selecionar usuário existente OU criar novo (Owner/Admin define qual modelo adotar)
* CRO
* Especialidade
* Horários de atendimento

---

## **Página: `/dentists/[id]`**

Exibe dados completos do profissional.

Permissões:

* Owner, Admin, Dentist = total
* Receptionist = apenas visualização

---

# 7. Pacientes

## **Página: `/patients` (lista)**

Componentes:

* Busca rápida
* Tabela com nome, telefone, data de cadastro
* Botão “Novo paciente”

Permissões:

* Owner, Admin, Dentist, Receptionist

---

## **Página: `/patients/new`**

Formulário com:

* Nome
* Email
* Telefone
* Data de nascimento
* Observações internas

---

## **Página: `/patients/[id]`**

Aba 1 — Informações gerais
Aba 2 — Agenda do paciente
Aba 3 — Orçamentos
Aba 4 — Prontuário (somente Dentista/Admin/Owner)

---

# 8. Orçamentos (Treatment Plans)

## **Página: `/treatment-plans`**

Componentes:

* Lista de orçamentos
* Filtros (status, paciente,profissional)
* Botão “Criar orçamento”

---

## **Página: `/treatment-plans/new`**

Formulário:

* Selecionar paciente
* Selecionar dentista
* Adicionar itens (procedimento + valor + quantidade)
* Exibir valor total

---

## **Página: `/treatment-plans/[id]`**

Exibe:

* Dados do paciente
* Itens do orçamento
* Valor total
* Botão “Aprovar” / “Rejeitar” (Admin/Dentist/Owner)

Recepcionista pode:

* Ver
* Gerar PDF (futuro)

---

# 9. Prontuário (Records)

## **Página: `/patients/[id]/records`**

Lista registros clínicos.

### Fluxo: Criar registro

**Página:** `/records/new?patientId=XYZ`

Formulário:

* Dentista
* Descrição
* Procedimentos (lista simples no MVP)
* Anexos (futuro)

### Fluxo: Visualizar registro

**Página:** `/records/[id]`

Somente:

* Dentist
* Admin
* Owner

---

# 10. Financeiro Básico

## **Página: `/finance`**

Componentes:

* Resumo do caixa
* Filtros por data
* Lista de pagamentos

---

## **Página: `/finance/new`**

Registra pagamento:

* Paciente (opcional)
* Valor
* Forma de pagamento
* Observação

---

# 11. Billing (Assinatura)

## **Página: `/billing`**

Somente Owner.

Exibe:

* Status da assinatura
* Valor mensal
* Data de renovação
* Botão “Gerenciar assinatura” (Stripe)

---

## **Página: `/billing/checkout`**

Criado automaticamente via Stripe checkout URL.

---

# 12. Configurações da Clínica

## **Página: `/settings`**

Tabs:

* Dados gerais da clínica
* Usuários internos
* Segurança *(futuro)*
* Preferências *(futuro)*

---

# 13. Permissões de UI (Resumo)

| Módulo     | Owner | Admin | Dentist       | Receptionist  |
| ---------- | ----- | ----- | ------------- | ------------- |
| Dashboard  | ✔️    | ✔️    | ✔️ (limitado) | ✔️ (limitado) |
| Agenda     | ✔️    | ✔️    | ✔️ própria    | ✔️            |
| Pacientes  | ✔️    | ✔️    | ✔️ parcial    | ✔️            |
| Prontuário | ✔️    | ✔️    | ✔️            | ❌             |
| Dentistas  | ✔️    | ✔️    | parcial       | parcial       |
| Orçamentos | ✔️    | ✔️    | ✔️            | ver           |
| Financeiro | ✔️    | ✔️    | parcial       | parcial       |
| Billing    | ✔️    | ❌     | ❌             | ❌             |

---

# 14. Fluxo Macro do Usuário (Resumo Visual)

```
Login → Dashboard
          ↓
        Agenda → Criar/editar consulta
          ↓
      Pacientes → Ver ficha → Orçamentos → Prontuário
          ↓
       Dentistas → Editar profissionais
          ↓
       Financeiro → Pagamentos
          ↓
       Settings → Usuários internos / dados da clínica
          ↓
        Billing (Owner)
```

---

# FIM DO ARQUIVO — ui-flow.md

---