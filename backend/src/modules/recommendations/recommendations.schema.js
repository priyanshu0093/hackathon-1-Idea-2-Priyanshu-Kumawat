import { z } from 'zod';

export const fareSnapshotInputSchema = z.object({
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
  departureDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be YYYY-MM-DD'),
  returnDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  cabin: z.string().trim().default('economy'),
  carrier: z.string().trim().max(128).optional().nullable(),
  price: z.coerce.number().positive('Price must be greater than 0'),
  currency: z.string().trim().toUpperCase().length(3).default('EUR'),
  targetPrice: z.coerce.number().positive().optional().nullable(),
  dataSource: z.string().trim().default('duffel_live'),
});

export const bestTimeToBookInputSchema = z.object({
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
  departureDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be YYYY-MM-DD'),
  currentPrice: z.coerce.number().positive('Current price must be greater than 0'),
  currency: z.string().trim().toUpperCase().length(3).default('EUR'),
  targetPrice: z.coerce.number().positive().optional().nullable(),
  cabin: z.string().trim().default('economy'),
});

export const bestCardRecommendationInputSchema = z.object({
  cashFare: z.coerce.number().positive('Cash fare must be greater than 0'),
  cashCurrency: z.string().trim().toUpperCase().length(3).default('EUR'),
  origin: z.string().trim().toUpperCase().length(3).optional().nullable(),
  destination: z.string().trim().toUpperCase().length(3).optional().nullable(),
  cabin: z.string().trim().default('economy'),
  carrier: z.string().trim().optional().nullable(),
  awardProgram: z.string().trim().optional().nullable(),
  pointsRequired: z.coerce.number().int().positive().optional().nullable(),
  awardTaxesAndFees: z.coerce.number().nonnegative().optional().default(0),
  userConfiguredValuePerPoint: z.coerce.number().positive().default(0.013),
});

export const smartTripSavingsPlanInputSchema = z.object({
  origin: z.string().trim().toUpperCase().length(3).default('MAD'),
  destination: z.string().trim().toUpperCase().length(3, 'Destination must be a 3-letter IATA code'),
  departureDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be YYYY-MM-DD'),
  returnDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  travelers: z.coerce.number().int().min(1).max(9).default(1),
  budget: z.coerce.number().positive('Budget must be greater than 0'),
  currency: z.string().trim().toUpperCase().length(3).default('EUR'),
  cabin: z.string().trim().default('economy'),
  tripType: z.enum(['one_way', 'round_trip']).default('one_way'),
});
