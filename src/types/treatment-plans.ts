// src/types/treatment-plans.ts
// Tipos para planos de tratamento - usar em componentes client ("use client")
// Substitui import de @prisma/client em frontend

export const TreatmentPlanStatus = {
  OPEN: 'OPEN',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type TreatmentPlanStatus = (typeof TreatmentPlanStatus)[keyof typeof TreatmentPlanStatus]
