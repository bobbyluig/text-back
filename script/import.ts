import { PrismaClient } from '@prisma/client';
import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import url from 'url';

/**
 * Polyfill for `__dirname` when using ESM modules.
 */
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * Prisma client instance for connecting to the local database.
 */
const prisma = new PrismaClient();

/**
 * All supported platforms and associated import functions.
 */
const importers = new Map<string, (input: string, outMediaPath: string) => Promise<void>>([
	['messenger', importMessenger]
]);

/**
 * Data structure for a Messenger conversation.
 */
type MessengerConversation = {
	participants: string[];
	messages: {
		isUnsent: boolean;
		media: {
			uri: string;
		}[];
		reactions: {
			actor: string;
			reaction: string;
		}[];
		senderName: string;
		text: string;
		timestamp: number;
		type: string;
	}[];
};

/**
 * Imports data from a Messenger end-to-end encrypted export. Assumes that the input is the path of
 * a JSON file with the desired conversation. Any associated media files should be in a folder named
 *  `media` in the same directory.
 */
async function importMessenger(dataPath: string, outMediaPath: string): Promise<void> {
	const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as MessengerConversation;
	const mediaPath = path.join(path.dirname(dataPath), 'media');

	outMediaPath = path.join(outMediaPath, 'messenger');
	if (!fs.existsSync(outMediaPath)) {
		fs.mkdirSync(outMediaPath, { recursive: true });
	}

	const participants = new Map<string, number>();
	for (const participant of data.participants) {
		const prismaParticipant = await prisma.participant.create({
			data: {
				name: participant
			}
		});
		participants.set(participant, prismaParticipant.id);
	}

	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(data.messages.length, 0);

	for (const message of data.messages) {
		if (message.isUnsent) {
			continue;
		}

		if (message.media.some((media) => media.uri === 'Failed to download media')) {
			continue;
		}

		const participantId = participants.get(message.senderName);
		if (participantId === undefined) {
			continue;
		}

		const createPromise = prisma.message.create({
			data: {
				participantId,
				platform: 'MESSENGER',
				text: message.text,
				timestamp: new Date(message.timestamp),
				type: message.type === 'media' ? 'MEDIA' : 'TEXT',
				medias: {
					createMany: {
						data: message.media.map((media) => ({
							uri: `messenger/${path.basename(media.uri)}`
						}))
					}
				},
				reactions: {
					createMany: {
						data: message.reactions
							.filter(
								(reaction) => reaction.reaction !== 'unknown' && participants.has(reaction.actor)
							)
							.map((reaction) => ({
								participantId: participants.get(reaction.actor)!,
								reaction: reaction.reaction
							}))
					}
				},
				words: message.text.trim().split(/\s+/).length
			}
		});

		const mediaPromises = message.media.map((media) => {
			return fs.promises.copyFile(
				path.join(mediaPath, path.basename(media.uri)),
				path.join(outMediaPath, path.basename(media.uri))
			);
		});

		await Promise.all([createPromise, ...mediaPromises]);
		bar.increment();
	}

	bar.stop();
}

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
