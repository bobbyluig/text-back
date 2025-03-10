<script lang="ts">
	import ChatFooter from '$lib/components/ChatFooter.svelte';
	import ChatHeader from '$lib/components/ChatHeader.svelte';
	import Message from '$lib/components/ChatMessage.svelte';
	import type { RenderedChat, RenderedChatMessage } from '$lib/render';
	import { fade } from 'svelte/transition';

	interface Props {
		chat: RenderedChat;
		score: number;
		streak: number;
		submit: (answer: string) => void;
	}

	const { chat, score, streak, submit }: Props = $props();
	const animate = chat.choices.length > 0;

	let disabled: boolean = $state(true);
	let description: string = $state('');
	let messages: Array<RenderedChatMessage> = $state([]);

	async function animateMessages() {
		if (!animate) {
			messages.push(...chat.messages);
			description = chat.description;
			return;
		}

		for (const message of chat.messages) {
			await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			messages.push(message);
			if (message.reaction) {
				await new Promise<void>((resolve) => setTimeout(resolve, 1000));
			}
		}

		await new Promise<void>((resolve) => setTimeout(resolve, 1000));
		description = chat.description;
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
	<ChatHeader mask={chat.mask.recipient} recipient={chat.recipient} {score} {streak} />

	<div class="flex flex-col-reverse flex-1 overflow-y-scroll scrollbar-none p-4">
		<div class="grid gap-4">
			{#each messages as message}
				<Message {animate} {message} recipient={chat.recipient} />
			{/each}
		</div>
	</div>

	<ChatFooter {animate} choices={chat.choices} {description} {disabled} {submit} />
</div>
