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
	const animate = question.variant !== 'none';
	const mask = generateQuestionMask(question);

	let disabled: boolean = $state(true);
	let participantMessages: Array<QuestionMessage> = $state([]);
	let systemMessages: Array<string> = $state([]);

	async function animateMessages() {
		if (!animate) {
			participantMessages.push(...question.messages);
			return;
		}

		for (const message of question.messages) {
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			participantMessages.push(message);
			if (message.reaction) {
				await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			}
		}

		await new Promise<void>((resolve) => setTimeout(resolve, 1000));
	}

	animateMessages().then(() => {
		disabled = false;
	});
</script>

<div
	class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col"
	in:fade={{ delay: 400 }}
	out:fade
>
	<ChatHeader mask={mask.recipient} recipient={question.recipient} {score} {streak} />

	<div class="flex flex-col-reverse flex-1 overflow-y-scroll scrollbar-none p-4">
		<div class="grid gap-4">
			{#each participantMessages as message, index}
				<MessageParticipant
					{animate}
					mask={mask.messages[index]}
					{message}
					recipient={question.recipient}
				/>
			{/each}

			{#each systemMessages as message}
				<MessageSystem {message} />
			{/each}
		</div>
	</div>

	<ChatFooter choices={question.choices} {disabled} {submit} />
</div>
