import { z } from 'zod';

export const tripSchema = z.object({
  id: z.string().max(64).optional(),
  origin: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Origin must be a 3-letter IATA code'),
  destination: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Destination must be a 3-letter IATA code'),
  cabin: z
    .enum(['economy', 'premium_economy', 'business', 'first'])
    .default('economy'),
  departureDate: z.string().max(32).optional().nullable(),
  returnDate: z.string().max(32).optional().nullable(),
  carrier: z.string().max(128).optional().nullable(),
  cashPrice: z.coerce.number().nonnegative().optional().nullable(),
  pointsCost: z.coerce.number().int().nonnegative().optional().nullable(),
  taxes: z.coerce.number().nonnegative().optional().nullable(),
  program: z.string().max(128).optional().nullable(),
  estimatedSavings: z.coerce.number().optional().nullable(),
  dataSource: z.string().max(32).default('benchmark'),
  notes: z.string().max(1000).optional().nullable(),
  metadata: z.record(z.any()).default({}),
}).refine((data) => data.origin !== data.destination, {
  message: 'Origin and destination airports must be different',
  path: ['destination'],
});
