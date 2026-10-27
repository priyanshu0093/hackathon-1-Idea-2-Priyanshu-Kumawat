import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../config/database.js';
import { loyaltyBalances } from '../../db/schema.js';

export class WalletRepository {
  async findByUserId(userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    return await db
      .select()
      .from(loyaltyBalances)
      .where(eq(loyaltyBalances.userId, userId))
      .orderBy(desc(loyaltyBalances.lastUpdated));
  }

  async findByIdAndUser(id, userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .select()
      .from(loyaltyBalances)
      .where(and(eq(loyaltyBalances.id, id), eq(loyaltyBalances.userId, userId)))
      .limit(1);

    return results[0] || null;
  }

  async findByProgramAndUser(program, userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .select()
      .from(loyaltyBalances)
      .where(and(eq(loyaltyBalances.program, program), eq(loyaltyBalances.userId, userId)))
      .limit(1);

    return results[0] || null;
  }

  async upsert(payload) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .insert(loyaltyBalances)
      .values(payload)
      .onConflictDoUpdate({
        target: loyaltyBalances.id,
        set: {
          balance: payload.balance,
          program: payload.program,
          programType: payload.programType,
          currencyName: payload.currencyName,
          notes: payload.notes,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }

  async delete(id, userId) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .delete(loyaltyBalances)
      .where(and(eq(loyaltyBalances.id, id), eq(loyaltyBalances.userId, userId)))
      .returning();

    return results[0] || null;
  }
}

export const walletRepository = new WalletRepository();
