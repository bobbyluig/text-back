<script lang="ts">
	interface Props {
		href: string;
	}

	const { href }: Props = $props();
</script>

<div class="px-4 py-2">
	<a class="underline" {href} target="_blank">{href}</a>
</div>
