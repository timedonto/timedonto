# requirements.md — TimeDonto

# TimeDonto — Requisitos Detalhados (MVP v1.0.0)

Este documento descreve todos os requisitos funcionais e não funcionais para a construção do TimeDonto — um SaaS de gestão para clínicas odontológicas.

---

# 1. Requisitos Funcionais (RF)

## RF01 — Autenticação

* RF01.1 — Criar conta da clínica (Owner).
* RF01.2 — Login com email e senha.
* RF01.3 — Recuperação de senha.
* RF01.4 — Owner pode convidar usuários internos (Admin, Dentist, Receptionist).
* RF01.5 — Logout.
* RF01.6 — Autenticação JWT/Session (definido pela stack).

---

## RF02 — Gestão da Clínica

* RF02.1 — Owner pode editar informações da clínica.
* RF02.2 — Owner pode gerenciar assinatura (Stripe).
* RF02.3 — Admin pode editar informações operacionais (exceto cobrança).
* RF02.4 — Owner/Admin pode gerenciar usuários internos.
* RF02.5 — Permitir ativar/desativar usuários internos.

---

## RF03 — Gestão de Usuários Internos

* RF03.1 — Criar usuários por papel (Owner, Admin, Dentist, Receptionist).
* RF03.2 — Editar dados básicos.
* RF03.3 — Controle de permissões conforme papel.
* RF03.4 — Cada usuário pertence a apenas **uma** clínica.

---

## RF04 — Dentistas

* RF04.1 — Cadastro completo do dentista.
* RF04.2 — Definição de horários de atendimento.
* RF04.3 — Histórico de atendimentos realizados.
* RF04.4 - Dados Bancários
* RF04.5 - Comissão

---

## RF05 — Pacientes

* RF05.1 — Cadastro completo do paciente.
* RF05.2 — Histórico de consultas.
* RF05.3 — Observações internas.
* RF05.4 — Dados de contato.
* RF05.5 — Upload simples de anexos (PDF, imagens) — *Opcional no MVP*.
* RF05.6 - Histórico Financeiro vinculado
* RF05.7 - Prontuario eletronico vinculado


---

## RF06 — Agenda (Calendário)

* RF06.1 — Visualização diária e semanal.
* RF06.2 — Criar agendamentos com:

  * Dentista
  * Paciente
  * Procedimento
  * Data e hora
* RF06.3 — Editar/agendar/cancelar.
* RF06.4 — Regras de conflito (não permitir dentista em duas consultas no mesmo horário).
* RF06.5 — Status: Agendado, Confirmado, Cancelado,Remarcado, Falta, Presente

---

## RF07 — Prontuário Odontológico

* RF07.1 — Registrar atendimento.
* RF07.2 — Procedimentos realizados.
* RF07.3 — Observações.
* RF07.4 — Histórico cronológico por paciente.
* RF07.5 — Prontuário apenas visível para:

  * Dentista
  * Admin
  * Owner

---

## RF08 — Orçamentos e Planos de Tratamento

* RF08.1 — Criar orçamento.
* RF08.2 — Adicionar procedimentos e valores.
* RF08.3 — Status: Aberto, Aprovado, Rejeitado.
* RF08.4 — Associar ao paciente e dentista.
* RF08.5 — Histórico de orçamentos por paciente.

---

## RF09 — Financeiro Básico

* RF09.1 — Registrar pagamentos.
* RF09.2 — Métodos: Dinheiro, PIX, Cartão.
* RF09.3 — Relatório financeiro diário.
* RF09.4 — Relatório mensal.
* RF09.5 — Controlar caixa básico (entradas).

---

## RF10 — Assinatura SaaS (Stripe) (A verificar)

* RF10.1 — Plano único mensal.
* RF10.2 — Checkout Stripe.
* RF10.3 — Renovação automática.
* RF10.4 — Cancelamento.
* RF10.5 — Webhooks para status da assinatura.

---

## RF11 — Notificações (MVP básico)

* RF11.1 — Alertas internos no sistema (sem e-mail no MVP).
* RF11.2 — Confirmação de ações importantes.

---

## RF12 — Logs e Auditoria

* RF12.1 — Registrar todos os acessos ao prontuário.
* RF12.2 — Registrar criação/alteração de dados sensíveis.
* RF12.3 — Logs acessíveis apenas ao Owner/Admin.

## RF13 - Relatórios De Gestão
*RF13.1 - Relação de Usuários
*RF13.2 - Relação de pacientes
*RF13.3 - Relatorios Financeiros
*RF13.4 - Relatorio dispensação do estoque

## RF14 - Controle de Estoque
*RF14.1 - Cadastro do estoque
*RF14.2 - Carrinho de dispensação
*RF14.3 - Vincular o carrinho com os atendimentos
*RF14.4 - A dispensação deve ser permissionada


---

# 2. Requisitos Não Funcionais (RNF)

## RNF01 — Performance

* Resposta de API < 300ms em operações críticas.
* Páginas carregam em < 2s.

## RNF02 — Segurança

* Isolamento multi-tenant por `clinic_id`.
* Prontuário criptografado ou protegido por camada de segurança extra.
* Sanitização de inputs.
* Autenticação server-side.
* Seguir boas práticas OWASP.

## RNF03 — Escalabilidade

* Banco de dados projetado para múltiplas clínicas.
* Uso de índices adequados.
* Estrutura modular no backend.

## RNF04 — Logs

* Logs mínimos no MVP.
* Expansível para Logtail / Datadog futuramente.

## RNF05 — Disponibilidade

* Alvo: 99% uptime.
* Deploy automático via Vercel.

---

# 3. Regras de Negócio (RN)

### RN01 — Cada usuário pertence apenas a uma clínica.

### RN02 — Owner é o único com acesso às configurações de cobrança.

### RN03 — Prontuário é sigiloso e não pode ser acessado por Recepcionistas.

### RN04 — Agendamento não pode ocorrer em horário já ocupado pelo dentista.

### RN05 — Orçamento só pode ser aprovado pelo Dentista ou Admin.

### RN06 — Financeiro completo só pode ser visto por:

* Owner
* Admin

### RN07 — Pacientes não são compartilhados entre clínicas.

### RN08 - Controle de Estoque

---

# 4. Papéis e Permissões (Resumo)

| Módulo     | Owner | Admin        | Dentist      | Receptionist |
| ---------- | ----- | ------------ | ------------ | ------------ |
| Clínica    | ✔️    | ✔️ (parcial) | ❌            | ❌            |
| Usuários   | ✔️    | ✔️           | ❌            | ❌            |
| Agenda     | ✔️    | ✔️           | ✔️ (própria) | ✔️           |
| Pacientes  | ✔️    | ✔️           | ✔️ parcial   | ✔️           |
| Prontuário | ✔️    | ✔️           | ✔️           | ❌            |
| Orçamentos | ✔️    | ✔️           | ✔️           | criar        |
| Financeiro | ✔️    | ✔️           | parcial      | parcial      |
| Assinatura | ✔️    | ❌            | ❌            | ❌            |

---

# 5. Critérios Mínimos para Lançamento (MVP pronto para uso)

* Autenticação funcionando.
* Multi-tenant funcionando.
* Agenda operacional.
* Cadastro de pacientes e dentistas.
* Prontuário funcional.
* Financeiro básico.
* Orçamentos.
* Assinatura Stripe completa.

---

# FIM DO ARQUIVO — requirements.md

---