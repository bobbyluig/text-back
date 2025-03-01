<script lang="ts">
	import { QuestionBank } from '$lib/question';
	import { getSeedFromUrl } from '$lib/seed';

	const questionBank = new QuestionBank({ initialSeed: getSeedFromUrl() });

	let response: any = null;
	async function handleClick() {
		response = JSON.stringify(await questionBank.getQuestion());
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
