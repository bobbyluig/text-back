import { PrismaClient } from '@prisma/client';

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
