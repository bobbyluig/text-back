import type { Question } from '$lib/question';
import { Random } from '$lib/random';
import { getMetadata } from '$lib/server/metadata';
import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	type VariantGenerator
} from '$lib/server/variant.common';

/**
 * The config for the who variant generator.
 */
export type WhoVariantConfig = {
	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages?: number;

	/**
	 * The minimum number of messages in the question. This must be at least 2 since we need a message
	 * and a response.
	 */
	minMessages?: number;

	/**
	 * The minimum number of words in the anchor message. Messages that are too short are likely too
	 * easy (e.g., a link) or too hard (e.g., a single reaction) to guess.
	 */
	minWords?: number;
};

/**
 * Generator for a who variant question. The player guesses who the sender of the last message in
 * the conversation is.
 */
export class WhoVariantGenerator implements VariantGenerator {
	/**
	 * Config for the who variant generator.
	 */
	private readonly _config: Required<WhoVariantConfig>;

	/**
	 * Creates a new who variant generator with the given config.
	 */
	constructor(config?: WhoVariantConfig) {
		this._config = {
			maxMessages: config?.maxMessages ?? 10,
			minMessages: config?.minMessages ?? 3,
			minWords: config?.minWords ?? 3
		};
	}

	/**
	 * Generates a who variant question. The approach is to get a random anchor message with enough
	 * text that it could be plausibly guessed, then get a slice of messages before it.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng, { words: { gte: this._config.minWords } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		return {
			answer: window[window.length - 1].participant.name,
			choices: rng.shuffle([...getMetadata().participant.distinctNames]),
			messages: window.map(convertMessage),
			variant: 'who'
		};
	}
}
