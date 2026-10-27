import { Router } from 'express';
import {
  listBookingsController,
  getBookingController,
  createBookingController,
  deleteBookingController,
} from './booking.controller.js';
import { createBookingSchema } from './booking.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

// Protect all booking endpoints with authentication
router.use(requireAuth);

router.get('/', listBookingsController);
router.post('/', validateRequest(createBookingSchema, 'body'), createBookingController);
router.get('/:id', getBookingController);
router.delete('/:id', deleteBookingController);

export default router;
