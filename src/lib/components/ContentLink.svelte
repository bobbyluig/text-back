<script lang="ts">
	interface Props {
		data: string;
	}

	const { data }: Props = $props();
</script>

<div class="px-4 py-2">
	<a class="underline" href={data} target="_blank">{data}</a>
</div>
