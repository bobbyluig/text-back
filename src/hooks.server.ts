import { computeMetadata } from '$lib/server/metadata';
import type { ServerInit } from '@sveltejs/kit';

/**
 * Initializes the server. Called once on startup.
 */
export const init: ServerInit = async () => {
	await computeMetadata();
};
