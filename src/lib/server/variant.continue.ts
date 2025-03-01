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
 * The config for the continue variant generator.
 */
export type ContinueVariantConfig = {
	/**
	 * The maximum number of messages in the question.
	 */
	maxMessages?: number;

	/**
	 * The minimum number of messages in the question. This must be at least two since we need a
	 * message before the one that is to be guessed.
	 */
	minMessages?: number;
};

/**
 * Generator for a continue variant question. The player guesses the next message in the conversation
 * given some previous messages.
 */
export class ContinueVariantGenerator implements VariantGenerator {
	/**
	 * Config for the continue variant generator.
	 */
	private readonly _config: Required<ContinueVariantConfig>;

	/**
	 * Creates a new continue variant generator with the given config.
	 */
	constructor(config?: ContinueVariantConfig) {
		this._config = {
			maxMessages: config?.maxMessages ?? 10,
			minMessages: config?.minMessages ?? 3
		};
	}

	/**
	 * Generates a continue variant question. The approach is to get a random anchor message with some
	 * text (ignoring short messages like links). Then get a slice of messages before it.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng, { words: { gt: 1 } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		const answer = window[window.length - 1].text;
		const alternative = await this._getAlternative(rng, answer, window);

		return {
			answer,
			choices: rng.shuffle([answer, alternative]),
			messages: window.map(convertMessage),
			variant: 'continue'
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
		const instructions = [
			'You will be given a list of messages in <messages></messages>.',
			'Each line begins with the participant name, followed by the message.',
			'The message may contain the <media/> tag to indicate that it is a media message.',
			'Provide an alternative to the last message, matching the surrounding style and tone.',
			'The alternative must be similar to the last message.',
			'The alternative must only consist of text.',
			'Do not include links or the <media/> tag.',
			'Do not include the participant name.',
			'Do not include any new lines.',
			'Keep the alternative informal, potentially omitting punctuation as necessary.',
			'Remember that you are not responding to the last message, only giving an alternative to it.'
		].join(' ');
		const prompt = [
			instructions,
			'',
			'<messages>',
			window
				.map((message) => `${message.participant.name}: ${message.text || '<media/>'}`)
				.join('\n'),
			'</messages>'
		].join('\n');

		const alternative = await invokeModel(rng, prompt);
		if (
			alternative === answer ||
			alternative.includes('\n') ||
			getMetadata().participant.distinctNames.some((name) => alternative.startsWith(`${name}:`))
		) {
			throw RETRY_GENERATION;
		}

		return alternative;
	}
}
