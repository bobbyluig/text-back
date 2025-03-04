<script lang="ts">
	const { content }: { content: string } = $props();
	const isLink = content.startsWith('http://') || content.startsWith('https://');
</script>

{#if isLink}
	<a href={content} target="_blank" style="underline">{content}</a>
{:else}
	<span>{content}</span>
{/if}
