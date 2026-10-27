import { z } from 'zod';

export const createBookingSchema = z.object({
  bookingReference: z
    .string()
    .trim()
    .min(3, 'Booking reference must be at least 3 characters')
    .max(32, 'Booking reference cannot exceed 32 characters'),
  airline: z
    .string()
    .trim()
    .min(2, 'Airline name is required')
    .max(128),
  flightNumber: z
    .string()
    .trim()
    .max(32)
    .optional()
    .nullable(),
  origin: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Origin must be a 3-letter IATA airport code'),
  destination: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Destination must be a 3-letter IATA airport code'),
  departureDate: z
    .string()
    .min(1, 'Departure date is required')
    .max(32),
  returnDate: z
    .string()
    .max(32)
    .optional()
    .nullable(),
  cabin: z
    .enum(['economy', 'premium_economy', 'business', 'first'])
    .default('economy'),
  pointsRedeemed: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(0),
  taxesPaid: z.coerce
    .number()
    .nonnegative()
    .default(0),
  cashSavedEstimate: z.coerce
    .number()
    .default(0),
  status: z
    .enum(['confirmed', 'ticketed', 'completed', 'cancelled'])
    .default('confirmed'),
  notes: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
}).refine((data) => data.origin !== data.destination, {
  message: 'Origin and destination airports must be different',
  path: ['destination'],
});
