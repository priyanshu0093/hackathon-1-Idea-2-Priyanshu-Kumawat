import crypto from 'crypto';
import { bookingRepository } from './booking.repository.js';
import { cardsRepository } from '../cards/cards.repository.js';
import { cardsService } from '../cards/cards.service.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { duffelClient } from '../../providers/duffel/duffel.client.js';
import { isDbConnected } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class BookingService {
  async getBookings(userId) {
    const records = await bookingRepository.findByUserId(userId);
    return records.map((record) => {
      let sourceDisclosure = 'User-Reported External Booking (not issued or verified directly by A Una Milla)';
      let isSimulation = false;

      if (record.recordSource === 'duffel_cash_booking') {
        sourceDisclosure = 'Duffel Live GDS Cash Booking';
        isSimulation = false;
      } else if (record.recordSource === 'simulated_reward_redemption') {
        sourceDisclosure = 'SIMULATED DEMO REDEMPTION — Demo points deducted within A Una Milla. Not sent to airline or Duffel.';
        isSimulation = true;
      }

      return {
        ...record,
        sourceDisclosure,
        isSimulation,
      };
    });
  }

  async getBooking(userId, bookingId) {
    const record = await bookingRepository.findByIdAndUser(bookingId, userId);
    if (!record) {
      throw new AppError(`Booking record '${bookingId}' not found.`, 404, 'NOT_FOUND');
    }

    let sourceDisclosure = 'User-Reported External Booking (not issued or verified directly by A Una Milla)';
    let isSimulation = false;

    if (record.recordSource === 'duffel_cash_booking') {
      sourceDisclosure = 'Duffel Live GDS Cash Booking';
      isSimulation = false;
    } else if (record.recordSource === 'simulated_reward_redemption') {
      sourceDisclosure = 'SIMULATED DEMO REDEMPTION — Demo points deducted within A Una Milla. Not sent to airline or Duffel.';
      isSimulation = true;
    }

    return {
      ...record,
      sourceDisclosure,
      isSimulation,
    };
  }

  async recordExternalBooking(userId, data) {
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
      isVerifiedConfirmation: false,
      recordSource: 'user_entered_external',
      providerOrderId: null,
      totalAmount: data.taxesPaid ? String(data.taxesPaid) : '0',
      currency: 'EUR',
      passengerName: null,
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
      isSimulation: false,
    };
  }

  /**
   * Redeem demo points atomically within app simulation
   */
  async redeemDemoPoints(userId, data) {
    const pointsRequired = Number(data.pointsRequired);
    if (!pointsRequired || pointsRequired <= 0) {
      throw new AppError('Points required must be greater than zero.', 400, 'INVALID_POINTS_AMOUNT');
    }

    // 1. Prevent duplicate submissions within 15 seconds
    const existingBookings = await bookingRepository.findByUserId(userId);
    const fifteenSecondsAgo = Date.now() - 15000;
    const isDuplicate = existingBookings.some((b) => {
      const createdAtMs = new Date(b.createdAt).getTime();
      return (
        createdAtMs > fifteenSecondsAgo &&
        b.origin === data.origin.toUpperCase() &&
        b.destination === data.destination.toUpperCase() &&
        b.departureDate === data.departureDate &&
        b.pointsRedeemed === pointsRequired
      );
    });

    if (isDuplicate) {
      throw new AppError(
        'Duplicate redemption request detected. Please wait before submitting again.',
        409,
        'DUPLICATE_SUBMISSION'
      );
    }

    // 2. Check points balance across user cards or loyalty balances
    const userCardsList = await cardsRepository.findByUserId(userId);
    const matchingCards = userCardsList.filter(
      (c) => c.rewardsProgram.toLowerCase() === data.program.toLowerCase()
    );

    let remainingBalance = 0;

    if (matchingCards.length > 0) {
      const totalAvailable = matchingCards.reduce(
        (sum, c) => sum + (Number(c.demoBalance) || 0),
        0
      );

      if (totalAvailable < pointsRequired) {
        throw new AppError(
          `Insufficient demo points balance. You have ${totalAvailable.toLocaleString()} points in ${data.program}, but this flight redemption requires ${pointsRequired.toLocaleString()} points.`,
          400,
          'INSUFFICIENT_POINTS'
        );
      }

      // Atomically deduct points from cards
      let toDeduct = pointsRequired;
      for (const card of matchingCards) {
        if (toDeduct <= 0) break;
        const available = Number(card.demoBalance) || 0;
        if (available > 0) {
          const deduction = Math.min(available, toDeduct);
          const newBal = available - deduction;
          await cardsRepository.update(card.id, userId, { demoBalance: newBal });
          toDeduct -= deduction;
        }
      }

      // Auto-sync updated card points to wallet
      await cardsService.syncCardsToWallet(userId).catch(() => {});
      remainingBalance = totalAvailable - pointsRequired;
    } else {
      // Check manually entered loyalty balance in Points Wallet
      const balanceRecord = await walletRepository.findByProgramAndUser(data.program, userId);
      const availableWallet = balanceRecord ? Number(balanceRecord.balance) || 0 : 0;

      if (availableWallet < pointsRequired) {
        throw new AppError(
          `Insufficient demo points balance. You have ${availableWallet.toLocaleString()} points in ${data.program}, but this flight redemption requires ${pointsRequired.toLocaleString()} points.`,
          400,
          'INSUFFICIENT_POINTS'
        );
      }

      const newWalletBal = availableWallet - pointsRequired;
      await walletRepository.upsert({
        ...balanceRecord,
        balance: newWalletBal,
      });
      remainingBalance = newWalletBal;
    }

    // 3. Create simulated redemption booking record
    const bookingId = `bkg_${crypto.randomUUID()}`;
    const simReference = `SIM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const bookingPayload = {
      id: bookingId,
      userId,
      bookingReference: simReference,
      airline: data.airline.trim(),
      flightNumber: data.flightNumber ? data.flightNumber.toUpperCase() : null,
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      departureDate: data.departureDate,
      returnDate: data.returnDate || null,
      cabin: data.cabin || 'economy',
      pointsRedeemed: pointsRequired,
      taxesPaid: data.taxesPaid ? String(data.taxesPaid) : '0',
      cashSavedEstimate: data.cashSavedEstimate ? String(data.cashSavedEstimate) : '0',
      status: 'confirmed',
      isVerifiedConfirmation: false,
      recordSource: 'simulated_reward_redemption',
      providerOrderId: null,
      totalAmount: data.taxesPaid ? String(data.taxesPaid) : '0',
      currency: data.currency || 'EUR',
      passengerName: data.passengerName ? data.passengerName.trim() : 'Cardholder',
      notes: 'SIMULATED DEMO REDEMPTION — Demo points deducted within A Una Milla. Not sent to airline or Duffel.',
      updatedAt: new Date(),
    };

    logger.info('Simulated rewards redemption created', {
      userId,
      bookingId,
      bookingReference: simReference,
      pointsRedeemed: pointsRequired,
      remainingBalance,
    });

    const saved = await bookingRepository.create(bookingPayload);

    return {
      booking: {
        ...saved,
        sourceDisclosure: 'SIMULATED DEMO REDEMPTION — Demo points deducted within A Una Milla. Not sent to airline or Duffel.',
        isSimulation: true,
      },
      pointsRedeemed: pointsRequired,
      remainingBalance,
      isSimulation: true,
      simulationDisclosure:
        'SIMULATED DEMO REDEMPTION — Demo points deducted within A Una Milla. This is not an actual airline ticket or Duffel order.',
    };
  }

  /**
   * Revalidates a Duffel offer before booking
   */
  async revalidateDuffelOffer(offerId) {
    try {
      const res = await duffelClient.getOffer(offerId);
      return {
        offer: res.data,
        isExpired: false,
        price: {
          total: Number(res.data.total_amount),
          currency: res.data.total_currency,
          tax: Number(res.data.tax_amount || 0),
          base: Number(res.data.base_amount || 0),
        },
      };
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('Expired')) {
        return {
          offer: null,
          isExpired: true,
          message: 'The selected flight offer has expired. Please refresh flight results.',
        };
      }
      throw err;
    }
  }

  /**
   * Books a real flight via Duffel API with explicit confirmation
   */
  async bookDuffelFlight(userId, payload) {
    if (payload.confirmed !== true) {
      throw new AppError(
        'Explicit user confirmation is required before submitting a flight order to Duffel.',
        400,
        'CONFIRMATION_REQUIRED'
      );
    }

    if (!payload.passenger || !payload.passenger.given_name || !payload.passenger.family_name) {
      throw new AppError('Complete passenger details are required.', 400, 'INVALID_PASSENGER');
    }

    // Prevent duplicate orders
    const existingBookings = await bookingRepository.findByUserId(userId);
    const thirtySecondsAgo = Date.now() - 30000;
    const isDuplicate = existingBookings.some((b) => {
      const createdAtMs = new Date(b.createdAt).getTime();
      return (
        createdAtMs > thirtySecondsAgo &&
        b.notes?.includes(payload.offerId)
      );
    });

    if (isDuplicate) {
      throw new AppError(
        'Duplicate flight booking in progress. Please check your dashboard bookings.',
        409,
        'DUPLICATE_SUBMISSION'
      );
    }

    // Revalidate offer with Duffel
    const revalRes = await this.revalidateDuffelOffer(payload.offerId);
    if (revalRes.isExpired || !revalRes.offer) {
      throw new AppError(
        'The selected flight offer has expired on Duffel. Please refresh your search to see available offers.',
        400,
        'OFFER_EXPIRED'
      );
    }

    const offer = revalRes.offer;
    const passengerId = offer.passengers?.[0]?.id || 'pas_0';

    // Submit order to Duffel API
    let duffelOrderRes;
    try {
      duffelOrderRes = await duffelClient.createOrder({
        selectedOffers: [payload.offerId],
        passengers: [
          {
            id: passengerId,
            title: payload.passenger.title || 'mr',
            gender: payload.passenger.gender || (payload.passenger.title === 'mr' ? 'm' : 'f'),
            given_name: payload.passenger.given_name.trim(),
            family_name: payload.passenger.family_name.trim(),
            born_on: payload.passenger.born_on,
            email: payload.passenger.email.trim(),
            phone_number: payload.passenger.phone_number.trim(),
          },
        ],
        payments: [
          {
            type: 'balance',
            currency: offer.total_currency,
            amount: offer.total_amount,
          },
        ],
        type: 'instant',
      });
    } catch (err) {
      logger.error('Duffel flight order placement failed', {
        error: err.message,
        userId,
        offerId: payload.offerId,
      });
      throw new AppError(
        err.message || 'Duffel order placement failed. Please verify passenger details and try again.',
        err.statusCode || 502,
        err.providerCode || 'DUFFEL_BOOKING_ERROR'
      );
    }

    const order = duffelOrderRes.data;
    const isConfirmed = Boolean(order.booking_reference);
    const status = isConfirmed ? 'confirmed' : (order.status || 'pending');

    const bookingRecord = {
      id: `bkg_${crypto.randomUUID()}`,
      userId,
      bookingReference: order.booking_reference || 'PENDING',
      airline: offer.slices?.[0]?.segments?.[0]?.operating_carrier?.name || 'Airline',
      flightNumber: offer.slices?.[0]?.segments?.[0]?.operating_carrier_flight_number || null,
      origin: offer.slices?.[0]?.origin?.iata_code || 'MAD',
      destination: offer.slices?.[0]?.destination?.iata_code || 'JFK',
      departureDate:
        offer.slices?.[0]?.segments?.[0]?.departing_at?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      returnDate: offer.slices?.[1]?.segments?.[0]?.departing_at
        ? offer.slices[1].segments[0].departing_at.split('T')[0]
        : null,
      cabin: offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabin_class || 'economy',
      pointsRedeemed: 0, // Real cash booking: rewards points are not used
      taxesPaid: String(offer.tax_amount || 0),
      cashSavedEstimate: '0',
      status,
      isVerifiedConfirmation: isConfirmed,
      recordSource: 'duffel_cash_booking',
      providerOrderId: order.id,
      totalAmount: String(order.total_amount),
      currency: offer.total_currency || 'EUR',
      passengerName: `${payload.passenger.given_name.trim()} ${payload.passenger.family_name.trim()}`,
      notes: `Live Duffel GDS order (ID: ${order.id})`,
      updatedAt: new Date(),
    };

    const saved = await bookingRepository.create(bookingRecord);

    logger.info('Live Duffel flight booking processed', {
      userId,
      bookingId: saved.id,
      orderId: order.id,
      bookingReference: saved.bookingReference,
      status: saved.status,
    });

    return {
      booking: {
        ...saved,
        sourceDisclosure: 'Duffel Live GDS Cash Booking',
        isSimulation: false,
      },
      order,
      status: saved.status,
      isConfirmed,
      bookingReference: saved.bookingReference,
      isSimulation: false,
    };
  }

  async deleteBooking(userId, bookingId) {
    const deleted = await bookingRepository.delete(bookingId, userId);
    if (!deleted) {
      throw new AppError(`Booking record '${bookingId}' not found.`, 404, 'NOT_FOUND');
    }

    logger.info('Removed booking record', { userId, bookingId });
    return deleted;
  }
}

export const bookingService = new BookingService();
