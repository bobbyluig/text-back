import { Random } from '$lib/random';
import { generateQuestion } from '$lib/server/generator';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Generates a question given the seed. If no seed is provided, a random seed will be used.
 */
export const GET: RequestHandler = async ({ url }) => {
	const seed = url.searchParams.get('seed');
	const rng = new Random(seed === '' || seed === null ? undefined : seed);
	return json(await generateQuestion(rng));
};
