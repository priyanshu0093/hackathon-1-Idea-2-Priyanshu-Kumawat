import { AIRPORTS } from './airport.data.js';
import { successResponse } from '../../utils/apiResponse.js';

export function getAirportsController(req, res) {
  const query = (req.query.q || '').trim().toLowerCase();

  if (!query) {
    return successResponse(res, AIRPORTS);
  }

  const filtered = AIRPORTS.filter(
    (airport) =>
      airport.code.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
  );

  return successResponse(res, filtered);
}
