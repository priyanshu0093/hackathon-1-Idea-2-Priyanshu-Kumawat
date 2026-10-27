import { Router } from 'express';
import {
  getCatalogController,
  getCardsController,
  getCardByIdController,
  addCardController,
  updateCardController,
  deleteCardController,
  getCardForecastController,
  syncCardsToWalletController,
} from './cards.controller.js';
import { addCardSchema, updateCardSchema } from './cards.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

// Public / general route for exploring supported cards catalog
router.get('/catalog', getCatalogController);

// Authenticated user card wallet routes
router.use(requireAuth);

router.get('/', getCardsController);
router.post('/', validateRequest(addCardSchema, 'body'), addCardController);
router.post('/sync-wallet', syncCardsToWalletController);
router.get('/forecast', getCardForecastController);
router.get('/:id', getCardByIdController);
router.put('/:id', validateRequest(updateCardSchema, 'body'), updateCardController);
router.delete('/:id', deleteCardController);

export default router;
