import { env } from '$env/dynamic/private';
import type { Question } from '$lib/question';
import type { PageServerLoad } from './$types';

/**
 * Disable server-side rendering because we want a single-page application.
 */
export const ssr = false;

/**
 * This primarily exists to load data stored in the environment on the backend.
 */
export const load: PageServerLoad = async (): Promise<{ proposal?: Question }> => {
	return { proposal: env.PROPOSAL === undefined ? undefined : JSON.parse(env.PROPOSAL) };
};
