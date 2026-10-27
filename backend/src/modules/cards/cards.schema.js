import { z } from 'zod';

export const addCardSchema = z.object({
  cardProductId: z
    .string({ required_error: 'Card product ID is required' })
    .trim()
    .min(1, 'Card product ID cannot be empty')
    .max(64, 'Card product ID too long'),
  nickname: z
    .string()
    .trim()
    .max(64, 'Nickname cannot exceed 64 characters')
    .optional()
    .nullable(),
  estimatedMonthlySpend: z.coerce
    .number({ invalid_type_error: 'Estimated monthly spend must be a number' })
    .min(0, 'Monthly spend cannot be negative')
    .max(50000, 'Monthly spend exceeds realistic demo limit (max 50,000 €)')
    .default(0),
});

export const updateCardSchema = z.object({
  nickname: z
    .string()
    .trim()
    .max(64, 'Nickname cannot exceed 64 characters')
    .optional()
    .nullable(),
  estimatedMonthlySpend: z.coerce
    .number({ invalid_type_error: 'Estimated monthly spend must be a number' })
    .min(0, 'Monthly spend cannot be negative')
    .max(50000, 'Monthly spend exceeds realistic demo limit (max 50,000 €)')
    .optional(),
});
