<script lang="ts">
	import { generateQuestionMask, type Question } from '$lib/question';
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

	let participantMessages = $state(question.messages);
	let systemMessages = $state([]);
</script>

<div class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col">
	<ChatHeader {mask} recipient={question.recipient} {score} {streak} />

	<div class="flex-1 overflow-x-scroll p-4 flex flex-col gap-4 scrollbar-none">
		{#each participantMessages as message, index}
			<MessageParticipant mask={mask.messages[index]} {message} recipient={question.recipient} />
		{/each}

		{#each systemMessages as message}
			<MessageSystem {message} />
		{/each}
	</div>

	<ChatFooter />
</div>
