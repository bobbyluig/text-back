import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	RETRY_GENERATION,
	type VariantGenerator
} from '$lib/generators/variant.common';
import { Random } from '$lib/random';
import { getServerState } from '$lib/server';
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
};

/**
 * Generator for a platform variant question. The player guesses the platform that the last message
 * in the conversation was sent from. The generation approach is to first choose a platform, then
 * select an anchor message with some text from that platform, and finally get a slice of messages
 * before it.
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
		this._config = config ?? { maxMessages: 10, minMessages: 3 };
	}

	/**
	 * Generates a platform variant question.
	 */
	async generate(rng: Random): Promise<Question> {
		const platform = rng.choice(getServerState().metadata.message.distinctPlatforms);
		const anchor = await getRandomMessage(rng, { platform, words: { gt: 1 } });
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
	 * Returns an alternative given the answer.
	 */
	private _getAlternative(rng: Random, answer: MessagePlatform): MessagePlatform {
		const allPlatforms = getServerState().metadata.message.distinctPlatforms;
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
