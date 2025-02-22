<script lang="ts">
	let response: any = null;

	function helloWorld() {
		return fetch('/api').then((res) => res.text());
	}

	async function handleClick() {
		response = await helloWorld();
	}
</script>

<button on:click={handleClick}>Get Data</button>
{#if response}
	<p>{response}</p>
{/if}
