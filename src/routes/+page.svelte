<script lang="ts">
	import ChatContainer from '$lib/components/ChatContainer.svelte';
	import { QuestionBank, type Question, type QuestionVariant } from '$lib/question';
	import { renderQuestion, revealChat, type RenderedChat } from '$lib/render';
	import { getSeedFromUrl } from '$lib/seed';
	import { fade } from 'svelte/transition';
	import IconSend from '~icons/material-symbols/send';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const { proposal } = data;
	console.log(proposal);

	const seed = getSeedFromUrl();
	const questionBank = new QuestionBank({ initialSeed: seed });
	const variants: Set<QuestionVariant> = new Set();

	let chat: RenderedChat | undefined = $state();
	let question: Question | undefined = $state();
	let score: number = $state(0);
	let streak: number = $state(0);
	let welcome: boolean = $state(true);

	/**
	 * Called by the child to submit an answer. This will either reveal the current chat, or go to the
	 * next question if the previous state was a revealed chat.
	 */
	function submit(answer: string): void {
		// This should not happen.
		if (chat === undefined || question === undefined) {
			return;
		}

		// When revealing the chat, we explicitly set choices to an empty list.
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

	/**
	 * Renders the next question.
	 */
	async function nextQuestion(): Promise<void> {
		// Unload the existing chat to show a loading indicator.
		chat = undefined;

		// Determines whether we should propose. We must have proposal mode enabled in the backend, the
		// player must have answered at least ten question correctly, and we must have seen all question
		// variants (excluding the proposal). We overwrite the dates in the proposal messages to now to
		// make it appear like the messages are sent in real time. The expected time to see all variants
		// is 14.7 (the coupon collector problem), which is reasonable.
		question =
			proposal === undefined || score < 10 || variants.size < 6
				? await questionBank.getQuestion()
				: {
						...proposal,
						messages: proposal.messages.map((message) => ({ ...message, date: new Date() }))
					};
		variants.add(question.variant);

		// Render the question and preload all asset to minimize layout shifts during animation.
		chat = await renderQuestion(question);
	}

	// On page load, we can already prepare the first question.
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
