<script lang="ts">
	import { getQuestionMask, type Question, type QuestionMessage } from '$lib/question';
	import { fade } from 'svelte/transition';
	import ChatFooter from './ChatFooter.svelte';
	import ChatHeader from './ChatHeader.svelte';
	import Message from './Message.svelte';

	interface Props {
		description: string;
		question: Question;
		score: number;
		streak: number;
		submit: (answer: string) => void;
	}

	const { description, question, score, streak, submit }: Props = $props();
	const animate = question.variant !== 'none';
	const mask = getQuestionMask(question);

	let disabled: boolean = $state(true);
	let maybeDescription: string = $state('');
	let messages: Array<QuestionMessage> = $state([]);

	async function animateMessages() {
		if (!animate) {
			messages.push(...question.messages);
			maybeDescription = description;
			return;
		}

		for (const message of question.messages) {
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			messages.push(message);
			if (message.reaction) {
				await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			}
		}

		await new Promise<void>((resolve) => setTimeout(resolve, 1000));
		maybeDescription = description;
		await new Promise<void>((resolve) => setTimeout(resolve, 1000));
	}

	animateMessages().then(() => {
		disabled = false;
	});
</script>

<div
	class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col"
	in:fade|global={{ delay: 400 }}
	out:fade|global
>
	<ChatHeader mask={mask.recipient} recipient={question.recipient} {score} {streak} />

	<div class="flex flex-col-reverse flex-1 overflow-y-scroll scrollbar-none p-4">
		<div class="grid gap-4">
			{#each messages as message, index}
				<Message {animate} mask={mask.messages[index]} {message} recipient={question.recipient} />
			{/each}
		</div>
	</div>

	<ChatFooter
		{animate}
		choices={question.choices}
		description={maybeDescription}
		{disabled}
		{submit}
	/>
</div>
