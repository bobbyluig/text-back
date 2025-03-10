import { PrismaClient } from '@prisma/client';

/**
 * Used to bound the copy concurrency for media files.
 */
export const COPY_CONCURRENCY = 100;

/**
 * Prisma client instance for connecting to the local database.
 */
export const prisma = new PrismaClient();

/**
 * A function that represents an importer. The importer should mutate the database as necessary.
 */
export type Importer = (input: string, outMediaPath: string) => Promise<void>;

/**
 * Returns the normalized emoji that is colored.
 */
export function normalizeEmoji(emoji: string): string {
	const conversionMap = new Map<string, string>([['❤', '❤️']]);
	return conversionMap.has(emoji) ? conversionMap.get(emoji)! : emoji;
}
