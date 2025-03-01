<script lang="ts">
	let response: any = null;

	function helloWorld() {
		return fetch('/api?' + new URLSearchParams({ seed: '' }).toString()).then((res) => res.text());
	}

	async function handleClick() {
		response = await helloWorld();
	}
</script>

<h1 class="text-3xl font-bold underline">Hello world!</h1>

<button on:click={handleClick}>Get Data</button>
{#if response}
	<p class="font-mono">{response}</p>
{/if}

<style lang="postcss">
	@reference "tailwindcss/theme";

	:global(html) {
		background-color: theme(--color-gray-100);
	}
</style>
