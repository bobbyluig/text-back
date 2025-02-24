import { prisma } from '$lib/prisma';
import { Random } from '$lib/random';
import { getServerState } from '$lib/server';
import type { Question, QuestionMessage } from '$lib/types';
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
 * Selects the necessary fields for display a question message. For any messages with multiple
 * medias or reactions, only the first will be consistently returned for simplicity.
 */
const MESSAGE_SELECT = {
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
 * The database message containing a subset of all fields.
 */
type DatabaseMessage = Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>;

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
	const id = rng.range(
		getServerState().metadata.message.startId,
		getServerState().metadata.message.endId + 1
	);
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
 * Gets a message slice of the specified length subject to the timestamp filter. Results are always
 * returned in ascending timestamp and id order. May throw a sentinel value for retrying generation.
 */
export async function getMessageSlice(
	timestamp: { gte: Date } | { lte: Date },
	length: number
): Promise<Array<DatabaseMessage>> {
	const direction = 'gte' in timestamp ? 'asc' : 'desc';
	const messages = await prisma.message.findMany({
		orderBy: [{ timestamp: direction }, { id: direction }],
		select: MESSAGE_SELECT,
		take: length,
		where: { timestamp }
	});
	if (messages.length < length) {
		throw RETRY_GENERATION;
	}
	if ('lte' in timestamp) {
		messages.reverse();
	}
	return messages;
}
