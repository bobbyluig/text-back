import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { prisma } from './importer.common';

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
 * Imports data from a Messenger end-to-end encrypted export. Assumes that the input is the path of
 * a JSON file with the desired conversation. Any associated media files should be in a folder named
 *  `media` in the same directory.
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

		const medias = [...message.media];
		if (message.type === 'link') {
			medias.push({ uri: message.text });
		}

		const createPromise = prisma.message.create({
			data: {
				medias: {
					createMany: {
						data: medias.map((media) => ({
							uri: media.uri.startsWith('https://')
								? media.uri
								: `messenger/${path.basename(media.uri)}`
						}))
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
								reaction: reaction.reaction
							}))
					}
				},
				text: medias.length === 0 ? message.text : '',
				timestamp: new Date(message.timestamp),
				type: medias.length > 0 ? 'MEDIA' : 'TEXT',
				words: medias.length === 0 ? message.text.trim().split(/\s+/).length : 0
			}
		});

		const mediaPromises = message.media.map((media) =>
			fs.promises.copyFile(
				path.join(mediaPath, path.basename(media.uri)),
				path.join(outMediaPath, path.basename(media.uri))
			)
		);

		await Promise.all([createPromise, ...mediaPromises]);
		bar.increment();
	}

	bar.stop();
}
