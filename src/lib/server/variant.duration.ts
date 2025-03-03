import type { Question } from '$lib/question';
import { Random } from '$lib/random';
import {
	convertMessage,
	getMessageSlice,
	getRandomMessage,
	otherParticipant,
	RETRY_GENERATION,
	type VariantGenerator
} from '$lib/server/variant.common';
import humanizeDuration from 'humanize-duration';

/**
 * The config for the duration variant generator.
 */
export type DurationVariantConfig = {
	/**
	 * The number of additional messages to query for in the initial window to increase the likelihood
	 * that a participant transition can be found.
	 */
	bufferMessages?: number;

	/**
	 * The maximum duration allowed as an answer or choice.
	 */
	maxDurationMs?: number;

	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages?: number;

	/**
	 * The maximum scale factor to apply to the answer when generating the alternative. This applies
	 * to both scaling up and scaling down.
	 */
	maxScaleFactor?: number;

	/**
	 * The minimum duration allowed as an answer or choice.
	 */
	minDurationMs?: number;

	/**
	 * The minimum number of messages in the question. This must be at least two since we need a
	 * message and a response.
	 */
	minMessages?: number;

	/**
	 * The minimum scale factor to apply to the answer when generating the alternative. This applies
	 * to both scaling up and scaling down.
	 */
	minScaleFactor?: number;
};

/**
 * Generator for a duration variant question. The player guesses the duration between the last two
 * messages in the conversation.
 */
export class DurationVariantGenerator implements VariantGenerator {
	/**
	 * Config for the duration variant generator.
	 */
	private readonly _config: Required<DurationVariantConfig>;

	/**
	 * Creates a new duration variant generator with the given config.
	 */
	constructor(config?: DurationVariantConfig) {
		this._config = {
			bufferMessages: config?.bufferMessages ?? 10,
			maxDurationMs: config?.maxDurationMs ?? 7 * 24 * 3600 * 1000,
			maxMessages: config?.maxMessages ?? 10,
			maxScaleFactor: config?.maxScaleFactor ?? 100,
			minDurationMs: config?.minDurationMs ?? 1000,
			minMessages: config?.minMessages ?? 3,
			minScaleFactor: config?.minScaleFactor ?? 1
		};
	}

	/**
	 * Generates a duration variant question. The approach is to get a random slice of messages, and
	 * find a fixed size window where the last two messages change participants.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng);
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const expandedWindow = await getMessageSlice(
			{ start: anchor },
			windowSize + this._config.bufferMessages
		);

		let found = false;
		let startIndex = 0;
		for (; startIndex < expandedWindow.length - windowSize; startIndex++) {
			if (
				expandedWindow[startIndex + windowSize - 1].participant.name !==
				expandedWindow[startIndex + windowSize - 2].participant.name
			) {
				found = true;
				break;
			}
		}
		if (!found) {
			throw RETRY_GENERATION;
		}
		const window = expandedWindow.slice(startIndex, startIndex + windowSize);

		const answer = Math.max(
			window[window.length - 1].timestamp.getTime() - window[window.length - 2].timestamp.getTime(),
			this._config.minDurationMs
		);
		const alternative = this._getAlternative(rng, answer);

		return {
			answer: this._makeDurationString(answer),
			choices: rng.shuffle([answer, alternative]).map(this._makeDurationString),
			messages: window.map(convertMessage),
			recipient: otherParticipant(window[window.length - 1].participant.name),
			variant: 'duration'
		};
	}

	/**
	 * Returns an alternative given the answer. The alternative is some factor from the answer, and is
	 * guaranteed to have a distinct humanized representation.
	 */
	private _getAlternative(rng: Random, answer: number): number {
		const scaleDownMaxFactor = Math.min(
			this._config.maxScaleFactor,
			answer / this._config.minDurationMs
		);
		const scaleDownMinFactor = Math.min(this._config.minScaleFactor, scaleDownMaxFactor);
		const scaleUpMaxFactor = Math.min(
			this._config.maxScaleFactor,
			this._config.maxDurationMs / answer
		);
		const scaleUpMinFactor = Math.min(this._config.minScaleFactor, scaleUpMaxFactor);

		while (true) {
			const alternative = rng.boolean()
				? answer / rng.uniform(scaleDownMinFactor, scaleDownMaxFactor)
				: answer * rng.uniform(scaleUpMinFactor, scaleUpMaxFactor);
			if (this._makeDurationString(alternative) !== this._makeDurationString(answer)) {
				return alternative;
			}
		}
	}

	/**
	 * Converts a duration in milliseconds to a consistent human-readable string.
	 */
	private _makeDurationString(durationMs: number): string {
		return humanizeDuration(durationMs, { largest: 1, round: true });
	}
}
