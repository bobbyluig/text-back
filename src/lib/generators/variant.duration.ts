import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
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
	 * The maximum duration allowed as an answer or choice.
	 */
	maxDurationMs: number;

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
	 * The minimum duration allowed as an answer or choice.
	 */
	minDurationMs: number;

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
			maxDurationMs: 7 * 24 * 3600 * 1000,
			maxMessages: 10,
			maxScaleFactor: 100,
			minDurationMs: 1000,
			minMessages: 3,
			minScaleFactor: 1
		};
	}

	/**
	 * Generates a duration variant question.
	 */
	async generate(rng: Random): Promise<Question> {
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
			this._config.minDurationMs
		);

		const answer = this._makeDurationString(durationMs);
		const choices = [answer];

		const idealNumLower = rng.range(0, this._config.choices);
		for (let i = 0; i < idealNumLower; i++) {
			this._maybeAddChoice(rng, choices, durationMs, 'lower');
		}

		const idealNumHigher = this._config.choices - idealNumLower - 1;
		for (let i = 0; i < idealNumHigher; i++) {
			this._maybeAddChoice(rng, choices, durationMs, 'higher');
		}

		while (choices.length < this._config.choices) {
			this._maybeAddChoice(rng, choices, durationMs, rng.uniform(0, 1) <= 0.5 ? 'lower' : 'higher');
		}

		return {
			answer,
			choices: rng.shuffle(choices),
			messages: window.map(convertMessage),
			variant: 'duration'
		};
	}

	/**
	 * Adds a choice if it is not already in the choices array. Takes care of bounding the scale
	 * factor appropriately.
	 */
	private _maybeAddChoice(
		rng: Random,
		choices: Array<string>,
		durationMs: number,
		direction: 'lower' | 'higher'
	) {
		const scaleDownMaxFactor = Math.min(
			this._config.maxScaleFactor,
			durationMs / this._config.minDurationMs
		);
		const scaleDownMinFactor = Math.min(this._config.minScaleFactor, scaleDownMaxFactor);
		const scaleUpMaxFactor = Math.min(
			this._config.maxScaleFactor,
			this._config.maxDurationMs / durationMs
		);
		const scaleUpMinFactor = Math.min(this._config.minScaleFactor, scaleUpMaxFactor);

		const choiceMs =
			direction === 'lower'
				? durationMs / rng.uniform(scaleDownMinFactor, scaleDownMaxFactor)
				: durationMs * rng.uniform(scaleUpMinFactor, scaleUpMaxFactor);
		const choice = this._makeDurationString(choiceMs);
		if (!choices.includes(choice)) {
			choices.push(choice);
		}
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
