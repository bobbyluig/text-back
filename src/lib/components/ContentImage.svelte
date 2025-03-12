<script lang="ts">
	interface Props {
		data: string;
	}

	const { data }: Props = $props();
</script>

<img src={data} alt={data} class="w-full h-full rounded-2xl max-h-[200px]" />
