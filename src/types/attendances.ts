// src/types/attendances.ts
// Tipos para atendimentos - usar em componentes client ("use client")
// Substitui import de @prisma/client em frontend

export const AttendanceStatus = {
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
  NO_SHOW: 'NO_SHOW',
} as const

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]
