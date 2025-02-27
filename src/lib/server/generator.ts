import type { Question, QuestionVariant } from '$lib/question';
import { Random } from '$lib/random';
import { RETRY_GENERATION, type VariantGenerator } from '$lib/server/variant.common';
import { ContinueVariantGenerator } from '$lib/server/variant.continue';
import { DurationVariantGenerator } from '$lib/server/variant.duration';
import { PlatformVariantGenerator } from '$lib/server/variant.platform';
import { ReactVariantGenerator } from '$lib/server/variant.react';
import { WhenVariantGenerator } from '$lib/server/variant.when';
import { WhoVariantGenerator } from '$lib/server/variant.who';

/**
 * All question generators.
 */
const GENERATORS = new Map<QuestionVariant, VariantGenerator>([
	['continue', new ContinueVariantGenerator()],
	['duration', new DurationVariantGenerator()],
	['platform', new PlatformVariantGenerator()],
	['react', new ReactVariantGenerator()],
	['when', new WhenVariantGenerator()],
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
	const variant = rng.choice(VARIANTS);
	const generator = GENERATORS.get(variant);
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
