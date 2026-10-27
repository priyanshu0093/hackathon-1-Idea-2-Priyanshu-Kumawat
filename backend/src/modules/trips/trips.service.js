import crypto from 'crypto';
import { tripsRepository } from './trips.repository.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class TripsService {
  /**
   * List all saved trips from PostgreSQL database
   */
  async getSavedTrips() {
    if (!isDbConnected()) {
      throw new AppError(
        'PostgreSQL database persistence is currently unavailable.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }
    return await tripsRepository.findAll();
  }

  /**
   * Get single saved trip by ID
   */
  async getTrip(id) {
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
    return trip;
  }

  /**
   * Save a trip to PostgreSQL
   */
  async saveTrip(tripData) {
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
    };

    logger.info('Saving trip to Supabase PostgreSQL', {
      tripId: id,
      route: `${payload.origin}->${payload.destination}`,
      cabin: payload.cabin,
    });

    return await tripsRepository.upsert(payload);
  }

  /**
   * Remove a saved trip by ID
   */
  async removeTrip(id) {
    if (!isDbConnected()) {
      throw new AppError(
        'PostgreSQL database persistence is currently unavailable.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const removed = await tripsRepository.deleteById(id);
    if (!removed) {
      throw new AppError(`Trip with ID '${id}' not found`, 404, 'NOT_FOUND');
    }

    logger.info('Removed trip from Supabase PostgreSQL', { tripId: id });
    return removed;
  }
}

export const tripsService = new TripsService();
