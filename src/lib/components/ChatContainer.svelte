<script lang="ts">
	import { generateQuestionMask, type Question } from '$lib/question';
	import ChatFooter from './ChatFooter.svelte';
	import ChatHeader from './ChatHeader.svelte';
	import MessageParticipant from './MessageParticipant.svelte';

	interface Props {
		question: Question;
	}

	const { question }: Props = $props();
	const mask = generateQuestionMask(question);

	let participantMessages = $state([]);
	let systemMessages = $state([]);

	let score = $state(0);
	let streak = $state(0);

	function markAnswerCorrect() {
		score++;
		streak++;
	}

	function markAnswerIncorrect() {
		streak = 0;
	}
</script>

<div class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col">
	<ChatHeader {mask} recipient={question.recipient} {score} {streak} />

	<div class="flex-1 overflow-x-scroll p-4 flex flex-col gap-4 scrollbar-none">
		{#each question.messages as message, index}
			<MessageParticipant mask={mask.messages[index]} {message} recipient={question.recipient} />
		{/each}
	</div>

	<ChatFooter />
</div>
