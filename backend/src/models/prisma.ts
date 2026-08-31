import { PrismaClient } from '@prisma/client';
import { jsonDb } from '../db/jsonDb.js';
import { logger } from '../utils/logger.js';

const isPostgres = process.env.DB_TYPE === 'postgres';

let dbInstance: any;

if (isPostgres) {
  logger.info('[DATABASE] Connecting to PostgreSQL database...');
  dbInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
} else {
  logger.info('[DATABASE] Running with JSON Database Engine (data/db.json)');
  dbInstance = jsonDb;
}

export const prisma = dbInstance;
export default prisma;
