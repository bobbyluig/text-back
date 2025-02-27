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
 * The config for the next variant generator.
 */
export type NextVariantConfig = {
	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages: number;

	/**
	 * The minimum number of messages in the question. This must be at least two since we need a
	 * message before the one that is to be guessed.
	 */
	minMessages: number;
};

/**
 * Generator for a next variant question. The player guesses the next message in the conversation
 * given some previous messages.
 */
export class NextVariantGenerator implements VariantGenerator {
	/**
	 * Config for the next variant generator.
	 */
	private readonly _config: NextVariantConfig;

	/**
	 * Creates a new next variant generator with the given config.
	 */
	constructor(config?: NextVariantConfig) {
		this._config = config ?? { maxMessages: 10, minMessages: 3 };
	}

	/**
	 * Generates a next variant question. The approach is to get a random anchor message with some
	 * text (can be very short). Then get a slice of messages before it.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng, { words: { gt: 0 } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		const answer = window[window.length - 1].text;
		const alternative = await this._getAlternative(rng, answer, window);

		return {
			answer,
			choices: rng.shuffle([answer, alternative]),
			messages: window.map(convertMessage),
			variant: 'next'
		};
	}

	/**
	 * Returns an alternative given the answer and the sequence of messages. It uses a model to pick
	 * the a contextually appropriate message.
	 */
	private async _getAlternative(
		rng: Random,
		answer: string,
		window: Array<DatabaseMessage>
	): Promise<string> {
		const promptMessages = window
			.map((message) => `${message.participant.name}: ${message.text || '<media/>'}`)
			.join('\n');
		const prompt = [
			'You will be given a sequence of messages in <messages></messages>.',
			'Each line begins with the participant name, followed by the message.',
			'The message may contain the <media/> tag to indicate that it is a media message.',
			'Provide an alternative to the last message, matching the surrounding style and tone.',
			'The last message is on the line before </messages>.',
			'Assume the alternative is from the same participant as the one in the last message.',
			'The alternative must only consist of text.',
			'Do not include links or the <media/> tag.',
			'Do not include the participant name.',
			'Do not include any new lines.',
			'Keep the alternative informal, potentially omitting punctuation as necessary.',
			'',
			`<messages>\n${promptMessages}\n</messages>`
		].join('\n');

		console.log(prompt);

		const alternative = await invokeModel(rng, prompt);
		if (alternative === answer) {
			throw RETRY_GENERATION;
		}

		return alternative;
	}
}
