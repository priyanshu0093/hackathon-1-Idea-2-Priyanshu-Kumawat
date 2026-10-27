import { bookingService } from './booking.service.js';

export async function listBookingsController(req, res, next) {
  try {
    const bookings = await bookingService.getBookings(req.user.id);
    res.status(200).json({
      success: true,
      data: bookings,
      meta: {
        count: bookings.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingController(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBooking(req.user.id, id);
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function createBookingController(req, res, next) {
  try {
    const booking = await bookingService.recordExternalBooking(req.user.id, req.validatedBody || req.body);
    res.status(201).json({
      success: true,
      data: booking,
      message: 'External booking record saved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBookingController(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await bookingService.deleteBooking(req.user.id, id);
    res.status(200).json({
      success: true,
      data: deleted,
      message: 'Booking record removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function redeemDemoPointsController(req, res, next) {
  try {
    const result = await bookingService.redeemDemoPoints(
      req.user.id,
      req.validatedBody || req.body
    );
    res.status(201).json({
      success: true,
      data: result,
      message: 'Demo points redeemed and flight booking simulated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function revalidateOfferController(req, res, next) {
  try {
    const offerId = req.params.offerId || req.body.offerId;
    const result = await bookingService.revalidateDuffelOffer(offerId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function bookDuffelFlightController(req, res, next) {
  try {
    const result = await bookingService.bookDuffelFlight(
      req.user.id,
      req.validatedBody || req.body
    );
    res.status(201).json({
      success: true,
      data: result,
      message: result.isConfirmed
        ? 'Flight booked successfully with airline'
        : 'Flight booking submitted and pending confirmation',
    });
  } catch (error) {
    next(error);
  }
}
