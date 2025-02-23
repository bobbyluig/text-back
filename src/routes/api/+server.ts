import { Random } from '$lib/random';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateQuestion } from '$lib/generators';

/**
 * Generates a question given the seed.
 */
export const GET: RequestHandler = async ({ url }) => {
	const seed = url.searchParams.get('seed');
	const rng = new Random(seed === '' || seed === null ? undefined : seed);
	return json(await generateQuestion(rng));
};
