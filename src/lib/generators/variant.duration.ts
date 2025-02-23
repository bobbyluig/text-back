import { convertMessage, getRandomMessageSlice, RETRY_GENERATION } from '$lib/generators/variant';
import { Random } from '$lib/random';
import type { Question } from '$lib/types';
import humanizeDuration from 'humanize-duration';

/**
 * The minimum number of messages in the question. This must be at least 2 since we need a message
 * and a response.
 */
const MIN_MESSAGES = 3;

/**
 * The maximum number of messages in the question.
 */
const MAX_MESSAGES = 10;

/**
 * Generates a duration variant question. May throw a sentinel value for retrying generation. The
 * approach is to get a random slice of messages and find a fixed size window where the last two
 * messages change participants.
 */
export async function generateQuestion(rng: Random): Promise<Question> {
	const messages = await getRandomMessageSlice(rng, 2 * MAX_MESSAGES);
	const windowSize = rng.range(MIN_MESSAGES, MAX_MESSAGES + 1);

	let startIndex = 1;
	for (; startIndex < messages.length - windowSize; startIndex++) {
		if (messages[startIndex].participant !== messages[startIndex - 1].participant) {
			break;
		}
	}
	if (startIndex === messages.length - windowSize) {
		throw RETRY_GENERATION;
	}

	const window = messages.slice(startIndex, startIndex + windowSize);
	const durationMs = window.at(-1)!.timestamp.getTime() - window.at(-2)!.timestamp.getTime();

	return {
		answer: 'a',
		choices: [
			humanizeDuration(durationMs / 10, { round: true }),
			humanizeDuration(durationMs, { round: true }),
			humanizeDuration(durationMs * 10, { round: true })
		],
		messages: window.map(convertMessage),
		variant: 'duration'
	};
}
