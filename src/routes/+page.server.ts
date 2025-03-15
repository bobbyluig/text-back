import type { PageServerLoad } from './$types';
import { PROPOSAL } from '$env/static/private';
import type { Question } from '$lib/question';

/**
 * Disable server-side rendering because we want a single-page application.
 */
export const ssr = false;

/**
 * This primarily exists to load data stored in the environment on the backend.
 */
export const load: PageServerLoad = async (): Promise<{ proposal?: Question }> => {
	return { proposal: PROPOSAL === '' ? undefined : JSON.parse(PROPOSAL) };
};
