import { PrismaClient } from '@prisma/client';

/**
 * Prisma client instance for connecting to the local database.
 */
export const prisma = new PrismaClient();
export default prisma;
