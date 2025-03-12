<script lang="ts">
	interface Props {
		src: string;
	}

	const { src }: Props = $props();
</script>

<img {src} alt={src} class="w-full h-full rounded-2xl max-h-[200px]" />
