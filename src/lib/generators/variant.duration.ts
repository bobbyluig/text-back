import {
	convertMessage,
	getRandomMessage,
	getMessageSlice,
	RETRY_GENERATION,
	type VariantGenerator
} from '$lib/generators/variant';
import { Random } from '$lib/random';
import type { Question } from '$lib/types';
import humanizeDuration from 'humanize-duration';

/**
 * The config for the duration variant generator.
 */
export type DurationVariantConfig = {
	/**
	 * The number of choices to present to the user.
	 */
	choices: number;

	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages: number;

	/**
	 * The maximum scale factor to apply to the answer when generating choices. This applies to both
	 * scaling up and scaling down.
	 */
	maxScaleFactor: number;

	/**
	 * The minimum number of messages in the question. This must be at least 2 since we need a message
	 * and a response.
	 */
	minMessages: number;

	/**
	 * The minimum factor to apply to the answer when generating choices. This applies to both scaling
	 * up and scaling down.
	 */
	minScaleFactor: number;
};

/**
 * Generator for a duration variant question. The approach is to get a random slice of messages and
 * find a fixed size window where the last two messages change participants.
 */
export class DurationVariantGenerator implements VariantGenerator {
	/**
	 * Config for the duration variant generator.
	 */
	private readonly _config: DurationVariantConfig;

	/**
	 * Creates a new duration variant generator with the given config.
	 */
	constructor(config?: DurationVariantConfig) {
		this._config = config ?? {
			choices: 3,
			maxMessages: 10,
			maxScaleFactor: 20,
			minMessages: 3,
			minScaleFactor: 2
		};
	}

	/**
	 * Generates a duration variant question.
	 */
	async generateQuestion(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng);
		const messages = await getMessageSlice({ gte: anchor.timestamp }, 2 * this._config.maxMessages);
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);

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
		const durationMs = Math.max(
			window[window.length - 1].timestamp.getTime() - window[window.length - 2].timestamp.getTime(),
			1000
		);
		const answer = this._makeDurationString(durationMs);

		const choices = [answer];
		while (choices.length < this._config.choices) {
			const scale = rng.uniform(this._config.minScaleFactor, this._config.maxScaleFactor);
			const choiceMs = Math.max(
				rng.uniform(0, 1) <= 0.5 ? durationMs / scale : durationMs * scale,
				1000
			);
			const choice = this._makeDurationString(choiceMs);
			if (!choices.includes(choice)) {
				choices.push(choice);
			}
		}
		rng.shuffle(choices);

		return {
			answer,
			choices,
			messages: window.map(convertMessage),
			variant: 'duration'
		};
	}

	/**
	 * Converts a duration in milliseconds to a consistent human-readable string.
	 */
	private _makeDurationString(durationMs: number): string {
		return humanizeDuration(durationMs, {
			largest: 1,
			round: true
		});
	}
}
