import { eq, and, desc } from 'drizzle-orm';
import { getDb, isDbConnected } from '../../config/database.js';
import { fareSnapshots } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';

class FareSnapshotsRepository {
  constructor() {
    this.memoryStore = [];
  }

  async create(data) {
    const db = getDb();
    if (!db || !isDbConnected()) {
      logger.warn('Database disconnected; saving fare snapshot to memory store', { id: data.id });
      this.memoryStore.push({ ...data, createdAt: new Date(), capturedAt: new Date() });
      return data;
    }

    try {
      const [inserted] = await db.insert(fareSnapshots).values(data).returning();
      return inserted;
    } catch (err) {
      logger.warn('Failed to insert fare snapshot to DB; falling back to memory store', {
        error: err.message,
      });
      this.memoryStore.push({ ...data, createdAt: new Date(), capturedAt: new Date() });
      return data;
    }
  }

  async findByRouteAndDates({ origin, destination, departureDate, cabin }) {
    const db = getDb();
    if (!db || !isDbConnected()) {
      return this.memoryStore
        .filter(
          (s) =>
            s.origin === origin &&
            s.destination === destination &&
            s.departureDate === departureDate &&
            (!cabin || s.cabin === cabin)
        )
        .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
    }

    try {
      const conditions = [
        eq(fareSnapshots.origin, origin),
        eq(fareSnapshots.destination, destination),
        eq(fareSnapshots.departureDate, departureDate),
      ];

      if (cabin) {
        conditions.push(eq(fareSnapshots.cabin, cabin));
      }

      return await db
        .select()
        .from(fareSnapshots)
        .where(and(...conditions))
        .orderBy(desc(fareSnapshots.capturedAt))
        .limit(50);
    } catch (err) {
      logger.warn('Failed to query fare snapshots from DB; falling back to memory store', {
        error: err.message,
      });
      return this.memoryStore
        .filter(
          (s) =>
            s.origin === origin &&
            s.destination === destination &&
            s.departureDate === departureDate &&
            (!cabin || s.cabin === cabin)
        )
        .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
    }
  }

  async findByUserId(userId, limit = 20) {
    if (!userId) return [];

    const db = getDb();
    if (!db || !isDbConnected()) {
      return this.memoryStore
        .filter((s) => s.userId === userId)
        .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt))
        .slice(0, limit);
    }

    try {
      return await db
        .select()
        .from(fareSnapshots)
        .where(eq(fareSnapshots.userId, userId))
        .orderBy(desc(fareSnapshots.capturedAt))
        .limit(limit);
    } catch (err) {
      logger.warn('Failed to query user fare snapshots from DB; falling back to memory store', {
        error: err.message,
      });
      return this.memoryStore
        .filter((s) => s.userId === userId)
        .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt))
        .slice(0, limit);
    }
  }

  clearMemoryStore() {
    this.memoryStore = [];
  }
}

export const fareSnapshotsRepository = new FareSnapshotsRepository();
