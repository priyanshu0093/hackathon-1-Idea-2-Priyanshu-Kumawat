import { eq } from 'drizzle-orm';
import { getDb } from '../../config/database.js';
import { users } from '../../db/schema.js';

export class AuthRepository {
  async createUser(userData) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const inserted = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        passwordHash: userData.passwordHash,
        name: userData.name || null,
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      });

    return inserted[0];
  }

  async findByEmail(email) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return results[0] || null;
  }

  async findById(id) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not connected');
    }

    const results = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return results[0] || null;
  }
}

export const authRepository = new AuthRepository();
