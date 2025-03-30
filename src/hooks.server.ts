import { dev } from '$app/environment';
import { Random } from '$lib/random';
import { computeMetadata } from '$lib/server/metadata';
import { invokeModel } from '$lib/server/model';
import type { ServerInit } from '@sveltejs/kit';

/**
 * Initializes the server by computing metadata.
 */
export const init: ServerInit = async () => {
	await Promise.all([computeMetadata(), ...(!dev ? [invokeModel(new Random(), '')] : [])]);
};
