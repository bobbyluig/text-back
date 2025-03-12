<script lang="ts">
	import ContentAudio from '$lib/components/ContentAudio.svelte';
	import ContentImage from '$lib/components/ContentImage.svelte';
	import ContentLink from '$lib/components/ContentLink.svelte';
	import ContentText from '$lib/components/ContentText.svelte';
	import ContentVideo from '$lib/components/ContentVideo.svelte';
	import { type RenderedChatMessage } from '$lib/render';
	import { fade, slide } from 'svelte/transition';

	interface Props {
		animate: boolean;
		message: RenderedChatMessage;
		recipient: string;
	}

	const { animate, message, recipient }: Props = $props();
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
			<span>{message.mask.platform ? 'Platform Hidden' : message.platform}</span>
			<span> · </span>
			<span>{message.mask.date ? 'Date Hidden' : message.date}</span>
		</div>
	</div>
	<div
		class="rounded-2xl max-w-[70%] relative break-words
		{isSender ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}"
	>
		{#if message.mask.content}
			<ContentText data={'Message Hidden'} />
		{:else if message.content.type === 'audio'}
			<ContentAudio data={message.content.data} />
		{:else if message.content.type === 'image'}
			<ContentImage data={message.content.data} />
		{:else if message.content.type === 'link'}
			<ContentLink data={message.content.data} />
		{:else if message.content.type === 'video'}
			<ContentVideo data={message.content.data} />
		{:else}
			<ContentText data={message.content.data} />
		{/if}

		{#if reaction}
			<div
				class="absolute -bottom-4 bg-white rounded-full px-1.5 py-0.5 shadow-md text-sm text-black
				{isSender ? 'left-0' : 'right-0'}"
				in:fade={{ duration: animate ? 150 : 0 }}
			>
				{message.mask.reaction ? '⬛' : reaction}
			</div>
		{/if}
	</div>
</div>
