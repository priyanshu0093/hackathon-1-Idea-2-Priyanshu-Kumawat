import { Router } from 'express';
import {
  getWalletController,
  saveBalanceController,
  deleteBalanceController,
} from './wallet.controller.js';
import { balanceSchema } from './wallet.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

// Protect all wallet endpoints with authentication
router.use(requireAuth);

router.get('/', getWalletController);
router.post('/', validateRequest(balanceSchema, 'body'), saveBalanceController);
router.delete('/:id', deleteBalanceController);

export default router;
