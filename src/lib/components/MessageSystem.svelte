<script lang="ts">
	interface Props {
		message: string;
	}

	const { message }: Props = $props();
</script>

<div>{message}</div>
