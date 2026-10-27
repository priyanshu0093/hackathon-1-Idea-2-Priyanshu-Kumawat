import crypto from 'crypto';
import { bookingRepository } from './booking.repository.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class BookingService {
  async getBookings(userId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const records = await bookingRepository.findByUserId(userId);
    return records.map((record) => ({
      ...record,
      sourceDisclosure: 'User-Reported External Booking (not issued or verified directly by A Una Milla)',
    }));
  }

  async getBooking(userId, bookingId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const record = await bookingRepository.findByIdAndUser(bookingId, userId);
    if (!record) {
      throw new AppError(`Booking record '${bookingId}' not found.`, 404, 'NOT_FOUND');
    }

    return {
      ...record,
      sourceDisclosure: 'User-Reported External Booking (not issued or verified directly by A Una Milla)',
    };
  }

  async recordExternalBooking(userId, data) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const bookingId = `bkg_${crypto.randomUUID()}`;
    const payload = {
      id: bookingId,
      userId,
      bookingReference: data.bookingReference.toUpperCase(),
      airline: data.airline.trim(),
      flightNumber: data.flightNumber ? data.flightNumber.toUpperCase() : null,
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      departureDate: data.departureDate,
      returnDate: data.returnDate || null,
      cabin: data.cabin || 'economy',
      pointsRedeemed: data.pointsRedeemed ? Number(data.pointsRedeemed) : 0,
      taxesPaid: data.taxesPaid ? String(data.taxesPaid) : '0',
      cashSavedEstimate: data.cashSavedEstimate ? String(data.cashSavedEstimate) : '0',
      status: data.status || 'confirmed',
      isVerifiedConfirmation: false, // Explicit: user-entered records are never labeled as live verified GDS confirmations
      recordSource: 'user_entered_external',
      notes: data.notes || null,
      updatedAt: new Date(),
    };

    logger.info('Saved external booking record', {
      userId,
      bookingId,
      bookingReference: payload.bookingReference,
      route: `${payload.origin}->${payload.destination}`,
    });

    const saved = await bookingRepository.create(payload);
    return {
      ...saved,
      sourceDisclosure: 'User-Reported External Booking (not issued or verified directly by A Una Milla)',
    };
  }

  async deleteBooking(userId, bookingId) {
    if (!isDbConnected()) {
      throw new AppError('Database service is currently unavailable.', 503, 'DATABASE_UNAVAILABLE');
    }

    const deleted = await bookingRepository.delete(bookingId, userId);
    if (!deleted) {
      throw new AppError(`Booking record '${bookingId}' not found.`, 404, 'NOT_FOUND');
    }

    logger.info('Removed external booking record', { userId, bookingId });
    return deleted;
  }
}

export const bookingService = new BookingService();
