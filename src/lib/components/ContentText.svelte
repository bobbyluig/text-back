<script lang="ts">
	const { content }: { content: string } = $props();
	const isLink = content.startsWith('http://') || content.startsWith('https://');
</script>

<span style={isLink ? 'underline' : ''}>{content}</span>
