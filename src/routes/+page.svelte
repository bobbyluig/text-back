<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import { QuestionBank, type Question } from '$lib/question';

	const questionBank = new QuestionBank({ initialSeed: '13', maxCacheSize: 1 });

	let question: Question | undefined = $state();
	questionBank.getQuestion().then((q) => {
		question = q;
	});
</script>

<main
	class="flex justify-center items-center min-h-screen bg-gradient-to-r from-emerald-500 to-emerald-900"
>
	{#if question}
		<ChatContainer {question} />
	{/if}
</main>
