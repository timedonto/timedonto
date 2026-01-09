
# data-model (Modelo de Dados Completo)

Este arquivo descreve **todas as entidades**, campos, relacionamentos, regras, tipos e chaves necessárias para a primeira versão do TimeDonto.

Tudo aqui será usado diretamente para construir o `schema.prisma` depois — com total segurança e sem improviso.

---

# TimeDonto — Modelo de Dados (v1.0.0)

Este documento define as entidades principais do sistema e seus relacionamentos para o MVP comercial.

---

# 1. Estrutura Multi-Tenant (Modelo A)

### Regras Principais:

1. Cada clínica tem **seus próprios dados isolados**.
2. Cada tabela de negócio deve ter um campo obrigatório:
   **`clinicId` → referência para a tabela `Clinic`**
3. Cada usuário pertence a **exatamente uma clínica**.

---

# 2. Lista de Entidades

1. Clinic
2. User
3. Dentist
4. Patient
5. Appointment
6. Record (Prontuário)
7. TreatmentPlan (Orçamento)
8. TreatmentItem
9. Payment
10. Subscription (SaaS)
11. AuditLog

---

# 3. Entidades e Campos

---

## 3.1. Clinic

Representa a conta principal do SaaS.

| Campo     | Tipo          | Regras             |
| --------- | ------------- | ------------------ |
| id        | String (cuid) | PK                 |
| name      | String        | obrigatório        |
| email     | String        | usado para contato |
| phone     | String?       | opcional           |
| address   | String?       | opcional           |
| createdAt | DateTime      | automático         |
| updatedAt | DateTime      | automático         |

---

## 3.2. User

Usuários internos da clínica.

| Campo        | Tipo           | Regras                              |
| ------------ | -------------- | ----------------------------------- |
| id           | String (cuid)  | PK                                  |
| clinicId     | String         | FK → Clinic                         |
| name         | String         | obrigatório                         |
| email        | String         | único por clínica                   |
| passwordHash | String         | obrigatório                         |
| role         | Enum(UserRole) | OWNER, ADMIN, DENTIST, RECEPTIONIST |
| createdAt    | DateTime       | automático                          |
| updatedAt    | DateTime       | automático                          |

**Observações:**

* Dentistas têm tabela própria (User ≠ Dentist).
* user.role = "DENTIST" não substitui tabela Dentist (pois dentistas têm campos adicionais).

---

## 3.3. Dentist

Informações específicas do dentista.

| Campo        | Tipo          | Regras               |
| ------------ | ------------- | -------------------- |
| id           | String (cuid) | PK                   |
| clinicId     | String        | FK → Clinic          |
| userId       | String        | FK → User            |
| specialty    | String?       | opcional             |
| cro          | String        | obrigatório          |
| workingHours | Json?         | horários do dentista |
| createdAt    | DateTime      | automático           |

**Relacionamentos:**

* 1 Dentist → 1 User
* Dentista existe apenas dentro de uma única clínica

---

## 3.4. Patient

Cadastro de paciente.

| Campo     | Tipo          | Regras               |
| --------- | ------------- | -------------------- |
| id        | String (cuid) | PK                   |
| clinicId  | String        | FK                   |
| name      | String        | obrigatório          |
| email     | String?       | opcional             |
| phone     | String?       | opcional             |
| birthDate | DateTime?     | opcional             |
| notes     | String?       | observações internas |
| createdAt | DateTime      | automático           |

---

## 3.5. Appointment (Agenda)

Agendamento de consulta.

| Campo           | Tipo                    | Regras                         |
| --------------- | ----------------------- | ------------------------------ |
| id              | String (cuid)           | PK                             |
| clinicId        | String                  | FK                             |
| dentistId       | String                  | FK → Dentist                   |
| patientId       | String                  | FK → Patient                   |
| date            | DateTime                | início da consulta             |
| durationMinutes | Int                     | padrão: 30                     |
| status          | Enum(AppointmentStatus) | SCHEDULED, CONFIRMED, CANCELED |
| notes           | String?                 | opcional                       |
| createdAt       | DateTime                | automático                     |
| updatedAt       | DateTime                | automático                     |

Regras:

* Dentista não pode ter dois agendamentos no mesmo horário.
* Recepção pode criar agendamentos para qualquer dentista.

---

## 3.6. Record (Prontuário)

Histórico de atendimento.

| Campo         | Tipo          | Regras               |
| ------------- | ------------- | -------------------- |
| id            | String (cuid) | PK                   |
| clinicId      | String        | FK                   |
| patientId     | String        | FK                   |
| dentistId     | String        | FK                   |
| appointmentId | String?       | FK opcional          |
| description   | String        | registro textual     |
| procedures    | Json?         | lista simples no MVP |
| createdAt     | DateTime      | automático           |

Regras:

* Só Owner, Admin e Dentista podem visualizar.
* Todas as visualizações devem gerar log (AuditLog).

---

## 3.7. TreatmentPlan (Orçamento)

| Campo       | Tipo                      | Regras                   |
| ----------- | ------------------------- | ------------------------ |
| id          | String (cuid)             | PK                       |
| clinicId    | String                    | FK                       |
| patientId   | String                    | FK                       |
| dentistId   | String                    | FK                       |
| status      | Enum(TreatmentPlanStatus) | OPEN, APPROVED, REJECTED |
| totalAmount | Decimal                   | valor total              |
| createdAt   | DateTime                  | automático               |

---

## 3.8. TreatmentItem

Itens pertencentes a um orçamento.

| Campo       | Tipo    | Regras             |
| ----------- | ------- | ------------------ |
| id          | String  | PK                 |
| planId      | String  | FK → TreatmentPlan |
| description | String  | obrigatório        |
| value       | Decimal | obrigatório        |
| quantity    | Int     | padrão 1           |

---

## 3.9. Payment (Financeiro Básico)

| Campo       | Tipo                | Regras          |
| ----------- | ------------------- | --------------- |
| id          | String              | PK              |
| clinicId    | String              | FK              |
| patientId   | String?             | FK opcional     |
| amount      | Decimal             | obrigatório     |
| method      | Enum(PaymentMethod) | CASH, PIX, CARD |
| description | String?             | opcional        |
| createdAt   | DateTime            | automático      |

---

## 3.10. Subscription (SaaS Billing)

Representa o relacionamento da clínica com o Stripe.

| Campo                | Tipo                     | Regras                               |
| -------------------- | ------------------------ | ------------------------------------ |
| id                   | String                   | PK                                   |
| clinicId             | String                   | FK                                   |
| stripeCustomerId     | String                   | obrigatório                          |
| stripeSubscriptionId | String                   | obrigatório                          |
| status               | Enum(SubscriptionStatus) | ACTIVE, INACTIVE, CANCELED, PAST_DUE |
| currentPeriodEnd     | DateTime                 | definido pelo Stripe                 |
| createdAt            | DateTime                 | automático                           |

---

## 3.11. AuditLog

Registro de ações sensíveis.

| Campo     | Tipo     | Regras                 |
| --------- | -------- | ---------------------- |
| id        | String   | PK                     |
| clinicId  | String   | FK                     |
| userId    | String   | FK                     |
| action    | String   | ex.: ACCESS_RECORD     |
| targetId  | String?  | Id do recurso acessado |
| metadata  | Json?    | dados adicionais       |
| createdAt | DateTime | automático             |

---

# 4. Enums

### UserRole

```
OWNER
ADMIN
DENTIST
RECEPTIONIST
```

### AppointmentStatus

```
SCHEDULED
CONFIRMED
CANCELED
```

### TreatmentPlanStatus

```
OPEN
APPROVED
REJECTED
```

### PaymentMethod

```
CASH
PIX
CARD
```

### SubscriptionStatus

```
ACTIVE
INACTIVE
CANCELED
PAST_DUE
```

---

# 5. Relacionamentos (Resumo)

```
Clinic 1─∞ User
Clinic 1─∞ Patient
Clinic 1─∞ Dentist
Clinic 1─∞ Appointment
Clinic 1─∞ Payment
Clinic 1─∞ TreatmentPlan
Clinic 1─∞ Record

User 1─1 Dentist
Patient 1─∞ Appointment
Dentist 1─∞ Appointment
Patient 1─∞ Records
Dentist 1─∞ Records

TreatmentPlan 1─∞ TreatmentItem
```

---

# 6. Regras de Consistência

1. `clinicId` deve ser obrigatório em tudo que representa dados da clínica.
2. Usuário só pode ver dados com **mesmo `clinicId`**.
3. Prontuário exige logs obrigatórios.
4. Agendamentos precisam verificar conflitos.
5. Orçamentos pertencem a paciente + dentista.

---

# FIM DO ARQUIVO — data-model.md

---