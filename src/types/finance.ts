// src/types/finance.ts
// Tipos para financeiro - usar em app/ e components (substitui @prisma/client)

export const PaymentMethod = {
  CASH: 'CASH',
  PIX: 'PIX',
  CARD: 'CARD',
} as const

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]
