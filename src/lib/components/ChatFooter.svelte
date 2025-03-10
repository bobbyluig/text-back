<script lang="ts">
	import { slide } from 'svelte/transition';
	import IconSend from '~icons/material-symbols/send';

	interface Props {
		animate: boolean;
		choices: Array<string>;
		disabled: boolean;
		description: string;
		submit: (answer: string) => void;
	}

	const { animate, choices, disabled, description, submit }: Props = $props();

	let answerIndex: number = $state(0);

	function changeAnswer() {
		if (choices.length > 1) {
			answerIndex = (answerIndex + 1) % choices.length;
		}
	}

	function submitAnswer() {
		submit(choices[answerIndex]);
	}

	function typewriter(node: HTMLElement, { speed = 1 }: { speed?: number }) {
		const text = node.textContent ?? '';
		const characters = Array.from(text);
		return {
			duration: characters.length / (speed * 0.01),
			tick: (t: number) => {
				const i = Math.trunc(characters.length * t);
				node.textContent = characters.slice(0, i).join('');
			}
		};
	}
</script>

<div class="p-4 bg-white rounded-b-3xl">
	{#if description}
		<div class="mb-1 text-gray-500 text-xs" in:slide={{ duration: animate ? 400 : 0 }}>
			{description}
		</div>
	{/if}
	<div class="flex items-center gap-2">
		<button
			class="flex-1 rounded-2xl px-4 py-2 text-left cursor-pointer disabled:cursor-default bg-gray-200 text-gray-800"
			{disabled}
			onclick={changeAnswer}
		>
			{#if disabled}
				&nbsp;
			{:else if choices.length === 1}
				<span>{choices[0]}</span>
			{:else}
				<span class="text-gray-800">
					{`(${answerIndex + 1}/${choices.length})`}
				</span>
				{#key answerIndex}
					<span in:typewriter|global={{ speed: 2 }}>{choices[answerIndex]}</span>
				{/key}
			{/if}
		</button>
		<button
			class="bg-green-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-green-600 transition-colors disabled:bg-gray-200 cursor-pointer disabled:cursor-default"
			{disabled}
			onclick={submitAnswer}
		>
			<IconSend />
		</button>
	</div>
</div>
