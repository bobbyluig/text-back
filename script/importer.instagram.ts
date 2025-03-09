import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { normalizeEmoji, prisma } from './importer.common';

/**
 * Data structure for a Instagram conversation.
 */
type InstagramConversation = {
	messages: Array<{
		audio_files?: Array<{ uri: string }>;
		content?: string;
		photos?: Array<{ uri: string }>;
		reactions?: Array<{ actor: string; reaction: string }>;
		sender_name: string;
		share?: { link?: string };
		timestamp_ms: number;
		videos?: Array<{ uri: string }>;
	}>;
	participants: Array<{ name: string }>;
};

/**
 * Imports data from an Instagram conversation. The data path is assumed to point to a JSON file
 * containing the conversation. Assumes that any associated media files are in the same directory
 * under  `audio`, `photos`, and `videos`.
 */
export async function importInstagram(dataPath: string, outMediaPath: string): Promise<void> {
	const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as InstagramConversation;
	const mediaPath = path.dirname(dataPath);

	outMediaPath = path.join(outMediaPath, 'instagram');
	if (!fs.existsSync(outMediaPath)) {
		fs.mkdirSync(outMediaPath, { recursive: true });
	}

	const participants = new Map<string, number>();
	for (const participant of data.participants) {
		const prismaParticipant = await prisma.participant.upsert({
			create: { name: participant.name },
			update: {},
			where: { name: participant.name }
		});
		participants.set(participant.name, prismaParticipant.id);
	}

	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(data.messages.length, 0);

	for (const message of data.messages) {
		const text =
			message.share?.link !== undefined
				? decodeString(message.share?.link)
				: decodeString(message.content ?? '');

		if (
			/^Reacted .+ to your message $/.test(text) ||
			/^You set the nickname for .+ to .+$/.test(text) ||
			/^.+ set your nickname to .+$/.test(text) ||
			/^Liked a message$/.test(text) ||
			/^.+ sent an attachment.$/.test(text)
		) {
			continue;
		}

		const participantId = participants.get(message.sender_name);
		if (participantId === undefined) {
			continue;
		}

		const medias = [
			{ folder: 'audio', medias: message.audio_files },
			{ folder: 'photos', medias: message.photos },
			{ folder: 'videos', medias: message.videos }
		].flatMap((group) =>
			(group.medias ?? []).map((media) => ({
				uri: path.join(mediaPath, group.folder, path.basename(media.uri))
			}))
		);

		if (medias.length === 0 && text.length === 0) {
			continue;
		}

		const createPromise = prisma.message.create({
			data: {
				medias: {
					createMany: {
						data: medias.map((media) => ({ uri: `instagram/${path.basename(media.uri)}` }))
					}
				},
				participantId,
				platform: 'INSTAGRAM',
				reactions: {
					createMany: {
						data: (message.reactions ?? [])
							.filter((reaction) => participants.has(reaction.actor))
							.map((reaction) => ({
								participantId: participants.get(reaction.actor)!,
								reaction: normalizeEmoji(decodeString(reaction.reaction))
							}))
					}
				},
				text: medias.length > 0 ? '' : text,
				timestamp: new Date(message.timestamp_ms),
				type: medias.length > 0 ? 'MEDIA' : 'TEXT',
				words: medias.length > 0 ? 0 : text.trim().split(/\s+/).length
			}
		});

		const mediaPromises = medias
			.filter((media) => !media.uri.startsWith('https://'))
			.map((media) =>
				fs.promises.copyFile(media.uri, path.join(outMediaPath, path.basename(media.uri)))
			);

		await Promise.all([createPromise, ...mediaPromises]);
		bar.increment();
	}

	bar.stop();
}

/**
 * Decodes a string from Instagram which is oddly encoded.
 */
function decodeString(input: string): string {
	const codeArray = input.split('').map((char) => char.charCodeAt(0));
	const byteArray = Uint8Array.from(codeArray);
	return new TextDecoder('utf-8').decode(byteArray);
}
