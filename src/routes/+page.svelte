<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import { QuestionBank, type Question } from '$lib/question';
	import { preloadChat, renderQuestion, revealChat, type RenderedChat } from '$lib/render';
	import { fade } from 'svelte/transition';

	const questionBank = new QuestionBank({ initialSeed: '70', maxCacheSize: 1 });

	let chat: RenderedChat | undefined = $state();
	let question: Question | undefined = $state();
	let score: number = $state(0);
	let streak: number = $state(0);

	function submit(answer: string) {
		if (chat === undefined || question === undefined) {
			return;
		}

		if (chat.choices.length === 0) {
			nextQuestion();
		} else {
			if (answer === question.answer) {
				score++;
				streak++;
			} else {
				streak = 0;
			}
			chat = {
				...revealChat(chat),
				choices: [],
				description:
					answer === question.answer
						? 'Correct! Click send to continue.'
						: 'Incorrect. Click send to continue.'
			};
		}
	}

	async function nextQuestion() {
		chat = undefined;
		question = undefined;

		const q = await questionBank.getQuestion();
		const c = await renderQuestion(q);
		await preloadChat(c);

		chat = c;
		question = q;
	}
	// nextQuestion();
</script>

<main
	class="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-fuchsia-900 to-pink-900"
>
	<!-- <h1 class="text-6xl text-pink-300">Text Back</h1> -->

	{#key chat}
		{#if chat}
			<div class="absolute">
				<ChatContainer {chat} {score} {streak} {submit} />
			</div>
		{:else}
			<div
				class="animate-spin h-10 w-10 border-4 border-green-100 rounded-full border-t-transparent"
				in:fade|global={{ delay: 400 }}
				out:fade|global
			></div>
		{/if}
	{/key}
</main>
