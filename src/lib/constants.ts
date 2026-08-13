// src/lib/constants.ts
export const PAYROLL_STATUS = {
  DRAFT: 'DRAFT',
  PREPARED: 'PREPARED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  LOCKED: 'LOCKED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

export type PayrollStatus = typeof PAYROLL_STATUS[keyof typeof PAYROLL_STATUS];