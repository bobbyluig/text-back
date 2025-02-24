import { PrismaClient } from '@prisma/client';

/**
 * Prisma client instance for connecting to the local database.
 */
export const prisma = new PrismaClient();

/**
 * A function that represents an importer. The importer should mutate the database as necessary.
 */
export type Importer = (input: string, outMediaPath: string) => Promise<void>;
