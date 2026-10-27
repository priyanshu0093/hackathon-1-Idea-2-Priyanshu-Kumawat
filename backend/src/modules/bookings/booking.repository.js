import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../config/database.js';
import { externalBookings } from '../../db/schema.js';

export class BookingRepository {
  async findByUserId(userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    return await db
      .select()
      .from(externalBookings)
      .where(eq(externalBookings.userId, userId))
      .orderBy(desc(externalBookings.departureDate));
  }

  async findByIdAndUser(id, userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .select()
      .from(externalBookings)
      .where(and(eq(externalBookings.id, id), eq(externalBookings.userId, userId)))
      .limit(1);

    return results[0] || null;
  }

  async create(payload) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const inserted = await db
      .insert(externalBookings)
      .values(payload)
      .returning();

    return inserted[0];
  }

  async delete(id, userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const deleted = await db
      .delete(externalBookings)
      .where(and(eq(externalBookings.id, id), eq(externalBookings.userId, userId)))
      .returning();

    return deleted[0] || null;
  }
}

export const bookingRepository = new BookingRepository();
