import { Random } from '$lib/random';
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { SYSTEM_MESSAGE_EXTRA } from '$env/static/private';

/**
 * The local model name to use.
 */
const MODEL_NAME = 'llama3.1:8b';

/**
 * The temperature to use when invoking the model.
 */
const TEMPERATURE = 0.8;

/**
 * The base system message passed to every model call.
 */
const SYSTEM_MESSAGE_BASE = [
	'You are a helpful assistant in a game about texting.',
	'You are generating a single output given the prompt.',
	'Do not include any extra text.'
].join(' ');

/**
 * The system message passed to every model call which includes additional conversation-specific
 * and participant-specific context.
 */
const SYSTEM_MESSAGE =
	SYSTEM_MESSAGE_BASE + (SYSTEM_MESSAGE_EXTRA === '' ? '' : ` ${SYSTEM_MESSAGE_EXTRA}`);

/**
 * Generates a string list response to the given prompt using Ollama running locally. May throw an
 * error if the response is not in a valid format.
 */
export async function invokeModel(rng: Random, prompt: string): Promise<string> {
	const { text } = await generateText({
		model: ollama(MODEL_NAME),
		prompt,
		seed: rng.range(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
		temperature: TEMPERATURE,
		system: SYSTEM_MESSAGE
	});
	return text;
}
