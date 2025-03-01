import type { Question } from '$lib/question';
import { Random } from '$lib/random';
import { getMetadata } from '$lib/server/metadata';
import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	type VariantGenerator
} from '$lib/server/variant.common';
import { MessagePlatform } from '@prisma/client';

/**
 * The config for the platform variant generator.
 */
export type PlatformVariantConfig = {
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
 * Generator for a platform variant question. The player guesses the platform that the last message
 * in the conversation was sent from.
 */
export class PlatformVariantGenerator implements VariantGenerator {
	/**
	 * Config for the platform variant generator.
	 */
	private readonly _config: Required<PlatformVariantConfig>;

	/**
	 * Creates a new platform variant generator with the given config.
	 */
	constructor(config?: PlatformVariantConfig) {
		this._config = {
			maxMessages: config?.maxMessages ?? 10,
			minMessages: config?.minMessages ?? 3,
			minWords: config?.minWords ?? 2
		};
	}

	/**
	 * Generates a platform variant question. The approach is to first randomly choose a platform,
	 * then get a random anchor message with some text from that platform (ignoring short messages
	 * like links), and finally get a slice of messages before it.
	 */
	async generate(rng: Random): Promise<Question> {
		const platform = rng.choice(getMetadata().message.distinctPlatforms);
		const anchor = await getRandomMessage(rng, { platform, words: { gte: this._config.minWords } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		const answer = window[window.length - 1].platform;
		const alternative = this._getAlternative(rng, answer);

		return {
			answer,
			choices: rng.shuffle([answer, alternative]),
			messages: window.map(convertMessage),
			variant: 'platform'
		};
	}

	/**
	 * Returns an alternative given the answer. The alternative is a random platform from the set of
	 * all imported platforms that is different from the answer.
	 */
	private _getAlternative(rng: Random, answer: MessagePlatform): MessagePlatform {
		const allPlatforms = getMetadata().message.distinctPlatforms;
		return rng.choice(allPlatforms.filter((platform) => platform !== answer));
	}
}
