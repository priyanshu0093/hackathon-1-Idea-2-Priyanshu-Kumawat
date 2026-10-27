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
