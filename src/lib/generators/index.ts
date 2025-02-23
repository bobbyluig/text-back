import { RETRY_GENERATION } from '$lib/generators/variant';
import { generateQuestion as variantDuration } from '$lib/generators/variant.duration';
import { Random } from '$lib/random';
import type { Question, QuestionVariant } from '$lib/types';

/**
 * All question generators.
 */
const QUESTION_GENERATORS = new Map<QuestionVariant, (rng: Random) => Promise<Question>>([
	['duration', variantDuration]
]);

/**
 * All question variants.
 */
const VARIANTS = Array.from(QUESTION_GENERATORS.keys()).sort();

/**
 * Generates a question given the random state, retrying until a valid question is generated.
 */
export async function generateQuestion(rng: Random): Promise<Question> {
	const generator = QUESTION_GENERATORS.get(rng.choice(VARIANTS));
	if (generator === undefined) {
		throw new Error('Question generator not found');
	}

	while (true) {
		try {
			return await generator(rng);
		} catch (error) {
			if (error === RETRY_GENERATION) {
				continue;
			}
			throw error;
		}
	}
}
