/**
 * Verified Airport Database for A Una Milla
 * Contains major international gateway hubs with IATA codes, cities, names, countries, and flags
 */

export const AIRPORTS = [
  // India (Requested Gateways)
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport', country: 'India', region: 'Asia', flag: '🇮🇳' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India', region: 'Asia', flag: '🇮🇳' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India', region: 'Asia', flag: '🇮🇳' },
  
  // Europe
  { code: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid-Barajas', country: 'Spain', region: 'Europe', flag: '🇪🇸' },
  { code: 'BCN', city: 'Barcelona', name: 'Josep Tarradellas Barcelona-El Prat', country: 'Spain', region: 'Europe', flag: '🇪🇸' },
  { code: 'LIS', city: 'Lisbon', name: 'Humberto Delgado Airport', country: 'Portugal', region: 'Europe', flag: '🇵🇹' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'United Kingdom', region: 'Europe', flag: '🇬🇧' },
  { code: 'LGW', city: 'London', name: 'Gatwick Airport', country: 'United Kingdom', region: 'Europe', flag: '🇬🇧' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France', region: 'Europe', flag: '🇫🇷' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany', region: 'Europe', flag: '🇩🇪' },
  { code: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', country: 'Netherlands', region: 'Europe', flag: '🇳🇱' },
  { code: 'FCO', city: 'Rome', name: 'Leonardo da Vinci-Fiumicino', country: 'Italy', region: 'Europe', flag: '🇮🇹' },
  { code: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland', region: 'Europe', flag: '🇨🇭' },

  // North America
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', country: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'EWR', city: 'Newark', name: 'Newark Liberty International', country: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'MIA', city: 'Miami', name: 'Miami International', country: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International Airport", country: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International', country: 'Canada', region: 'North America', flag: '🇨🇦' },

  // Latin America
  { code: 'BOG', city: 'Bogota', name: 'El Dorado International', country: 'Colombia', region: 'South America', flag: '🇨🇴' },
  { code: 'EZE', city: 'Buenos Aires', name: 'Ministro Pistarini Ezeiza', country: 'Argentina', region: 'South America', flag: '🇦🇷' },
  { code: 'MEX', city: 'Mexico City', name: 'Benito Juárez International', country: 'Mexico', region: 'North America', flag: '🇲🇽' },
  { code: 'GRU', city: 'Sao Paulo', name: 'Sao Paulo/Guarulhos International', country: 'Brazil', region: 'South America', flag: '🇧🇷' },
  { code: 'SCL', city: 'Santiago', name: 'Arturo Merino Benítez', country: 'Chile', region: 'South America', flag: '🇨🇱' },
  { code: 'LIM', city: 'Lima', name: 'Jorge Chávez International', country: 'Peru', region: 'South America', flag: '🇵🇪' },

  // Middle East & Asia Pacific
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪' },
  { code: 'DOH', city: 'Doha', name: 'Hamad International', country: 'Qatar', region: 'Middle East', flag: '🇶🇦' },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi', country: 'Singapore', region: 'Asia', flag: '🇸🇬' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand', region: 'Asia', flag: '🇹🇭' },
  { code: 'HND', city: 'Tokyo', name: 'Haneda Airport', country: 'Japan', region: 'Asia', flag: '🇯🇵' },
  { code: 'NRT', city: 'Tokyo', name: 'Narita International', country: 'Japan', region: 'Asia', flag: '🇯🇵' },
  { code: 'ICN', city: 'Seoul', name: 'Incheon International', country: 'South Korea', region: 'Asia', flag: '🇰🇷' },
  { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong International', country: 'Hong Kong', region: 'Asia', flag: '🇭🇰' },
  { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia', region: 'Oceania', flag: '🇦🇺' },
];
