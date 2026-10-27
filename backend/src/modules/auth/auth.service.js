import crypto from 'crypto';
import { authRepository } from './auth.repository.js';
import { hashPassword, verifyPassword, generateToken } from './auth.utils.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class AuthService {
  async signup({ email, password, name }) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await authRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${crypto.randomUUID()}`;

    const user = await authRepository.createUser({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      name: name?.trim() || null,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    logger.info('New user registered successfully', { userId: user.id });

    return { user, token };
  }

  async login({ email, password }) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await authRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };

    const token = generateToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
    });

    logger.info('User authenticated successfully', { userId: safeUser.id });

    return { user: safeUser, token };
  }

  async getProfile(userId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404, 'NOT_FOUND');
    }

    return user;
  }
}

export const authService = new AuthService();
