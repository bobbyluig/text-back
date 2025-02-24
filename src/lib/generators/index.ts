import { RETRY_GENERATION, type VariantGenerator } from '$lib/generators/variant.common';
import { DurationVariantGenerator } from '$lib/generators/variant.duration';
import { PlatformVariantGenerator } from '$lib/generators/variant.platform';
import { WhoVariantGenerator } from '$lib/generators/variant.who';
import { Random } from '$lib/random';
import type { Question, QuestionVariant } from '$lib/types';

/**
 * All question generators.
 */
const GENERATORS = new Map<QuestionVariant, VariantGenerator>([
	['duration', new DurationVariantGenerator()],
	['platform', new PlatformVariantGenerator()],
	['who', new WhoVariantGenerator()]
]);

/**
 * All question variants.
 */
const VARIANTS = Array.from(GENERATORS.keys()).sort();

/**
 * Generates a question given the random state, retrying until a valid question is generated.
 */
export async function generateQuestion(rng: Random): Promise<Question> {
	const generator = GENERATORS.get(rng.choice(VARIANTS));
	if (generator === undefined) {
		throw new Error('Generator is undefined');
	}

	while (true) {
		try {
			return await generator.generate(rng);
		} catch (error) {
			if (error === RETRY_GENERATION) {
				continue;
			}
			throw error;
		}
	}
}
