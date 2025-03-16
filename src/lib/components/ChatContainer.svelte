<script lang="ts">
	import ChatFooter from '$lib/components/ChatFooter.svelte';
	import ChatHeader from '$lib/components/ChatHeader.svelte';
	import Message from '$lib/components/ChatMessage.svelte';
	import { sleep, type RenderedChat, type RenderedChatMessage } from '$lib/render';
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

	/**
	 * Animates messages in the chat.
	 */
	async function animateMessages(): Promise<void> {
		// If animations are disabled (revealing the chat), immediately set everything.
		if (!animate) {
			messages.push(...chat.messages);
			description = chat.description;
			return;
		}

		// We add messages with a one second delay if they do not contain a reaction, and a two second
		// delay if they do have a reaction. The initial delay is to account for the fade in from the
		// chat container. Note that the message is first mounted, but begins its transition one second
		// later intentionally to allow preloading. This is particularly necessary for videos.
		await sleep(400);
		for (const message of chat.messages) {
			messages.push(message);
			await sleep(message.reaction ? 2000 : 1000);
		}

		// For consistency, wait one second before showing the question description, and wait one more
		// second before allowing user input.
		await sleep(1000);
		description = chat.description;
		await sleep(1000);
	}

	// Enable the input after completing message animation.
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
