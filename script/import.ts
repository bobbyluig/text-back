import fs from 'fs';
import path from 'path';
import url from 'url';
import { prisma, type Importer } from './importer.common';
import { importInstagram } from './importer.instagram';
import { importMessenger } from './importer.messenger';

/**
 * Polyfill for `__dirname` when using ESM modules.
 */
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * All supported platforms and associated import functions.
 */
const importers = new Map<string, Importer>([
	['instagram', importInstagram],
	['messenger', importMessenger]
]);

/**
 * Entry point for the script to import conversation data. It is possible to call this multiple
 * times with different platforms. Duplicate imports are not supported and are not checked for.
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (args.length !== 2) {
		throw new Error('Usage: tsx import.ts <platform> <input>');
	}

	const platform = args[0].toLowerCase();
	const input = args[1];

	const importer = importers.get(platform);
	if (importer === undefined) {
		throw new Error(`Unsupported platform: ${platform}`);
	}

	await prisma.$queryRawUnsafe('PRAGMA journal_mode = memory;');
	await prisma.$queryRawUnsafe('PRAGMA synchronous = OFF;');

	const outMediaPath = path.join(__dirname, '..', 'static', 'media');
	if (!fs.existsSync(outMediaPath)) {
		fs.mkdirSync(outMediaPath, { recursive: true });
	}

	return importer(input, outMediaPath);
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
