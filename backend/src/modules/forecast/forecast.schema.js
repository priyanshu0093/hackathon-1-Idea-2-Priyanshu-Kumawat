import { z } from 'zod';

export const calculateForecastSchema = z.object({
  monthlySpend: z.coerce
    .number()
    .positive('Monthly eligible spending must be greater than 0')
    .max(100000, 'Monthly spend exceeds typical personal threshold'),
  rewardProgram: z
    .string()
    .trim()
    .min(2, 'Reward program name is required')
    .max(128),
  earningRate: z.coerce
    .number()
    .min(0.5, 'Earning rate must be at least 0.5 points per unit')
    .max(10, 'Earning rate cannot exceed 10 points per unit')
    .default(1.5),
  targetDestination: z
    .string()
    .trim()
    .toUpperCase()
    .max(10)
    .optional()
    .nullable(),
  targetPoints: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .nullable(),
  travelDate: z
    .string()
    .max(32)
    .optional()
    .nullable(),
  currentPoints: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(0),
});
