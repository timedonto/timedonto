# TimeDonto — API Specification (MVP v1.0.0)

Este documento define a especificação dos principais endpoints da API do TimeDonto para o MVP v1.0.0.

---

## 1. Convenções Gerais

* Base path (Next.js): `/api/*`
* Formato: JSON
* Autenticação:

  * Session/Auth.js (cookie) ou `Authorization: Bearer <token>` (conforme implementação)
* Multi-tenant:

  * `clinicId` **sempre derivado da sessão do usuário**
  * Nunca vem do cliente no body ou query para dados sensíveis
* Resposta padrão de erro:

```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

Resposta padrão de sucesso:

```json
{
  "success": true,
  "data": { ... }
}
```

---

## 2. Auth

### 2.1. POST /api/auth/signup

Cria uma nova clínica + usuário Owner.

**Permissão:** Público (não autenticado)

**Body:**

```json
{
  "clinicName": "Clínica Sorriso",
  "ownerName": "João Silva",
  "email": "owner@clinic.com",
  "password": "SenhaSegura123"
}
```

**Resposta 201:**

```json
{
  "success": true,
  "data": {
    "clinicId": "cl_123",
    "userId": "usr_123"
  }
}
```

---

### 2.2. POST /api/auth/login

**Permissão:** Público

**Body:**

```json
{
  "email": "owner@clinic.com",
  "password": "SenhaSegura123"
}
```

**Resposta 200:**

```json
{
  "success": true,
  "data": {
    "userId": "usr_123",
    "role": "OWNER"
  }
}
```

(Sessão/cookie é configurada server-side.)

---

### 2.3. POST /api/auth/logout

**Permissão:** Usuário autenticado.

Body vazio.

**Resposta 200:**

```json
{ "success": true }
```

---

### 2.4. (Opcional MVP) POST /api/auth/forgot-password

Envia instrução de recuperação (pode ser simples no MVP, ou adiado).

---

## 3. Clínica

### 3.1. GET /api/clinic

Retorna dados da clínica atual (baseado na sessão).

**Permissão:** OWNER, ADMIN, DENTIST, RECEPTIONIST

**Resposta 200:**

```json
{
  "success": true,
  "data": {
    "id": "cl_123",
    "name": "Clínica Sorriso",
    "email": "contato@clinic.com",
    "phone": "+55 11 99999-9999",
    "address": "Rua X, 123"
  }
}
```

---

### 3.2. PATCH /api/clinic

Atualiza dados gerais da clínica.

**Permissão:** OWNER, ADMIN (alguns campos podem ser restritos ao OWNER)

**Body (exemplo):**

```json
{
  "name": "Novo Nome da Clínica",
  "phone": "+55 11 98888-7777",
  "address": "Nova Rua, 999"
}
```

---

## 4. Usuários Internos

### 4.1. GET /api/users

Lista usuários da clínica.

**Permissão:** OWNER, ADMIN

**Query params (opcional):**

* `role`: filtra por papel (`OWNER`, `ADMIN`, `DENTIST`, `RECEPTIONIST`)

**Resposta 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "usr_1",
      "name": "João",
      "email": "owner@clinic.com",
      "role": "OWNER"
    }
  ]
}
```

---

### 4.2. POST /api/users

Cria usuário interno na clínica.

**Permissão:** OWNER, ADMIN

**Body:**

```json
{
  "name": "Maria",
  "email": "maria@clinic.com",
  "role": "RECEPTIONIST",
  "password": "Senha123"
}
```

---

### 4.3. PATCH /api/users/:id

Atualiza dados básicos do usuário (nome, papel, status).

**Permissão:** OWNER, ADMIN
(Owner não pode ser rebaixado por Admin.)

**Body (exemplo):**

```json
{
  "name": "Maria da Silva",
  "role": "ADMIN"
}
```

---

### 4.4. DELETE /api/users/:id

Desativar/remover usuário.

**Permissão:** OWNER, ADMIN
(Não pode remover a si próprio se for o único OWNER.)

---

## 5. Dentists

### 5.1. GET /api/dentists

Lista dentistas da clínica.

**Permissão:** OWNER, ADMIN, RECEPTIONIST, DENTIST

---

### 5.2. POST /api/dentists

Cria um dentista vinculado a um `User` existente ou cadastra ambos (dependendo da implementação).

**Permissão:** OWNER, ADMIN

**Body (exemplo):**

```json
{
  "userId": "usr_123",
  "cro": "CRO-12345",
  "specialty": "Ortodontia",
  "workingHours": {
    "monday": ["08:00-12:00", "14:00-18:00"]
  }
}
```

---

### 5.3. GET /api/dentists/:id

Detalhes do dentista.

---

### 5.4. PATCH /api/dentists/:id

Atualiza dados do dentista (CRO, especialidade, horários).

**Permissão:** OWNER, ADMIN

---

## 6. Patients

### 6.1. GET /api/patients

Lista pacientes da clínica.

**Permissão:** OWNER, ADMIN, DENTIST, RECEPTIONIST

**Query params (opcional):**

* `q`: termo de busca (nome, email, telefone)
* paginação futura

---

### 6.2. POST /api/patients

Cria paciente.

**Permissão:** OWNER, ADMIN, RECEPTIONIST, DENTIST

**Body:**

```json
{
  "name": "Ana Souza",
  "email": "ana@example.com",
  "phone": "+55 11 90000-0000",
  "birthDate": "1990-05-20",
  "notes": "Paciente ansiosa, prefere manhã."
}
```

---

### 6.3. GET /api/patients/:id

Detalhes do paciente.

**Permissão:** OWNER, ADMIN, DENTIST, RECEPTIONIST
(Apenas dados cadastrais; prontuário fica em outro endpoint.)

---

### 6.4. PATCH /api/patients/:id

Atualiza dados do paciente.

**Permissão:** OWNER, ADMIN, RECEPTIONIST, DENTIST

---

### 6.5. DELETE /api/patients/:id

Opcional (normalmente soft delete).

**Permissão:** OWNER, ADMIN

---

## 7. Appointments (Agenda)

### 7.1. GET /api/appointments

Lista agendamentos.

**Permissão:** OWNER, ADMIN, DENTIST, RECEPTIONIST

**Query params:**

* `date`: filtrar por dia específico
* `dentistId`: filtrar por profissional
* `status`: opcional

---

### 7.2. POST /api/appointments

Cria agendamento.

**Permissão:** OWNER, ADMIN, RECEPTIONIST

**Body:**

```json
{
  "dentistId": "den_123",
  "patientId": "pat_123",
  "date": "2025-12-07T14:00:00.000Z",
  "durationMinutes": 30,
  "notes": "Retorno"
}
```

* Backend deve validar conflito de horário para o mesmo dentista.

---

### 7.3. GET /api/appointments/:id

Detalhes de um agendamento.

---

### 7.4. PATCH /api/appointments/:id

Atualiza horário, status ou notas.

**Permissão:** OWNER, ADMIN, RECEPTIONIST

**Body (exemplo):**

```json
{
  "status": "CANCELED",
  "notes": "Paciente avisou com antecedência."
}
```

---

### 7.5. DELETE /api/appointments/:id

Opcional (soft delete); normalmente só se altera status para `CANCELED`.

---

## 8. Records (Prontuário)

### 8.1. GET /api/patients/:id/records

Lista prontuários do paciente.

**Permissão:** OWNER, ADMIN, DENTIST
(Recepcionista **não pode** acessar.)

---

### 8.2. POST /api/patients/:id/records

Cria registro de atendimento para o paciente.

**Permissão:** DENTIST, ADMIN, OWNER

**Body:**

```json
{
  "dentistId": "den_123",
  "appointmentId": "app_123",
  "description": "Consulta inicial, limpeza e avaliação.",
  "procedures": [
    { "code": "LIMPEZA", "description": "Profilaxia", "tooth": "11" }
  ]
}
```

* Toda leitura/escrita de prontuário deve gerar **AuditLog** internamente.

---

### 8.3. GET /api/records/:id

Detalhes de um prontuário específico.

**Permissão:** OWNER, ADMIN, DENTIST

---

## 9. Treatment Plans (Orçamentos)

### 9.1. GET /api/treatment-plans

Lista orçamentos da clínica (com filtros).

**Permissão:** OWNER, ADMIN, DENTIST, RECEPTIONIST (visualização limitada)

**Query params:**

* `patientId`
* `status` (`OPEN`, `APPROVED`, `REJECTED`)

---

### 9.2. POST /api/treatment-plans

Cria um novo plano de tratamento.

**Permissão:** DENTIST, ADMIN, OWNER

**Body:**

```json
{
  "patientId": "pat_123",
  "dentistId": "den_123",
  "items": [
    { "description": "Canal", "value": 500.0, "quantity": 1 },
    { "description": "Restauração", "value": 200.0, "quantity": 2 }
  ]
}
```

Backend calcula `totalAmount`.

---

### 9.3. GET /api/treatment-plans/:id

Detalhes do plano.

---

### 9.4. PATCH /api/treatment-plans/:id

Atualiza status ou itens (com cuidado).

**Permissão para APROVAR/REJEITAR:** DENTIST, ADMIN, OWNER

**Body (exemplo):**

```json
{
  "status": "APPROVED"
}
```

---

## 10. Financeiro Básico (Payments)

### 10.1. GET /api/payments

Lista pagamentos / lançamentos de caixa.

**Permissão:** OWNER, ADMIN
(Dentist/Receptionist podem ter visualização resumida no futuro.)

**Query params (opcional):**

* `from`: data início
* `to`: data fim

---

### 10.2. POST /api/payments

Registra pagamento.

**Permissão:** OWNER, ADMIN, RECEPTIONIST (pode ser configurado)

**Body:**

```json
{
  "patientId": "pat_123",
  "amount": 200.0,
  "method": "PIX",
  "description": "Pagamento de consulta"
}
```

---

## 11. Assinatura SaaS (Billing / Stripe)

### 11.1. POST /api/billing/checkout-session

Cria uma sessão de checkout no Stripe para a clínica.

**Permissão:** OWNER

**Body:**

```json
{
  "priceId": "price_123"
}
```

**Resposta 200:**

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

---

### 11.2. GET /api/billing/subscription

Retorna dados da assinatura da clínica atual.

**Permissão:** OWNER

**Resposta 200:**

```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "currentPeriodEnd": "2026-01-10T00:00:00.000Z"
  }
}
```

---

### 11.3. POST /api/billing/cancel

Cancela assinatura.

**Permissão:** OWNER

---

### 11.4. POST /api/billing/stripe-webhook

Endpoint de webhook do Stripe.

**Permissão:** Público (autenticado via assinatura de webhook do Stripe, não via sessão)

* Trata eventos como:

  * `customer.subscription.created`
  * `customer.subscription.updated`
  * `customer.subscription.deleted`
* Atualiza tabela `Subscription`.

---

## 12. Audit Log

### 12.1. GET /api/audit-logs

Lista logs de ações sensíveis.

**Permissão:** OWNER, ADMIN

**Query params:**

* `userId` (opcional)
* `action` (opcional)
* `from` / `to`

---

# FIM DO ARQUIVO — api-spec.md

---