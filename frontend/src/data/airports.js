// Curated airport database for fast, realistic travel-hacking autocomplete & selection
export const AIRPORTS = [
  // India
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India', flag: '🇮🇳' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', flag: '🇮🇳' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', flag: '🇮🇳' },

  // Europe
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', flag: '🇪🇸' },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', flag: '🇪🇸' },
  { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', flag: '🇫🇷' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪' },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'Italy', flag: '🇮🇹' },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭' },

  // North America
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', flag: '🇺🇸' },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'United States', flag: '🇺🇸' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States', flag: '🇺🇸' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', flag: '🇺🇸' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', flag: '🇺🇸' },
  { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', flag: '🇨🇦' },

  // Latin America
  { code: 'EZE', name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽' },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴' },
  { code: 'GRU', name: 'Sao Paulo/Guarulhos International', city: 'Sao Paulo', country: 'Brazil', flag: '🇧🇷' },
  { code: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile', flag: '🇨🇱' },
  { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', flag: '🇵🇪' },

  // Middle East & Asia
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', flag: '🇶🇦' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭' },
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', flag: '🇰🇷' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
];

export const POPULAR_ROUTES = [
  { origin: 'MAD', destination: 'JFK', label: 'Madrid to New York' },
  { origin: 'BCN', destination: 'MIA', label: 'Barcelona to Miami' },
  { origin: 'DEL', destination: 'LHR', label: 'Delhi to London' },
  { origin: 'BOM', destination: 'DXB', label: 'Mumbai to Dubai' },
  { origin: 'MAD', destination: 'EZE', label: 'Madrid to Buenos Aires' },
  { origin: 'CDG', destination: 'NRT', label: 'Paris to Tokyo' },
  { origin: 'LHR', destination: 'LAX', label: 'London to Los Angeles' },
];
