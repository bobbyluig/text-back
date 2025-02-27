import type { Question, QuestionMessage } from '$lib/question';
import { Random } from '$lib/random';
import { getMetadata } from '$lib/server/metadata';
import { prisma } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';

/**
 * A unique sentinel value to indicate that question generation should be retried. This can happen
 * because the random state did not result in a valid question.
 */
export const RETRY_GENERATION = Symbol();

/**
 * The interface that all variant generators conform to.
 */
export interface VariantGenerator {
	/**
	 * Generates a question for the variant. May throw a sentinel value for retrying generation.
	 */
	generate(rng: Random): Promise<Question>;
}

/**
 * The database message containing a subset of all fields.
 */
export type DatabaseMessage = Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>;

/**
 * Selects the necessary fields for display a question message. For any messages with multiple
 * medias or reactions, only the first will be consistently returned for simplicity.
 */
const MESSAGE_SELECT = {
	id: true,
	medias: { orderBy: { id: 'asc' as const }, select: { uri: true }, take: 1 },
	participant: { select: { name: true } },
	reactions: {
		orderBy: { id: 'asc' as const },
		select: { reaction: true, participant: { select: { name: true } } },
		take: 1
	},
	platform: true,
	text: true,
	timestamp: true
};

/**
 * Converts a database message to a question message.
 */
export function convertMessage(message: DatabaseMessage): QuestionMessage {
	if (message.text === '' && message.medias.length === 0) {
		throw new Error('Empty message');
	}
	return {
		content: message.text !== '' ? message.text : message.medias[0].uri,
		date: message.timestamp,
		isMedia: message.medias.length > 0,
		participant: message.participant.name,
		platform: message.platform,
		reaction: message.reactions.length > 0 ? message.reactions[0].reaction : ''
	};
}

/**
 * Gets a random message subject to the specified filter. May throw a sentinel value for retrying
 * generation.
 */
export async function getRandomMessage(
	rng: Random,
	filter?: Omit<Prisma.MessageWhereInput, 'id'>
): Promise<DatabaseMessage> {
	const id = rng.range(getMetadata().message.startId, getMetadata().message.endId + 1);
	const direction = rng.boolean() ? 'asc' : 'desc';
	const randomMessage = await prisma.message.findFirst({
		orderBy: { id: direction },
		select: MESSAGE_SELECT,
		where: { ...filter, id: direction === 'asc' ? { gte: id } : { lte: id } }
	});
	if (randomMessage === null) {
		throw RETRY_GENERATION;
	}
	return randomMessage;
}

/**
 * Gets a message slice of the specified length that starts with or ends with the anchor message.
 * Results are always returned in ascending timestamp and id order. May throw a sentinel value for
 * retrying generation.
 */
export async function getMessageSlice(
	anchor: { start: DatabaseMessage } | { end: DatabaseMessage },
	length: number
): Promise<Array<DatabaseMessage>> {
	const direction = 'start' in anchor ? 'asc' : 'desc';
	const message = 'start' in anchor ? anchor.start : anchor.end;
	const messages = await prisma.message.findMany({
		orderBy: [{ timestamp: direction }, { id: direction }],
		select: MESSAGE_SELECT,
		take: length,
		where: {
			OR: [
				{
					id: 'start' in anchor ? { gte: message.id } : { lte: message.id },
					timestamp: message.timestamp
				},
				{ timestamp: 'start' in anchor ? { gt: message.timestamp } : { lt: message.timestamp } }
			]
		}
	});
	if (messages.length < length) {
		throw RETRY_GENERATION;
	}
	if ('end' in anchor) {
		messages.reverse();
	}
	return messages;
}
