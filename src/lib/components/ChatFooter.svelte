<script lang="ts">
	import { slide, typewriter } from '$lib/render';
	import type { Action } from 'svelte/action';
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

	/**
	 * Cycles through the answer, triggering the typewriter animation.
	 */
	function changeAnswer() {
		if (choices.length > 1) {
			answerIndex = (answerIndex + 1) % choices.length;
		}
	}

	/**
	 * Invokes the submit function with the currently selected answer choice. If we are revealing, we
	 * can submit anything.
	 */
	function submitAnswer() {
		submit(choices.length > 0 ? choices[answerIndex] : '');
	}

	/**
	 * Our custom slide transition for consistency when displaying the description.
	 */
	const slideTransition: Action = (node) => {
		if (animate) {
			slide(node);
		}
	};
</script>

<div class="p-4 bg-white rounded-b-3xl">
	{#if description}
		<div class="mb-1 text-gray-500 text-xs" use:slideTransition>
			{description}
		</div>
	{/if}
	<div class="flex items-center gap-2">
		<button
			class="flex-1 rounded-2xl px-4 py-2 text-left cursor-pointer disabled:cursor-default bg-gray-200 text-gray-800"
			disabled={choices.length === 0 || disabled}
			onclick={changeAnswer}
		>
			{#if choices.length === 0 || disabled}
				&nbsp;
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
