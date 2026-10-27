import { z } from 'zod';

export const balanceSchema = z.object({
  id: z.string().max(64).optional(),
  program: z
    .string()
    .trim()
    .min(2, 'Program name is required')
    .max(128),
  programType: z
    .enum(['airline', 'bank_transfer', 'hotel'])
    .default('airline'),
  balance: z.coerce
    .number()
    .int('Points balance must be an integer')
    .nonnegative('Points balance cannot be negative'),
  currencyName: z
    .string()
    .trim()
    .max(64)
    .default('points'),
  notes: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});
