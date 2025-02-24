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
	 * Returns a random element from the given array. Throw an error if the array is empty.
	 */
	choice<T>(array: Array<T>): T {
		if (array.length === 0) {
			throw new RangeError('Array must be non-empty');
		}
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

	/**
	 * Returns a random float in the range [start, end);
	 */
	uniform(start: number, end: number): number {
		return this.rng() * (end - start) + start;
	}
}
