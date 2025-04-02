import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { COPY_CONCURRENCY, normalizeEmoji, prisma } from './importer.common';

/**
 * Data structure for a Messenger conversation.
 */
type MessengerConversation = {
	messages: Array<{
		isUnsent: boolean;
		media: Array<{ uri: string }>;
		reactions: Array<{ actor: string; reaction: string }>;
		senderName: string;
		text: string;
		timestamp: number;
		type: string;
	}>;
	participants: Array<string>;
};

/**
 * Imports data from a Messenger end-to-end encrypted export.
 */
export async function importMessenger(dataPath: string, outMediaPath: string): Promise<void> {
	const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as MessengerConversation;
	const mediaPath = path.join(path.dirname(dataPath), 'media');

	outMediaPath = path.join(outMediaPath, 'messenger');
	if (!fs.existsSync(outMediaPath)) {
		fs.mkdirSync(outMediaPath, { recursive: true });
	}

	const participants = new Map<string, number>();
	for (const participant of data.participants) {
		const prismaParticipant = await prisma.participant.upsert({
			create: { name: participant },
			update: {},
			where: { name: participant }
		});
		participants.set(participant, prismaParticipant.id);
	}

	const mediaPromises = new Set<Promise<void>>();

	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(data.messages.length, 0);

	for (const message of data.messages) {
		if (message.isUnsent) {
			bar.increment();
			continue;
		}

		if (message.media.some((media) => media.uri === 'Failed to download media')) {
			bar.increment();
			continue;
		}

		const participantId = participants.get(message.senderName);
		if (participantId === undefined) {
			bar.increment();
			continue;
		}

		if (message.text.length === 0 && message.media.length === 0) {
			bar.increment();
			continue;
		}

		const createPromise = prisma.message.create({
			data: {
				medias: {
					createMany: {
						data: message.media.map((media) => ({ uri: `messenger/${path.basename(media.uri)}` }))
					}
				},
				participantId,
				platform: 'MESSENGER',
				reactions: {
					createMany: {
						data: message.reactions
							.filter(
								(reaction) => reaction.reaction !== 'unknown' && participants.has(reaction.actor)
							)
							.map((reaction) => ({
								participantId: participants.get(reaction.actor)!,
								reaction: normalizeEmoji(reaction.reaction)
							}))
					}
				},
				text: message.media.length > 0 ? '' : message.text,
				timestamp: new Date(message.timestamp),
				type: message.media.length > 0 ? 'MEDIA' : 'TEXT',
				words: message.media.length > 0 ? 0 : message.text.trim().split(/\s+/).length
			}
		});

		for (const media of message.media) {
			const mediaPromise = fs.promises
				.copyFile(
					path.join(mediaPath, path.basename(media.uri)),
					path.join(outMediaPath, path.basename(media.uri))
				)
				.then(() => {
					mediaPromises.delete(mediaPromise);
				})
				.then(() => bar.increment());
			mediaPromises.add(mediaPromise);
			bar.setTotal(bar.getTotal() + 1);
		}

		await createPromise;
		while (mediaPromises.size > COPY_CONCURRENCY) {
			await Promise.any(mediaPromises.values());
		}
		bar.increment();
	}

	await Promise.all(mediaPromises);
	bar.stop();
}
