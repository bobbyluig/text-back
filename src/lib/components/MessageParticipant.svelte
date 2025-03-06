<script lang="ts">
	import type { QuestionMessage, QuestionMessageMask } from '$lib/question';
	import { MessagePlatform } from '@prisma/client';
	import ContentText from './ContentText.svelte';

	const {
		mask,
		message,
		recipient
	}: { mask: QuestionMessageMask; message: QuestionMessage; recipient: string } = $props();
	const isSender = message.participant !== recipient;

	function formatDate(date: Date): string {
		return date.toLocaleTimeString('en-us', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatPlatform(platform: MessagePlatform): string {
		switch (platform) {
			case 'INSTAGRAM':
				return 'Instagram';
			case 'MESSENGER':
				return 'Messenger';
		}
	}
</script>

<div
	class="grid
	{isSender ? 'justify-items-end' : 'justify-items-start'} 
	{message.reaction ? 'mb-4' : ''}"
>
	<div class="text-xs text-gray-500 mb-1">
		<div>
			<span>{mask.platform ? 'Platform Hidden' : formatPlatform(message.platform)}</span>
			<span> · </span>
			<span>{mask.date ? 'Date Hidden' : formatDate(message.date)}</span>
		</div>
	</div>
	<div
		class="rounded-2xl px-4 py-2 max-w-[70%] relative group break-words
		{isSender ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}"
	>
		{#if !message.isMedia}
			<ContentText content={message.content} />
		{:else}
			{message.content}
		{/if}

		{#if message.reaction}
			<div
				class="absolute -bottom-4 bg-white rounded-full px-1.5 py-0.5 shadow-md text-sm
				{isSender ? 'left-0' : 'right-0'}
				{mask.reaction ? 'opacity-0' : ''}"
			>
				{message.reaction}
			</div>
		{/if}
	</div>
</div>
