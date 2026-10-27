import { Router } from 'express';
import {
  listBookingsController,
  getBookingController,
  createBookingController,
  deleteBookingController,
  redeemDemoPointsController,
  revalidateOfferController,
  bookDuffelFlightController,
} from './booking.controller.js';
import {
  createBookingSchema,
  redeemDemoPointsSchema,
  bookDuffelFlightSchema,
} from './booking.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

// Protect all booking endpoints with authentication
router.use(requireAuth);

router.get('/', listBookingsController);
router.post('/', validateRequest(createBookingSchema, 'body'), createBookingController);
router.post('/redeem-points', validateRequest(redeemDemoPointsSchema, 'body'), redeemDemoPointsController);
router.get('/duffel/offers/:offerId', revalidateOfferController);
router.post('/duffel/book', validateRequest(bookDuffelFlightSchema, 'body'), bookDuffelFlightController);
router.get('/:id', getBookingController);
router.delete('/:id', deleteBookingController);

export default router;
