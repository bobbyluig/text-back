import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	RETRY_GENERATION,
	type VariantGenerator
} from '$lib/server/variant.common';
import { Random } from '$lib/random';
import { getMetadata } from '$lib/server/metadata';
import type { Question } from '$lib/question';
import { MessagePlatform } from '@prisma/client';

/**
 * The config for the react variant generator.
 */
export type ReactVariantConfig = {
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
 * Generator for a react variant question. The player guesses the reaction for the last message in
 * the conversation.
 */
export class ReactVariantGenerator implements VariantGenerator {
	/**
	 * Config for the react variant generator.
	 */
	private readonly _config: ReactVariantConfig;

	/**
	 * Creates a new react variant generator with the given config.
	 */
	constructor(config?: ReactVariantConfig) {
		this._config = config ?? { maxMessages: 10, minMessages: 3 };
	}

	/**
	 * Generates a react variant question. The approach is ...
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng, { reactions: { some: {} } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		const messages = window.map(convertMessage);
		const answer = messages[messages.length - 1].reaction;
		const choices = [answer, this._getAlternative(rng, answer)];

		return { answer, choices: rng.shuffle(choices), messages, variant: 'react' };
	}

	/**
	 * Returns an alternative given the answer.
	 */
	private _getAlternative(rng: Random, answer: string): string {
		return '';
	}
}
