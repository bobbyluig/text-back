<script lang="ts">
	import { generateQuestionMask, type Question, type QuestionMessage } from '$lib/question';
	import { fade } from 'svelte/transition';
	import ChatFooter from './ChatFooter.svelte';
	import ChatHeader from './ChatHeader.svelte';
	import MessageParticipant from './MessageParticipant.svelte';
	import MessageSystem from './MessageSystem.svelte';

	interface Props {
		question: Question;
		score: number;
		streak: number;
		submit: (answer: string) => void;
	}

	const { question, score, streak, submit }: Props = $props();
	const mask = generateQuestionMask(question);

	let messagesContainer: Element | undefined;
	let participantMessages: Array<QuestionMessage> = $state([]);
	let systemMessages: Array<string> = $state([]);

	$effect(() => {
		participantMessages.length;
		systemMessages.length;
		messagesContainer?.scroll({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
	});

	async function animateMessages() {
		for (const message of question.messages) {
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			participantMessages.push(message);
			if (message.reaction) {
				await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			}
		}
	}
	animateMessages();
</script>

<div class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col" transition:fade>
	<ChatHeader mask={mask.recipient} recipient={question.recipient} {score} {streak} />

	<div
		class="flex-1 overflow-x-scroll p-4 flex flex-col gap-4 scrollbar-none"
		bind:this={messagesContainer}
	>
		{#each participantMessages as message, index}
			<MessageParticipant mask={mask.messages[index]} {message} recipient={question.recipient} />
		{/each}

		{#each systemMessages as message}
			<MessageSystem {message} />
		{/each}
	</div>

	<ChatFooter choices={question.choices} {submit} />
</div>
