import { prisma } from '$lib/prisma';
import { Random } from '$lib/random';
import { getServerState } from '$lib/server';
import type { QuestionMessage } from '$lib/types';
import type { Prisma } from '@prisma/client';

/**
 * Selects the necessary fields for display a question message.
 */
export const MESSAGE_SELECT = {
	medias: {
		orderBy: {
			id: 'asc' as const
		},
		select: {
			uri: true
		},
		take: 1
	},
	participant: {
		select: {
			name: true
		}
	},
	reactions: {
		orderBy: {
			id: 'asc' as const
		},
		select: {
			reaction: true,
			participant: {
				select: {
					name: true
				}
			}
		},
		take: 1
	},
	platform: true,
	text: true,
	timestamp: true
};

/**
 * A unique sentinel value to indicate that question generation should be retried. This can happen
 * because the random state did not result in a valid question.
 */
export const RETRY_GENERATION = Symbol();

/**
 * Returns a random message id within the range of all messages.
 */
function getRandomMessageId(rng: Random): number {
	return rng.range(
		getServerState().metadata.message.startId,
		getServerState().metadata.message.endId + 1
	);
}

/**
 * Converts a database message to a question message.
 */
export function convertMessage(
	message: Prisma.MessageGetPayload<{
		select: typeof MESSAGE_SELECT;
	}>
): QuestionMessage {
	return {
		content: message.medias.length > 0 ? message.medias[0].uri : message.text,
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
	filter: Omit<Prisma.MessageWhereInput, 'id'>
): Promise<
	Prisma.MessageGetPayload<{
		select: typeof MESSAGE_SELECT;
	}>
> {
	const randomMessage = await prisma.message.findFirst({
		select: MESSAGE_SELECT,
		where: {
			...filter,
			id: {
				gte: getRandomMessageId(rng)
			}
		}
	});
	if (randomMessage === null) {
		throw RETRY_GENERATION;
	}
	return randomMessage;
}

/**
 * Gets a random message slice of the specified length. No additional filtering is performed. May
 * throw a sentinel value for retrying generation.
 */
export async function getRandomMessageSlice(
	rng: Random,
	length: number
): Promise<
	Array<
		Prisma.MessageGetPayload<{
			select: typeof MESSAGE_SELECT;
		}>
	>
> {
	const randomMessage = await prisma.message.findUniqueOrThrow({
		select: {
			timestamp: true
		},
		where: {
			id: getRandomMessageId(rng)
		}
	});
	const messages = await prisma.message.findMany({
		orderBy: {
			timestamp: 'asc'
		},
		select: MESSAGE_SELECT,
		take: length,
		where: {
			timestamp: {
				gte: randomMessage.timestamp
			}
		}
	});
	if (messages.length < length) {
		throw RETRY_GENERATION;
	}
	return messages;
}
