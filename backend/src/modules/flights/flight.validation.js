import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const iataRegex = /^[A-Z]{3}$/;

export const flightSearchSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(iataRegex, 'Origin must be a 3-letter IATA airport code (e.g. MAD)'),
    destination: z
      .string()
      .trim()
      .toUpperCase()
      .regex(iataRegex, 'Destination must be a 3-letter IATA airport code (e.g. JFK)'),
    departureDate: z
      .string()
      .regex(dateRegex, 'Departure date must be in YYYY-MM-DD format'),
    returnDate: z
      .string()
      .regex(dateRegex, 'Return date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    tripType: z.enum(['one_way', 'round_trip', 'multi_city']).default('round_trip'),
    travelers: z.coerce.number().int().min(1).max(9).default(1),
    cabin: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
    currency: z.string().trim().toUpperCase().length(3).default('EUR'),
    maxOffers: z.coerce.number().int().min(1).max(20).default(10),
  })
  .refine((data) => data.origin !== data.destination, {
    message: 'Origin and destination airports cannot be identical',
    path: ['destination'],
  })
  .refine(
    (data) => {
      if (data.tripType === 'round_trip' && data.returnDate) {
        return data.returnDate >= data.departureDate;
      }
      return true;
    },
    {
      message: 'Return date cannot be earlier than departure date',
      path: ['returnDate'],
    }
  );
