import { Random } from '$lib/random';
import { generateObject, jsonSchema } from 'ai';
import { ollama } from 'ollama-ai-provider';

/**
 * The local model name to use.
 */
const MODEL_NAME = 'llama3.1:8b';

/**
 * The temperature to use when invoking the model.
 */
const TEMPERATURE = 0.8;

/**
 * The system message passed to every model call.
 */
const SYSTEM_MESSAGE = [
	'You are a helpful assistant in a game about texting.',
	'You are tasked with generating choices.'
].join(' ');

/**
 * Generates a string list response to the given prompt using Ollama running locally. May throw an
 * error if the response is not in a valid format.
 */
export async function invokeModel(rng: Random, prompt: string): Promise<Array<string>> {
	const { object } = await generateObject({
		model: ollama(MODEL_NAME),
		output: 'array',
		prompt,
		schema: jsonSchema({ type: 'string' }),
		seed: rng.range(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
		temperature: TEMPERATURE,
		system: SYSTEM_MESSAGE
	});
	return object as Array<string>;
}
