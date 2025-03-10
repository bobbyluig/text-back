<script lang="ts">
	interface Props {
		content: string;
	}

	const { content }: Props = $props();
</script>

<div class="px-4 py-2">{content}</div>
