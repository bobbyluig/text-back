import cliProgress from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { COPY_CONCURRENCY, normalizeEmoji, prisma } from './importer.common';
import { MessagePlatform } from '@prisma/client';

/**
 * Data structure for a Meta conversation. This covers Instagram and legacy Messenger data.
 */
type MetaConversation = {
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
 * Imports data from an Instagram conversation.
 */
export async function importInstagram(dataPath: string, outMediaPath: string): Promise<void> {
	return importMeta(dataPath, outMediaPath, MessagePlatform.INSTAGRAM);
}

/**
 * Imports data from a legacy (not end-to-end encrypted) Messenger conversation.
 */
export async function importMessengerLegacy(dataPath: string, outMediaPath: string): Promise<void> {
	return importMeta(dataPath, outMediaPath, MessagePlatform.MESSENGER);
}

/**
 * Internal function to import data from a Meta conversation.
 */
async function importMeta(
	dataPath: string,
	outMediaPath: string,
	platform: MessagePlatform
): Promise<void> {
	const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as MetaConversation;
	const mediaPath = path.dirname(dataPath);

	outMediaPath = path.join(outMediaPath, platform.toLowerCase());
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

	const mediaPromises = new Set<Promise<void>>();

	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(data.messages.length, 0);

	for (const message of data.messages.reverse()) {
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
			bar.increment();
			continue;
		}

		const participantId = participants.get(message.sender_name);
		if (participantId === undefined) {
			bar.increment();
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
			bar.increment();
			continue;
		}

		if (text.endsWith('(edited)')) {
			const previousMessage = await prisma.message.findFirst({
				where: { participantId, platform },
				orderBy: { timestamp: 'desc' }
			});
			if (previousMessage !== null && previousMessage.type === 'TEXT') {
				const newText = text.slice(0, -9);
				await prisma.message.updateMany({
					data: { text: newText, words: newText.trim().split(/\s+/).length },
					where: { id: previousMessage?.id }
				});
			}
			bar.increment();
			continue;
		}

		const createPromise = prisma.message.create({
			data: {
				medias: {
					createMany: {
						data: medias.map((media) => ({
							uri: `${platform.toLowerCase()}/${path.basename(media.uri)}`
						}))
					}
				},
				participantId,
				platform,
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

		for (const media of medias) {
			if (media.uri.startsWith('https://')) {
				continue;
			}
			const mediaPromise = fs.promises
				.copyFile(media.uri, path.join(outMediaPath, path.basename(media.uri)))
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

/**
 * Decodes a string from Meta which is oddly encoded.
 */
function decodeString(input: string): string {
	const codeArray = input.split('').map((char) => char.charCodeAt(0));
	const byteArray = Uint8Array.from(codeArray);
	return new TextDecoder('utf-8').decode(byteArray);
}
