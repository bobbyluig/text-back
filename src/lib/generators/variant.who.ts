import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	RETRY_GENERATION,
	type VariantGenerator
} from '$lib/generators/variant';
import { Random } from '$lib/random';
import { getServerState } from '$lib/server';
import type { Question } from '$lib/types';
import { resolve } from 'path';

/**
 * The config for the who variant generator.
 */
export type WhoVariantConfig = {
	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages: number;

	/**
	 * The minimum number of messages in the question. This must be at least 2 since we need a message
	 * and a response.
	 */
	minMessages: number;

	/**
	 * The minimum number of words in the anchor message. Messages that are too short are likely too
	 * hard to guess.
	 */
	minWords: number;
};

/**
 * Generator for a who variant question.
 */
export class WhoVariantGenerator implements VariantGenerator {
	/**
	 * Config for the who variant generator.
	 */
	private readonly _config: WhoVariantConfig;

	/**
	 * Creates a new who variant generator with the given config.
	 */
	constructor(config?: WhoVariantConfig) {
		this._config = config ?? {
			maxMessages: 10,
			minMessages: 3,
			minWords: 3
		};
	}

	/**
	 * Generates a who variant question.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng, { words: { gte: this._config.minWords } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ lte: anchor.timestamp }, windowSize);

		if (window[window.length - 1].text !== anchor.text) {
			throw RETRY_GENERATION;
		}

		const answer = window[window.length - 1].participant.name;
		const choices = [...getServerState().metadata.participant.distinctNames];

		return {
			answer,
			choices: rng.shuffle(choices),
			messages: window.map(convertMessage),
			variant: 'who'
		};
	}
}
