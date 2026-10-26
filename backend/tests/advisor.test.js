import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAdvisorAdvice } from '../src/modules/advisor/advisor.engine.js';

describe('AI Travel Hacking Advisor - Backend Module', () => {
  describe('Deterministic Advisor Engine Unit Tests', () => {
    it('generates honest travel advice for MAD -> JFK route with clear separation of facts, estimates, and assumptions', () => {
      const result = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        returnDate: '2026-11-25',
        travelers: 1,
        cabin: 'economy',
        tripType: 'round_trip',
        cashPrice: 650,
        currency: 'EUR',
        airline: 'Iberia',
        dataSource: 'live',
      });

      expect(result.advisorMode).toBe('rule_based_engine');
      expect(result.tripContext.origin).toBe('MAD');
      expect(result.tripContext.destination).toBe('JFK');
      expect(result.recommendation.program).toBe('Iberia Plus (Avios)');

      // Verified facts check
      expect(result.facts.some((f) => f.includes('Verified cash fare: €650'))).toBe(true);
      expect(result.facts.some((f) => f.includes('MAD → JFK'))).toBe(true);

      // Estimates check
      expect(result.estimates.some((e) => e.includes('Estimated award requirement'))).toBe(true);
      expect(result.estimates.some((e) => e.includes('Estimated unavoidable taxes'))).toBe(true);

      // Assumptions check (Rule 4: never invent confirmed award availability)
      expect(result.assumptions.some((a) => a.includes('Live award seat inventory is currently unsupported via GDS'))).toBe(true);

      // Next action check (Rule 5: No fake booking URLs)
      expect(result.nextAction.requiresManualVerification).toBe(true);
      expect(result.nextAction.title).toContain('Verify Saver Award Space');

      // Transfer partners included
      expect(result.transferPartners.length).toBeGreaterThan(0);
      expect(result.transferPartners.some((p) => p.bank.includes('American Express'))).toBe(true);
    });

    it('identifies alternative airports when applicable (e.g. BCN for MAD, EWR for JFK)', () => {
      const result = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 500,
      });

      expect(result.alternateAirports.length).toBeGreaterThan(0);
      const airportCodes = result.alternateAirports.map((a) => a.code);
      expect(airportCodes).toContain('BCN');
      expect(airportCodes).toContain('EWR');
    });

    it('answers user questions regarding points transfers with financial honesty', () => {
      const result = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 650,
        question: 'How do I transfer points from credit cards?',
      });

      expect(result.questionAnswer).toBeDefined();
      expect(result.questionAnswer.topic).toBe('Points Transfer Strategy');
      expect(result.questionAnswer.answer).toContain('NEVER transfer points speculatively');
    });

    it('answers user questions regarding taxes and fuel surcharges', () => {
      const result = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 650,
        question: 'Are taxes and fuel surcharges lower from Madrid?',
      });

      expect(result.questionAnswer).toBeDefined();
      expect(result.questionAnswer.topic).toBe('Taxes & Surcharges Breakdown');
      expect(result.questionAnswer.answer).toContain('taxes');
    });

    it('evaluates cash vs points valuation (cent-per-point CPP calculation)', () => {
      const result = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 1200,
        question: 'Is it better to pay cash or use points for this flight?',
      });

      expect(result.questionAnswer).toBeDefined();
      expect(result.questionAnswer.topic).toContain('Cash vs. Points Valuation');
      expect(result.questionAnswer.answer).toContain('cents per point');
    });

    it('distinguishes live API data from fixture data', () => {
      const liveResult = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 500,
        dataSource: 'live',
      });

      const fixtureResult = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 500,
        dataSource: 'fixture',
      });

      expect(liveResult.facts.some((f) => f.includes('Live GDS Airline API'))).toBe(true);
      expect(fixtureResult.facts.some((f) => f.includes('Sample GDS Fixture'))).toBe(true);
    });
  });

  describe('Advisor Endpoint POST /api/v1/advisor/analyze', () => {
    it('returns 200 with structured analysis for valid request', async () => {
      const res = await request(app)
        .post('/api/v1/advisor/analyze')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-11-20',
          returnDate: '2026-11-30',
          travelers: 1,
          cabin: 'economy',
          tripType: 'round_trip',
          cashPrice: 540,
          currency: 'EUR',
          airline: 'Iberia',
          pointsBalance: 25000,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.advisorMode).toBe('rule_based_engine');
      expect(res.body.data.recommendation.title).toBeDefined();
      expect(res.body.data.recommendation.reasoning).toBeDefined();
      expect(res.body.data.facts.length).toBeGreaterThan(0);
      expect(res.body.data.estimates.length).toBeGreaterThan(0);
      expect(res.body.data.assumptions.length).toBeGreaterThan(0);
      expect(res.body.data.followUpQuestions.length).toBeGreaterThan(0);
    });

    it('rejects invalid request with 400 VALIDATION_ERROR when required fields are missing or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/advisor/analyze')
        .send({
          origin: 'INVALID', // Not 3 letters
          destination: 'JFK',
          departureDate: 'invalid-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toBeDefined();
    });

    it('rejects identical origin and destination with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/advisor/analyze')
        .send({
          origin: 'MAD',
          destination: 'MAD',
          departureDate: '2026-11-20',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.destination).toBeDefined();
    });

    it('rejects return date that precedes departure date', async () => {
      const res = await request(app)
        .post('/api/v1/advisor/analyze')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-11-25',
          returnDate: '2026-11-10',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.returnDate).toBeDefined();
    });

    it('rejects question that exceeds 300 characters to prevent prompt abuse', async () => {
      const res = await request(app)
        .post('/api/v1/advisor/analyze')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-11-20',
          question: 'A'.repeat(301),
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.question).toBeDefined();
    });

    it('answers question in API request and generates tailored advice', async () => {
      const res = await request(app)
        .post('/api/v1/advisor/analyze')
        .send({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
          travelers: 1,
          cabin: 'economy',
          cashPrice: 65,
          question: 'Is it better to pay cash or use points?',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.questionAnswer).toBeDefined();
      expect(res.body.data.questionAnswer.topic).toContain('Cash vs. Points');
    });
  });

  describe('Health Check Advisor Reporting', () => {
    it('GET /api/v1/health exposes advisorEngine status', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.providers.advisorEngine).toBeDefined();
      expect(res.body.providers.advisorEngine.mode).toBe('rule_based_engine');
      expect(res.body.providers.advisorEngine.aiConfigured).toBe(false);
    });
  });
});
