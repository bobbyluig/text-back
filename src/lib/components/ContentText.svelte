<script lang="ts">
	interface Props {
		content: string;
	}

	const { content }: Props = $props();
	const isLink = content.startsWith('http://') || content.startsWith('https://');
</script>

{#if isLink}
	<div class="px-4 py-2">
		<a class="underline" href={content} target="_blank">{content}</a>
	</div>
{:else}
	<div class="px-4 py-2">
		{content}
	</div>
{/if}
