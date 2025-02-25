import { Random } from '$lib/random';
import { getMetadata } from '$lib/server/metadata';
import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	type VariantGenerator
} from '$lib/server/variant.common';
import type { Question } from '$lib/types';
import { MessagePlatform } from '@prisma/client';

/**
 * The config for the platform variant generator.
 */
export type PlatformVariantConfig = {
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
	 * easy (e.g., a link) or too hard (e.g., a single reaction) to guess.
	 */
	minWords: number;
};

/**
 * Generator for a platform variant question. The player guesses the platform that the last message
 * in the conversation was sent from.
 */
export class PlatformVariantGenerator implements VariantGenerator {
	/**
	 * Config for the platform variant generator.
	 */
	private readonly _config: PlatformVariantConfig;

	/**
	 * Creates a new platform variant generator with the given config.
	 */
	constructor(config?: PlatformVariantConfig) {
		this._config = config ?? { maxMessages: 10, minMessages: 3, minWords: 2 };
	}

	/**
	 * Generates a platform variant question. The approach is to first choose a platform, then select
	 * an anchor message with some text from that platform (ignoring very short messages like links),
	 * and finally get a slice of messages before it.
	 */
	async generate(rng: Random): Promise<Question> {
		const platform = rng.choice(getMetadata().message.distinctPlatforms);
		const anchor = await getRandomMessage(rng, { platform, words: { gte: this._config.minWords } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		const answer = window[window.length - 1].platform;
		const choices = [answer, this._getAlternative(rng, answer)];

		return {
			answer: this._mapPlatform(answer),
			choices: rng.shuffle(choices).map(this._mapPlatform),
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

	/**
	 * Maps an enum platform name to its display representation. The client is generally unaware of
	 * the concept of platforms during rendering.
	 */
	private _mapPlatform(platform: MessagePlatform): string {
		switch (platform) {
			case MessagePlatform.INSTAGRAM:
				return 'Instagram';
			case MessagePlatform.MESSENGER:
				return 'Messenger';
			default:
				throw new Error(`Unknown platform: ${platform}`);
		}
	}
}
