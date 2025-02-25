import { MessagePlatform } from '@prisma/client';
import { prisma } from '$lib/server/prisma';

/**
 * Represents metadata about all conversations to simplify question generation. All ranges are
 * assumed to be inclusive.
 */
export type Metadata = {
	message: {
		distinctPlatforms: Array<MessagePlatform>;
		endDate: Date;
		endId: number;
		startDate: Date;
		startId: number;
	};
	participant: { distinctNames: Array<string> };
	reaction: { distinctReactions: Array<string>; endId: number; startId: number };
};

/**
 * Computes and stores metadata to simplify question generation. Should be called once on server
 * initialization.
 */
export async function computeMetadata() {
	metadata = {
		message: await computeMessageMetadata(),
		participant: await computeParticipantMetadata(),
		reaction: await computeReactionMetadata()
	};
}

/**
 * Returns the cached metadata.
 */
export function getMetadata(): Metadata {
	if (metadata === undefined) {
		throw new Error('Server metadata has not been initialized');
	}
	return metadata;
}

/**
 * Metadata that is initialized on server start.
 */
let metadata: Metadata | undefined;

/**
 * Computes metadata about all messages.
 */
async function computeMessageMetadata(): Promise<Metadata['message']> {
	const aggregate = await prisma.message.aggregate({
		_max: { id: true, timestamp: true },
		_min: { id: true, timestamp: true }
	});
	const findMany = await prisma.message.findMany({
		distinct: ['platform'],
		select: { platform: true }
	});
	if (
		aggregate._max.id === null ||
		aggregate._max.timestamp === null ||
		aggregate._min.id === null ||
		aggregate._min.timestamp === null
	) {
		throw new Error('No messages to generate questions');
	}
	return {
		distinctPlatforms: findMany.map((message) => message.platform).sort(),
		endId: aggregate._max.id,
		endDate: aggregate._max.timestamp,
		startId: aggregate._min.id,
		startDate: aggregate._min.timestamp
	};
}

/**
 * Computes metadata about all participants.
 */
async function computeParticipantMetadata(): Promise<Metadata['participant']> {
	const findMany = await prisma.participant.findMany({
		distinct: ['name'],
		select: { name: true }
	});
	if (findMany.length !== 2) {
		throw new Error('Only two participants are supported');
	}
	return { distinctNames: findMany.map((participant) => participant.name).sort() };
}

/**
 * Computes metadata about all reactions.
 */
async function computeReactionMetadata(): Promise<Metadata['reaction']> {
	const aggregate = await prisma.reaction.aggregate({ _max: { id: true }, _min: { id: true } });
	const findMany = await prisma.reaction.findMany({
		distinct: ['reaction'],
		select: { reaction: true }
	});
	if (aggregate._max.id === null || aggregate._min.id === null) {
		throw new Error('No reactions to generate questions');
	}
	return {
		distinctReactions: findMany.map((reaction) => reaction.reaction).sort(),
		endId: aggregate._max.id,
		startId: aggregate._min.id
	};
}
