import { Random } from '$lib/random';
import { computeMetadata } from '$lib/server/metadata';
import { invokeModel } from '$lib/server/model';
import type { ServerInit } from '@sveltejs/kit';

/**
 * Initializes the server. Computes conversation metadata and warms up the model.
 */
export const init: ServerInit = async () => {
	await computeMetadata();
	// await Promise.all([computeMetadata(), invokeModel(new Random(), '')]);
};
