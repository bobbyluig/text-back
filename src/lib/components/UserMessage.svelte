<script lang="ts">
	import type { QuestionMessage } from '$lib/question';

	// Unpack props and compute derived attributes.
	const { message, recipient }: { message: QuestionMessage; recipient: string } = $props();
	const isSelf = message.participant !== recipient;

	// Returns a string version of the date for displaying as part of a message.
	function formatDate(date: Date): string {
		return date.toLocaleTimeString('en-us', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div
	class="grid
	{isSelf ? 'justify-items-end' : 'justify-items-start'} 
	{message.reaction ? 'mb-4' : ''}"
>
	<div class="text-xs text-gray-500 mb-1">
		<div>Messenger · {formatDate(message.date)}</div>
	</div>
	<div
		class="
			rounded-2xl px-4 py-2 max-w-[70%] relative group break-words
			{isSelf ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}
			"
	>
		{message.content}
		{#if message.reaction}
			<div
				class="absolute -bottom-4 bg-white rounded-full px-1.5 py-0.5 shadow-md text-sm
				{isSelf ? 'left-0' : 'right-0'}"
			>
				{message.reaction}
			</div>
		{/if}
	</div>
</div>
