import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not set. Operating in memory-only mode without database persistence.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    logger.info('Connected to MongoDB successfully.');
    return true;
  } catch (error) {
    logger.warn(`Could not connect to MongoDB: ${error.message}. Running without database persistence.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected() {
  return isConnected;
}

export async function disconnectDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
