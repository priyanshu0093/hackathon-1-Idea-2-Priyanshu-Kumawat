import crypto from 'crypto';
import { tripsRepository } from './trips.repository.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class TripsService {
  /**
   * List saved trips, scoped to authenticated user if provided
   */
  async getSavedTrips(userId = null) {
    if (!isDbConnected()) {
      throw new AppError(
        'PostgreSQL database persistence is currently unavailable.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }
    return await tripsRepository.findAll(userId);
  }

  /**
   * Get single saved trip by ID with ownership verification
   */
  async getTrip(id, userId = null) {
    if (!isDbConnected()) {
      throw new AppError(
        'PostgreSQL database persistence is currently unavailable.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }
    const trip = await tripsRepository.findById(id);
    if (!trip) {
      throw new AppError(`Trip with ID '${id}' not found`, 404, 'NOT_FOUND');
    }

    // Protect private records
    if (trip.userId && userId && trip.userId !== userId) {
      throw new AppError('Access denied. You do not own this trip.', 403, 'FORBIDDEN');
    }

    return trip;
  }

  /**
   * Save a trip to PostgreSQL with user ownership association
   */
  async saveTrip(tripData, userId = null) {
    if (!isDbConnected()) {
      throw new AppError(
        'PostgreSQL database persistence is currently unavailable.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const id = tripData.id || `trip_${crypto.randomUUID()}`;
    const payload = {
      ...tripData,
      id,
      userId: userId || tripData.userId || null,
    };

    logger.info('Saving trip to Supabase PostgreSQL', {
      tripId: id,
      userId: payload.userId,
      route: `${payload.origin}->${payload.destination}`,
      cabin: payload.cabin,
    });

    return await tripsRepository.upsert(payload);
  }

  /**
   * Remove a saved trip by ID with ownership verification
   */
  async removeTrip(id, userId = null) {
    if (!isDbConnected()) {
      throw new AppError(
        'PostgreSQL database persistence is currently unavailable.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const trip = await tripsRepository.findById(id);
    if (!trip) {
      throw new AppError(`Trip with ID '${id}' not found`, 404, 'NOT_FOUND');
    }

    if (trip.userId && userId && trip.userId !== userId) {
      throw new AppError('Access denied. You cannot delete a trip owned by another user.', 403, 'FORBIDDEN');
    }

    const removed = await tripsRepository.deleteById(id);
    logger.info('Removed trip from Supabase PostgreSQL', { tripId: id, userId });
    return removed;
  }
}

export const tripsService = new TripsService();
