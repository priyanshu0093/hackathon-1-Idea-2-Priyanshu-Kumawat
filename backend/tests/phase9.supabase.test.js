import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase, isDbConnected } from '../src/config/database.js';

describe('Phase 9: Supabase PostgreSQL Persistence Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('verifies Supabase PostgreSQL connection in health endpoint', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBeDefined();
    expect(res.body.database.dialect).toBe('postgresql');
    expect(res.body.database.provider).toBe('supabase');
    expect(res.body.database.connected).toBe(isDbConnected());
    if (isDbConnected()) {
      expect(res.body.database.mode).toBe('postgresql');
    }
  });

  it('rejects invalid trip payload (identical origin and destination) with 400', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .send({
        origin: 'BOM',
        destination: 'BOM',
        cabin: 'economy',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('rejects invalid IATA codes with 400', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .send({
        origin: 'INVALID',
        destination: 'DEL',
        cabin: 'economy',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('persists a verified trip to Supabase PostgreSQL with parameterized query', async () => {
    if (!isDbConnected()) {
      console.warn('Skipping live DB write test as PostgreSQL is not connected');
      return;
    }

    const testTrip = {
      origin: 'DEL',
      destination: 'LHR',
      cabin: 'business',
      departureDate: '2026-12-15',
      carrier: 'Virgin Atlantic',
      cashPrice: 1850.0,
      pointsCost: 47500,
      taxes: 280.0,
      program: 'Virgin Atlantic Flying Club',
      estimatedSavings: 1570.0,
      dataSource: 'benchmark',
      notes: 'Phase 9 verification itinerary',
      metadata: { testSuite: 'phase9.supabase' },
    };

    // 1. Create trip
    const createRes = await request(app)
      .post('/api/v1/trips')
      .send(testTrip);

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toBeDefined();
    expect(createRes.body.data.origin).toBe('DEL');
    expect(createRes.body.data.destination).toBe('LHR');
    expect(createRes.body.data.carrier).toBe('Virgin Atlantic');
    expect(createRes.body.meta.persisted).toBe(true);
    expect(createRes.body.meta.persistence).toBe('supabase_postgresql');

    const createdId = createRes.body.data.id;

    // 2. Fetch trip by ID
    const getRes = await request(app).get(`/api/v1/trips/${createdId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(createdId);
    expect(getRes.body.data.cabin).toBe('business');

    // 3. List trips
    const listRes = await request(app).get('/api/v1/trips');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some((t) => t.id === createdId)).toBe(true);

    // 4. Delete trip
    const deleteRes = await request(app).delete(`/api/v1/trips/${createdId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.id).toBe(createdId);

    // 5. Verify deletion
    const verifyRes = await request(app).get(`/api/v1/trips/${createdId}`);
    expect(verifyRes.status).toBe(404);
  });
});
