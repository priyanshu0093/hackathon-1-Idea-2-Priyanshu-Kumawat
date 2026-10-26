// Curated airport database for fast, realistic travel-hacking autocomplete & selection
export const AIRPORTS = [
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', flag: '🇪🇸' },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', flag: '🇪🇸' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', flag: '🇺🇸' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States', flag: '🇺🇸' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', flag: '🇫🇷' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪' },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'Italy', flag: '🇮🇹' },
  { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
  { code: 'EZE', name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽' },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪' },
];

export const POPULAR_ROUTES = [
  { origin: 'MAD', destination: 'JFK', label: 'Madrid to New York' },
  { origin: 'BCN', destination: 'MIA', label: 'Barcelona to Miami' },
  { origin: 'MAD', destination: 'EZE', label: 'Madrid to Buenos Aires' },
  { origin: 'CDG', destination: 'NRT', label: 'Paris to Tokyo' },
  { origin: 'LHR', destination: 'LAX', label: 'London to Los Angeles' },
];
