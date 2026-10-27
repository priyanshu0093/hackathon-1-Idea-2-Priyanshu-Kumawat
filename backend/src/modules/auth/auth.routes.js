import { Router } from 'express';
import {
  signupController,
  loginController,
  getMeController,
  logoutController,
} from './auth.controller.js';
import { signupSchema, loginSchema } from './auth.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();

router.post('/signup', validateRequest(signupSchema, 'body'), signupController);
router.post('/login', validateRequest(loginSchema, 'body'), loginController);
router.get('/me', requireAuth, getMeController);
router.post('/logout', logoutController);

export default router;
