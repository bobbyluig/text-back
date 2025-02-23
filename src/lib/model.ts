import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider';

/**
 * The local model name to use.
 */
const MODEL_NAME = 'llama3.1:8b';

/**
 * The system message passed to every model call.
 */
const SYSTEM_MESSAGE = [
	'You are a helpful assistant in a game about texting.',
	'You are tasked with generating questions.'
].join(' ');

/**
 * Generates a text response to the given prompt using Ollama running locally.
 */
export async function invokeModel(prompt: string): Promise<string> {
	const { text } = await generateText({
		model: ollama(MODEL_NAME),
		system: SYSTEM_MESSAGE,
		prompt
	});
	return text;
}
