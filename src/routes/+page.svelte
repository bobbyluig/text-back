<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import { getQuestionDescription, QuestionBank, type Question } from '$lib/question';

	const questionBank = new QuestionBank({ initialSeed: '4', maxCacheSize: 1 });

	let description: string = $state('');
	let question: Question | undefined = $state();
	let score: number = $state(0);
	let streak: number = $state(0);

	function submit(answer: string) {
		if (question === undefined) {
			return;
		}

		if (question.variant === 'none') {
			nextQuestion();
		} else {
			if (answer === question.answer) {
				score++;
				streak++;
			} else {
				streak = 0;
			}
			description =
				answer === question.answer
					? 'Correct! Click send to continue.'
					: 'Incorrect. Click send to continue.';
			question = { ...question, answer: '\u00A0', choices: ['\u00A0'], variant: 'none' };
		}
	}

	function nextQuestion() {
		description = '';
		question = undefined;
		questionBank.getQuestion().then((q) => {
			description = getQuestionDescription(q);
			question = q;
		});
	}
	nextQuestion();
</script>

<main
	class="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-fuchsia-900 to-pink-900"
>
	<!-- <h1 class="text-6xl text-pink-300">Text Back</h1> -->

	{#if question}
		{#key question}
			<div class="absolute">
				<ChatContainer {description} {question} {score} {streak} {submit} />
			</div>
		{/key}
	{:else}
		<div
			class="animate-spin h-10 w-10 border-4 border-pink-300 rounded-full border-t-transparent"
		></div>
	{/if}
</main>
