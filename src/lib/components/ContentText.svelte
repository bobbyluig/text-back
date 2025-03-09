<script lang="ts">
	interface Props {
		content: string;
	}

	const { content }: Props = $props();
	const isLink = content.startsWith('http://') || content.startsWith('https://');
</script>

{#if isLink}
	<a class="underline" href={content} target="_blank">{content}</a>
{:else}
	<span>{content}</span>
{/if}
