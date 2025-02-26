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
 * The config for the when variant generator.
 */
export type WhenVariantConfig = {
	/**
	 * The maximum number of days to change when generating an alternative.
	 */
	maxDeltaDays: number;

	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages: number;

	/**
	 * The minimum number of days to change when generating an alternative.
	 */
	minDeltaDays: number;

	/**
	 * The minimum number of messages in the question.
	 */
	minMessages: number;
};

/**
 * Generator for a when variant question. The player guesses the date that the last message was
 * sent on.
 */
export class WhenVariantGenerator implements VariantGenerator {
	/**
	 * Config for the when variant generator.
	 */
	private readonly _config: WhenVariantConfig;

	/**
	 * Creates a new when variant generator with the given config.
	 */
	constructor(config?: WhenVariantConfig) {
		this._config = config ?? {
			maxDeltaDays: 365,
			maxMessages: 10,
			minDeltaDays: 1,
			minMessages: 3
		};
	}

	/**
	 * Generates a when variant question. The approach is to find a random anchor message and choose
	 * a random of slice of messages after it. There are no message restrictions for t his variant.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng);
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ start: anchor }, windowSize);

		const answer = window[window.length - 1].timestamp;
		const alternative = this._getAlternative(rng, answer);

		return {
			answer: this._getDateString(answer),
			choices: rng.shuffle([answer, alternative]).map(this._getDateString),
			messages: window.map(convertMessage),
			variant: 'when'
		};
	}

	/**
	 * Returns the string representation of the date for rendering.
	 */
	private _getDateString(date: Date): string {
		return date.toLocaleDateString('en-us', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	/**
	 * Returns an alternative given the answer. The alternative is some delta from the answer, and is
	 * guaranteed to be within the range of all possible messages.
	 */
	private _getAlternative(rng: Random, answer: Date): Date {
		const msPerDay = 24 * 3600 * 1000;

		const minDeltaDays = Math.max(
			this._config.minDeltaDays,
			(answer.getTime() - getMetadata().message.startDate.getTime()) / msPerDay
		);
		const maxDeltaDays = Math.min(
			this._config.maxDeltaDays,
			(getMetadata().message.endDate.getTime() - answer.getTime()) / msPerDay
		);

		const delta = rng.range(minDeltaDays, maxDeltaDays + 1);
		return new Date(answer.getTime() + delta * msPerDay);
	}
}
