import type { RequestHandler } from './$types';
import { Random } from '$lib/random';
import type { Question, QuestionVariant, QuestionMessage } from '$lib/types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { getServerState } from '$lib/server';

/**
 * All question generators for supported variants.
 */
const QUESTION_GENERATORS = new Map<QuestionVariant, (rng: Random) => Promise<Question>>([
	['duration', generateQuestionDuration]
]);

/**
 * A unique sentinel value to indicate that question generation should be retried. This can happen
 * simplify because the random state did not result in a valid question.
 */
const RETRY_GENERATION = Symbol();

/**
 * Gets a random message slice of the specified length.
 */
async function getRandomMessageSlice(rng: Random, length: number): Promise<Array<QuestionMessage>> {
	const randomMessage = await prisma.message.findUniqueOrThrow({
		select: {
			timestamp: true
		},
		where: {
			id: rng.range(
				getServerState().metadata.message.startId,
				getServerState().metadata.message.endId + 1
			)
		}
	});
	const messages = await prisma.message.findMany({
		orderBy: {
			timestamp: 'asc'
		},
		select: {
			medias: {
				orderBy: {
					id: 'asc'
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
					id: 'asc'
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
			text: true,
			timestamp: true
		},
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
	return messages.map((message) => ({
		content: message.medias.length > 0 ? message.medias[0].uri : message.text,
		date: message.timestamp,
		isMedia: message.medias.length > 0,
		participant: message.participant.name,
		reaction: message.reactions.length > 0 ? message.reactions[0].reaction : ''
	}));
}

/**
 * Generates a duration variant question given the random state.
 */
async function generateQuestionDuration(rng: Random): Promise<Question> {
	const messages = await getRandomMessageSlice(rng, 2);
	return { messages } as Question;
}

/**
 * Generates a question given the random state.
 */
async function generateQuestion(rng: Random): Promise<Question> {
	const variants = Array.from(QUESTION_GENERATORS.keys()).sort();
	const variant = rng.choice(variants);

	const generator = QUESTION_GENERATORS.get(variant);
	if (generator === undefined) {
		throw new Error(`Unsupported question variant: ${variant}`);
	}

	return generator(rng);
}

/**
 * Generates a question given the seed.
 */
export const GET: RequestHandler = async ({ url }) => {
	const seed = url.searchParams.get('seed');
	const rng = new Random(seed === '' || seed === null ? undefined : seed);

	while (true) {
		try {
			const question = await generateQuestion(rng);
			return json(question);
		} catch (error) {
			if (error === RETRY_GENERATION) {
				continue;
			}
			throw error;
		}
	}
};
