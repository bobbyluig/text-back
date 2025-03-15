import { computeMetadata } from '$lib/server/metadata';
import type { ServerInit } from '@sveltejs/kit';

/**
 * Initializes the server by computing metadata.
 */
export const init: ServerInit = async () => {
	await computeMetadata();
};
