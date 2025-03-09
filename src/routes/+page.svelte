<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import {
		generateQuestionMask,
		QuestionBank,
		type Question,
		type QuestionMask
	} from '$lib/question';

	const questionBank = new QuestionBank({ initialSeed: '17', maxCacheSize: 1 });

	let question: Question | undefined = $state();
	let score: number = $state(0);
	let streak: number = $state(0);

	function submit(answer: string) {
		if (question?.variant === 'none') {
			return;
		}

		if (answer === question?.answer) {
			score++;
			streak++;
		} else {
			streak = 0;
		}
	}

	questionBank.getQuestion().then((q) => {
		question = q;
	});
</script>

<main
	class="flex justify-center items-center min-h-screen bg-gradient-to-r from-fuchsia-900 to-pink-900"
>
	{#if question}
		<ChatContainer {question} {score} {streak} {submit} />
	{/if}
</main>
