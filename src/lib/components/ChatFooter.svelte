<script lang="ts">
	import IconSend from '~icons/material-symbols/send';

	interface Props {
		choices: Array<string>;
		disabled: boolean;
		submit: (answer: string) => void;
	}

	const { choices, disabled, submit }: Props = $props();

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
	<div class="flex items-center gap-2">
		<button
			class="flex-1 rounded-2xl px-4 py-2 text-left border-2 border-gray-300 cursor-pointer disabled:cursor-default"
			{disabled}
			onclick={changeAnswer}
		>
			{#if disabled}
				&nbsp;
			{:else if choices.length === 1}
				<span>{choices[0]}</span>
			{:else}
				<span class="text-gray-500">
					{`(${answerIndex + 1}/${choices.length})`}
				</span>
				{#key answerIndex}
					<span in:typewriter|global={{ speed: 2 }}>{choices[answerIndex]}</span>
				{/key}
			{/if}
		</button>
		<button
			class="bg-green-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-green-600 transition-colors disabled:bg-gray-300 cursor-pointer disabled:cursor-default"
			{disabled}
			onclick={submitAnswer}
		>
			<IconSend />
		</button>
	</div>
</div>
