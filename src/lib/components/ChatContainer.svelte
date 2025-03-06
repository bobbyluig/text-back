<script lang="ts">
	import type { Question, QuestionMask } from '$lib/question';
	import ChatFooter from './ChatFooter.svelte';
	import ChatHeader from './ChatHeader.svelte';
	import MessageParticipant from './MessageParticipant.svelte';

	const { question, mask }: { question: Question; mask: QuestionMask } = $props();

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

<main class="flex justify-center items-center min-h-screen bg-gray-800">
	<div class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col">
		<ChatHeader {mask} recipient={question.recipient} {score} {streak} />
		{#each question.messages as message, index}
			<MessageParticipant mask={mask.messages[index]} {message} recipient={question.recipient} />
		{/each}
		<ChatFooter />
	</div>
</main>
