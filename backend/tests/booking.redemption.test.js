import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { duffelClient } from '../src/providers/duffel/duffel.client.js';

describe('Rewards Redemption & Flight Booking Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let userACardId = '';
  let userABookingId = '';

  beforeAll(async () => {
    await connectDatabase();

    // Create User A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: `booking_user_a_${Date.now()}@example.es`,
        password: 'Password123!',
        name: 'Mateo Booking',
      });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Create User B
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: `booking_user_b_${Date.now()}@example.es`,
        password: 'Password123!',
        name: 'Lucia Booking',
      });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;

    // Add a card to User A's wallet (Iberia Icon)
    const cardRes = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        cardProductId: 'es_iberia_icon',
        nickname: 'Tarjeta Iberia Mateo',
        estimatedMonthlySpend: 2000,
      });
    userACardId = cardRes.body.data.id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // ==========================================
  // 1. Authentication & Authorization Protection
  // ==========================================
  describe('Authentication & Access Control', () => {
    it('rejects unauthenticated redemption with 401', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/redeem-points')
        .send({
          pointsRequired: 17000,
          program: 'Iberia Plus',
          airline: 'Iberia',
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          passengerName: 'Mateo Booking',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated Duffel flight booking with 401', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/duffel/book')
        .send({
          offerId: 'off_0000test',
          confirmed: true,
          passenger: {
            given_name: 'Mateo',
            family_name: 'Booking',
            born_on: '1990-01-01',
            email: 'mateo@example.com',
            phone_number: '+34612345678',
          },
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. Demo Rewards Redemption & Atomic Point Deduction
  // ==========================================
  describe('POST /api/v1/bookings/redeem-points — Demo Redemption', () => {
    it('successfully redeems demo points and deducts points atomically', async () => {
      // Check initial balance
      const cardsBefore = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);
      const initialBalance = cardsBefore.body.data.cards[0].demoBalance;
      expect(initialBalance).toBeGreaterThan(17000);

      // Redeem 17,000 points for MAD -> MIA
      const redeemRes = await request(app)
        .post('/api/v1/bookings/redeem-points')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          pointsRequired: 17000,
          program: 'Iberia Plus',
          airline: 'Iberia',
          flightNumber: 'IB6123',
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          cabin: 'business',
          taxesPaid: 65,
          cashSavedEstimate: 1850,
          passengerName: 'Mateo Booking',
        });

      expect(redeemRes.status).toBe(201);
      expect(redeemRes.body.success).toBe(true);
      expect(redeemRes.body.data.isSimulation).toBe(true);
      expect(redeemRes.body.data.pointsRedeemed).toBe(17000);
      expect(redeemRes.body.data.simulationDisclosure).toContain('SIMULATED DEMO REDEMPTION');

      const booking = redeemRes.body.data.booking;
      userABookingId = booking.id;
      expect(booking.id).toMatch(/^bkg_/);
      expect(booking.bookingReference).toMatch(/^SIM-/);
      expect(booking.status).toBe('confirmed');
      expect(booking.recordSource).toBe('simulated_reward_redemption');
      expect(booking.pointsRedeemed).toBe(17000);
      expect(Number(booking.taxesPaid)).toBe(65);

      // Verify points were deducted atomically in cards wallet
      const cardsAfter = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);
      const newBalance = cardsAfter.body.data.cards[0].demoBalance;
      expect(newBalance).toBe(initialBalance - 17000);
    });

    it('rejects redemption when user has insufficient demo points with 400', async () => {
      // User A attempts to redeem 999,999 points (far exceeding their balance)
      const res = await request(app)
        .post('/api/v1/bookings/redeem-points')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          pointsRequired: 999999,
          program: 'Iberia Plus',
          airline: 'Iberia',
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-12-15',
          passengerName: 'Mateo Booking',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_POINTS');
      expect(res.body.error.message).toContain('Insufficient demo points');
    });

    it('rejects duplicate redemption requests within 15 seconds with 409', async () => {
      // Attempt to submit identical redemption immediately
      const res = await request(app)
        .post('/api/v1/bookings/redeem-points')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          pointsRequired: 17000,
          program: 'Iberia Plus',
          airline: 'Iberia',
          flightNumber: 'IB6123',
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          passengerName: 'Mateo Booking',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_SUBMISSION');
    });
  });

  // ==========================================
  // 3. User Data Isolation on Bookings
  // ==========================================
  describe('Multi-User Booking Isolation', () => {
    it('ensures User B cannot see User A’s simulated redemption in bookings list', async () => {
      const resB = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      const bookingIds = resB.body.data.map((b) => b.id);
      expect(bookingIds).not.toContain(userABookingId);
    });

    it('ensures User B cannot fetch User A’s booking by ID with 404', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${userABookingId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('ensures User B cannot delete User A’s booking with 404', async () => {
      const res = await request(app)
        .delete(`/api/v1/bookings/${userABookingId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 4. Real Duffel Flight Booking Integration & Revalidation
  // ==========================================
  describe('Real Duffel Booking Integration', () => {
    it('requires explicit user confirmation before booking a Duffel flight', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/duffel/book')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          offerId: 'off_test_12345',
          confirmed: false, // Not confirmed!
          passenger: {
            given_name: 'Mateo',
            family_name: 'Booking',
            born_on: '1992-05-14',
            email: 'mateo@example.com',
            phone_number: '+34612345678',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('revalidates offer and creates verified Duffel order when confirmed', async () => {
      // Mock duffelClient getOffer and createOrder
      const mockOffer = {
        id: 'off_mock_success_001',
        total_amount: '385.50',
        total_currency: 'EUR',
        tax_amount: '45.00',
        base_amount: '340.50',
        passengers: [{ id: 'pas_001', type: 'adult' }],
        slices: [
          {
            origin: { iata_code: 'MAD' },
            destination: { iata_code: 'JFK' },
            segments: [
              {
                operating_carrier: { name: 'Iberia' },
                operating_carrier_flight_number: 'IB6251',
                departing_at: '2026-11-25T10:30:00Z',
                passengers: [{ cabin_class: 'economy' }],
              },
            ],
          },
        ],
      };

      const mockOrder = {
        id: 'ord_mock_123456789',
        booking_reference: 'IBE99Q',
        status: 'confirmed',
        total_amount: '385.50',
        total_currency: 'EUR',
      };

      const getOfferSpy = vi.spyOn(duffelClient, 'getOffer').mockResolvedValueOnce({ data: mockOffer });
      const createOrderSpy = vi.spyOn(duffelClient, 'createOrder').mockResolvedValueOnce({ data: mockOrder });

      const res = await request(app)
        .post('/api/v1/bookings/duffel/book')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          offerId: 'off_mock_success_001',
          confirmed: true,
          passenger: {
            title: 'mr',
            given_name: 'Mateo',
            family_name: 'Booking',
            born_on: '1992-05-14',
            email: 'mateo@example.com',
            phone_number: '+34612345678',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isConfirmed).toBe(true);
      expect(res.body.data.bookingReference).toBe('IBE99Q');
      expect(res.body.data.order.id).toBe('ord_mock_123456789');
      expect(res.body.data.booking.recordSource).toBe('duffel_cash_booking');
      expect(res.body.data.booking.pointsRedeemed).toBe(0); // Zero rewards deducted for cash booking

      getOfferSpy.mockRestore();
      createOrderSpy.mockRestore();
    });

    it('handles pending booking status honestly when provider confirmation is not final', async () => {
      const mockOffer = {
        id: 'off_mock_pending_002',
        total_amount: '290.00',
        total_currency: 'EUR',
        passengers: [{ id: 'pas_002', type: 'adult' }],
        slices: [
          {
            origin: { iata_code: 'MAD' },
            destination: { iata_code: 'LHR' },
            segments: [
              {
                operating_carrier: { name: 'British Airways' },
                operating_carrier_flight_number: 'BA456',
                departing_at: '2026-12-01T15:00:00Z',
              },
            ],
          },
        ],
      };

      const mockOrderPending = {
        id: 'ord_mock_pending_002',
        booking_reference: null, // No PNR yet
        status: 'pending',
        total_amount: '290.00',
        total_currency: 'EUR',
      };

      const getOfferSpy = vi.spyOn(duffelClient, 'getOffer').mockResolvedValueOnce({ data: mockOffer });
      const createOrderSpy = vi.spyOn(duffelClient, 'createOrder').mockResolvedValueOnce({ data: mockOrderPending });

      const res = await request(app)
        .post('/api/v1/bookings/duffel/book')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          offerId: 'off_mock_pending_002',
          confirmed: true,
          passenger: {
            title: 'mr',
            given_name: 'Mateo',
            family_name: 'Booking',
            born_on: '1992-05-14',
            email: 'mateo@example.com',
            phone_number: '+34612345678',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isConfirmed).toBe(false);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.bookingReference).toBe('PENDING');

      getOfferSpy.mockRestore();
      createOrderSpy.mockRestore();
    });

    it('honestly reports provider booking rejection and does not fabricate a booking reference', async () => {
      const mockOffer = {
        id: 'off_mock_fail_003',
        total_amount: '400.00',
        total_currency: 'EUR',
        passengers: [{ id: 'pas_003' }],
      };

      const getOfferSpy = vi.spyOn(duffelClient, 'getOffer').mockResolvedValueOnce({ data: mockOffer });
      const createOrderSpy = vi.spyOn(duffelClient, 'createOrder').mockRejectedValueOnce(
        new Error('Payment method balance has insufficient funds in test organization.')
      );

      const res = await request(app)
        .post('/api/v1/bookings/duffel/book')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          offerId: 'off_mock_fail_003',
          confirmed: true,
          passenger: {
            title: 'mr',
            given_name: 'Mateo',
            family_name: 'Booking',
            born_on: '1992-05-14',
            email: 'mateo@example.com',
            phone_number: '+34612345678',
          },
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('insufficient funds');

      getOfferSpy.mockRestore();
      createOrderSpy.mockRestore();
    });
  });

  // ==========================================
  // 5. Preservation of Flight Search
  // ==========================================
  describe('Preservation of Flight Search & Demo Mode', () => {
    it('preserves existing flight search endpoint functionality', async () => {
      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          cabin: 'business',
          mode: 'demo',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.offers)).toBe(true);
      expect(res.body.data.offers.length).toBeGreaterThan(0);
    });
  });
});
