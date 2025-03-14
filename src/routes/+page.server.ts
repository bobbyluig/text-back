import type { PageServerLoad } from './$types';
import { PROPOSAL } from '$env/static/private';
import type { Question } from '$lib/question';

export const ssr = false;

export const load: PageServerLoad = async (): Promise<{ proposal?: Question }> => {
	return { proposal: PROPOSAL === '' ? undefined : JSON.parse(PROPOSAL) };
};
