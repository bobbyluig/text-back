import seedrandom from 'seedrandom';

/**
 * A simple seeded random number generator with helper methods.
 */
export class Random {
	/**
	 * The underlying random number generator.
	 */
	private readonly rng: seedrandom.PRNG;

	/**
	 * Creates a new random instance with the given seed.
	 */
	constructor(seed?: string) {
		this.rng = seedrandom(seed);
	}

	/**
	 * Returns a random element from the given array. Assumes that the array is non-empty.
	 */
	choice<T>(array: Array<T>): T {
		return array[Math.floor(this.rng() * array.length)];
	}

	/**
	 * Returns a random integer in the range [start, end).
	 */
	range(start: number, end: number): number {
		return Math.floor(this.rng() * (end - start)) + start;
	}

	/**
	 * Returns a random lowercase string of the given length.
	 */
	string(length: number): string {
		const characters = 'abcdefghijklmnopqrstuvwxyz'.split('');
		return Array.from({ length }, () => this.choice(characters)).join('');
	}

	/**
	 * Shuffles the input array in place. Returns the input array.
	 */
	shuffle<T>(array: Array<T>): Array<T> {
		for (let i = array.length - 1; i >= 0; i--) {
			const j = this.range(0, i + 1);
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}
}
