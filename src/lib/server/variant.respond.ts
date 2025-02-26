import type { Question } from '$lib/question';
import { Random } from '$lib/random';
import { getMetadata } from '$lib/server/metadata';
import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	RETRY_GENERATION,
	type DatabaseMessage,
	type VariantGenerator
} from '$lib/server/variant.common';
import { invokeModel } from './model';

/**
 * The config for the respond variant generator.
 */
export type RespondVariantConfig = {
	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages: number;

	/**
	 * The minimum number of messages in the question.
	 */
	minMessages: number;
};

/**
 * Generator for a respond variant question. The player guesses the right response for the last
 * message in the conversation.
 */
export class RespondVariantGenerator implements VariantGenerator {
	/**
	 * Config for the respond variant generator.
	 */
	private readonly _config: RespondVariantConfig;

	/**
	 * Creates a new respond variant generator with the given config.
	 */
	constructor(config?: RespondVariantConfig) {
		this._config = config ?? { maxMessages: 10, minMessages: 3 };
	}

	/**
	 * Generates a respond variant question. The approach is ...
	 */
	async generate(rng: Random): Promise<Question> {
		return { variant: 'respond' };
	}

	/**
	 * Returns an alternative given the answer and the sequence of messages. It uses a model to pick
	 * the most contextually relevant emoji.
	 */
	private async _getAlternative(
		rng: Random,
		answer: string,
		window: Array<DatabaseMessage>
	): Promise<string> {}
}
