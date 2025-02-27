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
	 * Generates a react variant question. The approach is to get a random anchor message with a
	 * reaction, then get a slice of messages before it.
	 */
	async generate(rng: Random): Promise<Question> {
		const anchor = await getRandomMessage(rng, { reactions: { some: {} } });
		const windowSize = rng.range(this._config.minMessages, this._config.maxMessages + 1);
		const window = await getMessageSlice({ end: anchor }, windowSize);

		const answer = window[window.length - 1].reactions[0].reaction;
		const alternative = await this._getAlternative(rng, answer, window);

		return {
			answer,
			choices: rng.shuffle([answer, alternative]),
			messages: window.map(convertMessage),
			variant: 'react'
		};
	}

	/**
	 * Returns an alternative given the answer and the sequence of messages. It uses a model to pick
	 * the most contextually relevant emoji.
	 */
	private async _getAlternative(
		rng: Random,
		answer: string,
		window: Array<DatabaseMessage>
	): Promise<string> {
		const instructions = [
			'You will be given a sequence of messages in <messages></messages>.',
			'Each line begins with the participant name, followed by the message.',
			'The message may contain the <media/> tag to indicate that it is a media message.',
			'You will be given a reaction to the last message in <reaction></reaction>.',
			'You will be given a set of commonly used reactions in <reactions></reactions>.',
			'Provide an alternative reaction to the one in the last message.',
			'Try to only choose from the given reactions.',
			'Take into account the context of the messages and the existing reaction.'
		].join(' ');
		const prompt = [
			instructions,
			'',
			'<messages>',
			window
				.map((message) => `${message.participant.name}: ${message.text || '<media/>'}`)
				.join('\n'),
			'</messages>',
			'',
			'<reaction>',
			answer,
			'</reaction>',
			'',
			'<reactions>',
			getMetadata().reaction.distinctReactions.join('\n'),
			'</reactions>'
		].join('\n');

		const alternative = await invokeModel(rng, prompt);
		if (
			alternative === answer ||
			[...alternative].length !== 1 ||
			!/\p{Extended_Pictographic}/u.test(alternative)
		) {
			throw RETRY_GENERATION;
		}

		return alternative;
	}
}
