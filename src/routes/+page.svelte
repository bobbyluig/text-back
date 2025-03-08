<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import {
		generateQuestionMask,
		QuestionBank,
		type Question,
		type QuestionMask
	} from '$lib/question';

	const questionBank = new QuestionBank({ initialSeed: '89', maxCacheSize: 1 });

	let mask: QuestionMask | undefined = $state();
	let question: Question | undefined = $state();
	let score: number = $state(0);
	let streak: number = $state(0);

	function markAnswerCorrect() {
		score++;
		streak++;
	}

	function markAnswerIncorrect() {
		streak = 0;
	}

	function submit(answer: string) {}

	questionBank.getQuestion().then((q) => {
		question = q;
		mask = generateQuestionMask(q);
	});
</script>

<main
	class="flex justify-center items-center min-h-screen bg-gradient-to-r from-fuchsia-900 to-pink-900"
>
	{#if question}
		<ChatContainer {mask} {question} {score} {streak} {submit} />
	{/if}
</main>
