import { flightService } from './flight.service.js';
import { awardProviderAdapter } from '../../providers/award/awardProvider.adapter.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export async function searchFlightsController(req, res, next) {
  try {
    const results = await flightService.searchFlights(req.body);

    if (!results || results.offers.length === 0) {
      return successResponse(res, {
        offers: [],
        total: 0,
        awardInventory: results?.awardInventory || null,
        message: 'No flight offers found for the specified route and dates.',
      }, results?.meta || {}, 200);
    }

    return successResponse(res, results, results.meta || {}, 200);
  } catch (err) {
    if (err.statusCode || err.code) {
      return errorResponse(res, err.message, err.statusCode || 500, null, err.code || 'INTERNAL_ERROR');
    }
    if (err.message?.includes('not configured')) {
      return errorResponse(res, err.message, 503, null, 'PROVIDER_UNCONFIGURED');
    }
    next(err);
  }
}

export async function getAwardAvailabilityController(req, res, next) {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const awardResult = await awardProviderAdapter.searchAwardAvailability(params);
    return successResponse(res, awardResult, awardResult.meta || {}, 200);
  } catch (err) {
    next(err);
  }
}
