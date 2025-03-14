<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import { QuestionBank, type Question } from '$lib/question';
	import { renderQuestion, revealChat, type RenderedChat } from '$lib/render';
	import { fade } from 'svelte/transition';
	import IconSend from '~icons/material-symbols/send';

	const questionBank = new QuestionBank({ initialSeed: '' });

	let chat: RenderedChat | undefined = $state();
	let question: Question | undefined = $state();
	let score: number = $state(0);
	let streak: number = $state(0);
	let welcome: boolean = $state(true);

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
		chat = c;
		question = q;
	}
	nextQuestion();
</script>

<main
	class="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-fuchsia-900 to-pink-900"
>
	{#if welcome}
		<div class="absolute">
			<button
				class="text-6xl text-white flex items-center cursor-pointer gap-2 px-4 py-2 rounded-2xl transition-colors hover:bg-gray-200 hover:text-gray-800 hover:shadow-xl"
				onclick={() => {
					welcome = false;
				}}
			>
				<span>Text Back</span>
				<span><IconSend /></span>
			</button>
		</div>
	{:else}
		{#key chat}
			{#if chat}
				<div class="absolute">
					<ChatContainer {chat} {score} {streak} {submit} />
				</div>
			{:else}
				<div class="absolute">
					<div
						class="animate-spin h-10 w-10 border-4 border-white rounded-full border-t-transparent"
						in:fade|global={{ delay: 400 }}
						out:fade|global
					></div>
				</div>
			{/if}
		{/key}
	{/if}
</main>
