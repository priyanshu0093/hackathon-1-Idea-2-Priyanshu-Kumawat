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

export const redeemDemoPointsSchema = z.object({
  pointsRequired: z.coerce
    .number()
    .int()
    .positive('Points required must be greater than zero'),
  program: z.string().trim().min(2, 'Rewards program name is required'),
  airline: z.string().trim().min(2, 'Airline name is required'),
  flightNumber: z.string().trim().max(32).optional().nullable(),
  origin: z.string().trim().toUpperCase().length(3, 'Origin must be a 3-letter IATA airport code'),
  destination: z.string().trim().toUpperCase().length(3, 'Destination must be a 3-letter IATA airport code'),
  departureDate: z.string().min(1, 'Departure date is required'),
  returnDate: z.string().max(32).optional().nullable(),
  cabin: z.string().default('economy'),
  taxesPaid: z.coerce.number().nonnegative().default(0),
  cashSavedEstimate: z.coerce.number().default(0),
  currency: z.string().default('EUR'),
  passengerName: z.string().trim().min(2, 'Passenger name is required'),
}).refine((data) => data.origin !== data.destination, {
  message: 'Origin and destination airports must be different',
  path: ['destination'],
});

export const bookDuffelFlightSchema = z.object({
  offerId: z.string().trim().min(4, 'Duffel offer ID is required'),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Explicit confirmation is required before submitting flight booking' }),
  }),
  passenger: z.object({
    title: z.enum(['mr', 'ms', 'mrs', 'dr']).default('mr'),
    gender: z.enum(['m', 'f']).optional(),
    given_name: z.string().trim().min(1, 'First name is required'),
    family_name: z.string().trim().min(1, 'Last name is required'),
    born_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
    email: z.string().trim().email('A valid email address is required'),
    phone_number: z.string().trim().min(6, 'A valid phone number with country code is required'),
  }),
});

export const revalidateOfferSchema = z.object({
  offerId: z.string().trim().min(4, 'Offer ID is required'),
});
