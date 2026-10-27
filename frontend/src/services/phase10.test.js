import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWallet, saveWalletBalance, removeWalletBalance } from './walletService';
import { calculateForecast, saveForecast } from './forecastService';
import { fetchExternalBookings, recordExternalBooking, removeExternalBooking } from './bookingService';
import { apiRequest } from './apiClient';

describe('Phase 10: Frontend Services (Wallet, Forecast, Bookings)', () => {
  let mockStorage = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage = {};
    global.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => { mockStorage[key] = String(val); },
      removeItem: (key) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Client Bearer Authentication & URL Resolution', () => {
    it('automatically attaches Authorization Bearer header when token exists', async () => {
      localStorage.setItem('a_una_milla_token', 'test-jwt-token-123');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { status: 'authorized' } }),
      });

      await apiRequest('/api/v1/auth/me');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token-123',
          }),
        })
      );
    });

    it('resolves full backend URL when API_CONFIG.baseUrl is configured', async () => {
      const { API_CONFIG } = await import('./apiConfig');
      const originalBaseUrl = API_CONFIG.baseUrl;
      API_CONFIG.baseUrl = 'https://hackathon-1-idea-2-priyanshu-kumawat.onrender.com';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: { id: 'usr_123' } } }),
      });

      await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hackathon-1-idea-2-priyanshu-kumawat.onrender.com/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
        })
      );

      API_CONFIG.baseUrl = originalBaseUrl;
    });

    it('does not duplicate /api/v1 when baseUrl already ends with /api/v1', async () => {
      const { API_CONFIG, buildApiUrl } = await import('./apiConfig');
      const originalBaseUrl = API_CONFIG.baseUrl;
      API_CONFIG.baseUrl = 'https://hackathon-1-idea-2-priyanshu-kumawat.onrender.com/api/v1';

      expect(buildApiUrl('/api/v1/auth/login')).toBe(
        'https://hackathon-1-idea-2-priyanshu-kumawat.onrender.com/api/v1/auth/login'
      );
      expect(buildApiUrl('/auth/login')).toBe(
        'https://hackathon-1-idea-2-priyanshu-kumawat.onrender.com/api/v1/auth/login'
      );
      expect(buildApiUrl('api/v1/auth/signup')).toBe(
        'https://hackathon-1-idea-2-priyanshu-kumawat.onrender.com/api/v1/auth/signup'
      );

      API_CONFIG.baseUrl = originalBaseUrl;
    });

    it('preserves local proxy path when baseUrl is empty', async () => {
      const { API_CONFIG, buildApiUrl } = await import('./apiConfig');
      const originalBaseUrl = API_CONFIG.baseUrl;
      API_CONFIG.baseUrl = '';

      expect(buildApiUrl('/api/v1/auth/login')).toBe('/api/v1/auth/login');
      expect(buildApiUrl('/auth/login')).toBe('/api/v1/auth/login');

      API_CONFIG.baseUrl = originalBaseUrl;
    });
  });

  describe('Points Wallet Service', () => {
    it('fetches user points wallet balances', async () => {
      const mockWallet = {
        balances: [{ id: '1', program: 'Iberia Plus', balance: 35000 }],
        summary: { totalPoints: 35000 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockWallet }),
      });

      const data = await fetchWallet();
      expect(data.summary.totalPoints).toBe(35000);
      expect(data.balances[0].program).toBe('Iberia Plus');
    });

    it('saves a manual points balance', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'bal_123', program: 'Air India', balance: 15000 },
        }),
      });

      const saved = await saveWalletBalance({ program: 'Air India', balance: 15000 });
      expect(saved.program).toBe('Air India');
      expect(saved.balance).toBe(15000);
    });
  });

  describe('30/60/90-Day Forecast Service', () => {
    it('requests points forecast calculation with explicit assumptions', async () => {
      const mockForecast = {
        forecasts: {
          conservative: { days30: 2000, days60: 4000, days90: 6000 },
          expected: { days30: 3000, days60: 6000, days90: 9000 },
          optimistic: { days30: 3750, days60: 7500, days90: 11250 },
        },
        disclaimers: ['Never borrow money solely to earn points'],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockForecast }),
      });

      const res = await calculateForecast({ monthlySpend: 2000, rewardProgram: 'Iberia Plus' });
      expect(res.forecasts.expected.days90).toBe(9000);
      expect(res.disclaimers.length).toBeGreaterThan(0);
    });
  });

  describe('External Bookings Service', () => {
    it('records an external flight reservation with non-verified disclosure', async () => {
      const mockBooking = {
        id: 'bkg_1',
        bookingReference: 'MAD910',
        airline: 'Iberia',
        isVerifiedConfirmation: false,
        sourceDisclosure: 'User-Reported External Booking',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockBooking }),
      });

      const res = await recordExternalBooking({
        bookingReference: 'MAD910',
        airline: 'Iberia',
        origin: 'MAD',
        destination: 'MIA',
        departureDate: '2026-11-20',
      });

      expect(res.bookingReference).toBe('MAD910');
      expect(res.isVerifiedConfirmation).toBe(false);
      expect(res.sourceDisclosure).toContain('User-Reported External Booking');
    });
  });
});
