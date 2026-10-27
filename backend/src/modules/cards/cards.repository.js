import { eq, and, desc } from 'drizzle-orm';
import { getDb, isDbConnected } from '../../config/database.js';
import { userCards } from '../../db/schema.js';

export class CardsRepository {
  constructor() {
    // In-memory fallback map for environments or tests without live PostgreSQL
    this.memoryStore = new Map();
  }

  async findByUserId(userId) {
    const db = getDb();
    if (db && isDbConnected()) {
      return await db
        .select()
        .from(userCards)
        .where(eq(userCards.userId, userId))
        .orderBy(desc(userCards.createdAt));
    }

    return Array.from(this.memoryStore.values())
      .filter((card) => card.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findByIdAndUser(id, userId) {
    const db = getDb();
    if (db && isDbConnected()) {
      const results = await db
        .select()
        .from(userCards)
        .where(and(eq(userCards.id, id), eq(userCards.userId, userId)))
        .limit(1);

      return results[0] || null;
    }

    const card = this.memoryStore.get(id);
    if (card && card.userId === userId) {
      return card;
    }
    return null;
  }

  async findByUserAndProduct(userId, cardProductId) {
    const db = getDb();
    if (db && isDbConnected()) {
      const results = await db
        .select()
        .from(userCards)
        .where(and(eq(userCards.userId, userId), eq(userCards.cardProductId, cardProductId)))
        .limit(1);

      return results[0] || null;
    }

    return Array.from(this.memoryStore.values()).find(
      (c) => c.userId === userId && c.cardProductId === cardProductId
    ) || null;
  }

  async insert(payload) {
    const db = getDb();
    if (db && isDbConnected()) {
      const results = await db.insert(userCards).values(payload).returning();
      return results[0];
    }

    this.memoryStore.set(payload.id, { ...payload });
    return { ...payload };
  }

  async update(id, userId, updates) {
    const db = getDb();
    if (db && isDbConnected()) {
      const results = await db
        .update(userCards)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(userCards.id, id), eq(userCards.userId, userId)))
        .returning();

      return results[0] || null;
    }

    const existing = this.memoryStore.get(id);
    if (existing && existing.userId === userId) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };
      this.memoryStore.set(id, updated);
      return updated;
    }
    return null;
  }

  async delete(id, userId) {
    const db = getDb();
    if (db && isDbConnected()) {
      const results = await db
        .delete(userCards)
        .where(and(eq(userCards.id, id), eq(userCards.userId, userId)))
        .returning();

      return results[0] || null;
    }

    const existing = this.memoryStore.get(id);
    if (existing && existing.userId === userId) {
      this.memoryStore.delete(id);
      return existing;
    }
    return null;
  }
}

export const cardsRepository = new CardsRepository();
