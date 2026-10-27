import { tripsService } from './trips.service.js';

export async function listTrips(req, res, next) {
  try {
    const trips = await tripsService.getSavedTrips();
    res.status(200).json({
      data: trips,
      meta: {
        count: trips.length,
        persistence: 'supabase_postgresql',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrip(req, res, next) {
  try {
    const { id } = req.params;
    const trip = await tripsService.getTrip(id);
    res.status(200).json({
      data: trip,
      meta: {
        persistence: 'supabase_postgresql',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createTrip(req, res, next) {
  try {
    const savedTrip = await tripsService.saveTrip(req.validatedBody || req.body);
    res.status(201).json({
      data: savedTrip,
      meta: {
        persisted: true,
        persistence: 'supabase_postgresql',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await tripsService.removeTrip(id);
    res.status(200).json({
      message: 'Trip removed successfully from database',
      data: deleted,
      meta: {
        persisted: false,
        persistence: 'supabase_postgresql',
      },
    });
  } catch (error) {
    next(error);
  }
}
