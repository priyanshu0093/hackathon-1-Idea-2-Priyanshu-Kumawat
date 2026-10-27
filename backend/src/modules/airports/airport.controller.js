import { AIRPORTS } from './airport.data.js';
import { successResponse } from '../../utils/apiResponse.js';

/**
 * Searches and ranks airports based on query
 * Supports case-insensitive matching across IATA code, city, airport name, and country
 */
export function getAirportsController(req, res) {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : '';
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return successResponse(res, AIRPORTS);
  }

  const scored = [];

  for (const airport of AIRPORTS) {
    const code = airport.code.toLowerCase();
    const city = airport.city.toLowerCase();
    const name = airport.name.toLowerCase();
    const country = airport.country.toLowerCase();

    let score = 0;

    if (code === query) {
      score = 100; // Exact IATA match (e.g. "bom", "del")
    } else if (city === query) {
      score = 90; // Exact city match (e.g. "mumbai", "delhi")
    } else if (code.startsWith(query)) {
      score = 80; // IATA prefix match
    } else if (city.startsWith(query)) {
      score = 70; // City prefix match
    } else if (name.startsWith(query)) {
      score = 60; // Airport name prefix match
    } else if (country.startsWith(query)) {
      score = 50; // Country prefix match
    } else if (code.includes(query)) {
      score = 40; // IATA substring
    } else if (city.includes(query)) {
      score = 30; // City substring
    } else if (name.includes(query)) {
      score = 20; // Airport name substring
    } else if (country.includes(query)) {
      score = 10; // Country substring
    }

    if (score > 0) {
      scored.push({ airport, score });
    }
  }

  // Sort by relevance score descending, then alphabetically by city
  scored.sort((a, b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city));

  const results = scored.map((item) => item.airport);
  return successResponse(res, results);
}
