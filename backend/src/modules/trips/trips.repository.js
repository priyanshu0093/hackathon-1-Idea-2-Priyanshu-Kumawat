import { eq, isNull, desc } from 'drizzle-orm';
import { getDb } from '../../config/database.js';
import { savedTrips } from '../../db/schema.js';

export class TripsRepository {
  /**
   * Fetch saved trips, strictly filtered by authenticated user or anonymous-only
   */
  async findAll(userId = null) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    if (userId) {
      return await db
        .select()
        .from(savedTrips)
        .where(eq(savedTrips.userId, userId))
        .orderBy(desc(savedTrips.createdAt));
    }

    // Unauthenticated: only return anonymous trips (userId IS NULL), preventing cross-user data leaks
    return await db
      .select()
      .from(savedTrips)
      .where(isNull(savedTrips.userId))
      .orderBy(desc(savedTrips.createdAt));
  }

  /**
   * Find a saved trip by unique ID
   */
  async findById(id) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }
    const results = await db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.id, id))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Insert or update a trip record with user ownership
   */
  async upsert(tripData) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const payload = {
      id: tripData.id,
      userId: tripData.userId || null,
      origin: tripData.origin,
      destination: tripData.destination,
      cabin: tripData.cabin || 'economy',
      departureDate: tripData.departureDate || null,
      returnDate: tripData.returnDate || null,
      carrier: tripData.carrier || null,
      cashPrice: tripData.cashPrice !== undefined && tripData.cashPrice !== null ? String(tripData.cashPrice) : null,
      pointsCost: tripData.pointsCost !== undefined && tripData.pointsCost !== null ? Number(tripData.pointsCost) : null,
      taxes: tripData.taxes !== undefined && tripData.taxes !== null ? String(tripData.taxes) : null,
      program: tripData.program || null,
      estimatedSavings: tripData.estimatedSavings !== undefined && tripData.estimatedSavings !== null ? String(tripData.estimatedSavings) : null,
      dataSource: tripData.dataSource || 'benchmark',
      notes: tripData.notes || null,
      metadata: tripData.metadata || {},
      updatedAt: new Date(),
    };

    const results = await db
      .insert(savedTrips)
      .values(payload)
      .onConflictDoUpdate({
        target: savedTrips.id,
        set: {
          ...payload,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  /**
   * Delete a saved trip by ID
   */
  async deleteById(id) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const deleted = await db
      .delete(savedTrips)
      .where(eq(savedTrips.id, id))
      .returning();

    return deleted[0] || null;
  }
}

export const tripsRepository = new TripsRepository();
