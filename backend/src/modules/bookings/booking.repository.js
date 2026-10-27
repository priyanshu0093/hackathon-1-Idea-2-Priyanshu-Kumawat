import { eq, and, desc } from 'drizzle-orm';
import { getDb, isDbConnected } from '../../config/database.js';
import { externalBookings } from '../../db/schema.js';

export class BookingRepository {
  constructor() {
    this.memoryStore = new Map();
  }

  async findByUserId(userId) {
    const db = getDb();
    if (db && isDbConnected()) {
      return await db
        .select()
        .from(externalBookings)
        .where(eq(externalBookings.userId, userId))
        .orderBy(desc(externalBookings.createdAt));
    }

    return Array.from(this.memoryStore.values())
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async findByIdAndUser(id, userId) {
    const db = getDb();
    if (db && isDbConnected()) {
      const results = await db
        .select()
        .from(externalBookings)
        .where(and(eq(externalBookings.id, id), eq(externalBookings.userId, userId)))
        .limit(1);

      return results[0] || null;
    }

    const item = this.memoryStore.get(id);
    if (item && item.userId === userId) {
      return item;
    }
    return null;
  }

  async create(payload) {
    const db = getDb();
    if (db && isDbConnected()) {
      const inserted = await db
        .insert(externalBookings)
        .values(payload)
        .returning();

      return inserted[0];
    }

    const item = { ...payload, createdAt: payload.createdAt || new Date() };
    this.memoryStore.set(payload.id, item);
    return item;
  }

  async delete(id, userId) {
    const db = getDb();
    if (db && isDbConnected()) {
      const deleted = await db
        .delete(externalBookings)
        .where(and(eq(externalBookings.id, id), eq(externalBookings.userId, userId)))
        .returning();

      return deleted[0] || null;
    }

    const item = this.memoryStore.get(id);
    if (item && item.userId === userId) {
      this.memoryStore.delete(id);
      return item;
    }
    return null;
  }
}

export const bookingRepository = new BookingRepository();
