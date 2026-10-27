import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../config/database.js';
import { pointsForecasts } from '../../db/schema.js';

export class ForecastRepository {
  async findByUserId(userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    return await db
      .select()
      .from(pointsForecasts)
      .where(eq(pointsForecasts.userId, userId))
      .orderBy(desc(pointsForecasts.createdAt))
      .limit(1);
  }

  async saveForecast(payload) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const inserted = await db
      .insert(pointsForecasts)
      .values(payload)
      .returning();

    return inserted[0];
  }
}

export const forecastRepository = new ForecastRepository();
