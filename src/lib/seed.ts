import { Random } from '$lib/random';

/**
 * The URL parameter associated with seed.
 */
const PARAM_NAME_SEED = 'seed';

/**
 * The seed length to use when generating.
 */
const SEED_LENGTH = 16;

/**
 * Gets the existing seed from the URL or generates a new seed and updates the URL.
 */
export function getSeedFromUrl(): string {
	const params = new URLSearchParams(window.location.search);

	const maybeSeed = params.get(PARAM_NAME_SEED);
	if (maybeSeed !== null) {
		return maybeSeed;
	}

	const seed = new Random().string(SEED_LENGTH);
	params.set(PARAM_NAME_SEED, seed);
	window.location.search = params.toString();
	return seed;
}
