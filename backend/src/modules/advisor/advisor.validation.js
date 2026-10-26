import { z } from 'zod';

const iataRegex = /^[A-Z]{3}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const advisorInputSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(iataRegex, 'Origin must be a 3-letter IATA airport code'),
    destination: z
      .string()
      .trim()
      .toUpperCase()
      .regex(iataRegex, 'Destination must be a 3-letter IATA airport code'),
    departureDate: z
      .string()
      .regex(dateRegex, 'Departure date must be in YYYY-MM-DD format'),
    returnDate: z
      .string()
      .regex(dateRegex, 'Return date must be in YYYY-MM-DD format')
      .nullable()
      .optional(),
    isFlexibleDates: z.boolean().default(false),
    travelers: z.coerce.number().int().min(1).max(9).default(1),
    cabin: z
      .enum(['economy', 'premium_economy', 'business', 'first'])
      .default('economy'),
    tripType: z.enum(['one_way', 'round_trip', 'multi_city']).default('round_trip'),
    
    // Flight offers / cash benchmark validation
    cashPrice: z.coerce.number().positive('Cash price must be positive').optional(),
    currency: z.string().default('EUR'),
    airline: z.string().max(100).optional(),
    dataSource: z.enum(['live', 'fixture', 'demo']).default('live'),

    // Optional list of available cash flight offers (capped to prevent payload abuse)
    offers: z
      .array(
        z.object({
          id: z.string().optional(),
          airline: z
            .union([
              z.string(),
              z.object({
                code: z.string().optional(),
                name: z.string().optional(),
              }),
            ])
            .optional(),
          price: z.object({
            total: z.coerce.number().positive(),
            currency: z.string().default('EUR'),
            base: z.coerce.number().optional(),
            taxesAndFees: z.coerce.number().optional(),
          }),
          durationFormatted: z.string().optional(),
          stops: z.coerce.number().int().min(0).max(5).optional(),
        })
      )
      .max(10, 'Cannot exceed 10 flight offers for analysis')
      .optional(),

    // User's points preferences
    pointsBalance: z.coerce.number().nonnegative().default(0),
    pointsProgram: z.string().max(50).default('none'),
    skipPoints: z.boolean().default(false),

    // Optional user interactive question
    question: z
      .string()
      .trim()
      .max(300, 'Question must not exceed 300 characters')
      .optional(),
  })
  .refine((data) => data.origin !== data.destination, {
    message: 'Origin and destination airports must be different',
    path: ['destination'],
  })
  .refine(
    (data) => {
      if (data.returnDate && data.departureDate) {
        return data.returnDate >= data.departureDate;
      }
      return true;
    },
    {
      message: 'Return date cannot precede departure date',
      path: ['returnDate'],
    }
  );
