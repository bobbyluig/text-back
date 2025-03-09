<script lang="ts">
	import type { QuestionMessage, QuestionMessageMask } from '$lib/question';
	import { renderPlatform, renderTime } from '$lib/render';
	import { fade, slide } from 'svelte/transition';
	import ContentText from './ContentText.svelte';

	interface Props {
		animate: boolean;
		mask: QuestionMessageMask;
		message: QuestionMessage;
		recipient: string;
	}

	const { animate, mask, message, recipient }: Props = $props();
	const isSender = message.participant !== recipient;

	let reaction: string = $state('');
	setTimeout(
		() => {
			reaction = message.reaction;
		},
		animate ? 1000 : 0
	);
</script>

<div
	class="grid
	{animate ? 'transition-[margin]' : ''}
	{isSender ? 'justify-items-end' : 'justify-items-start'} 
	{reaction ? 'mb-4' : ''}"
	in:slide={{ duration: animate ? 400 : 0 }}
>
	<div class="text-xs text-gray-500 mb-1">
		<div>
			<span>{mask.platform ? 'Platform Hidden' : renderPlatform(message.platform)}</span>
			<span> · </span>
			<span>{mask.date ? 'Date Hidden' : renderTime(message.date)}</span>
		</div>
	</div>
	<div
		class="rounded-2xl px-4 py-2 max-w-[70%] relative group break-words
		{isSender ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}"
	>
		{#if mask.content}
			<ContentText content={'Message Hidden'} />
		{:else if !message.isMedia}
			<ContentText content={message.content} />
		{:else}
			{message.content}
		{/if}

		{#if reaction}
			<div
				class="absolute -bottom-4 bg-white rounded-full px-1.5 py-0.5 shadow-md text-sm text-black
				{isSender ? 'left-0' : 'right-0'}"
				in:fade={{ duration: animate ? 150 : 0 }}
			>
				{mask.reaction ? '⬛' : reaction}
			</div>
		{/if}
	</div>
</div>
