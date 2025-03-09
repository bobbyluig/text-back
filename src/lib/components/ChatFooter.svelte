<script lang="ts">
	import IconSend from '~icons/material-symbols/send';

	interface Props {
		choices: Array<string>;
		submit: (answer: string) => void;
	}

	const { choices, submit }: Props = $props();

	let answer: string = $state('');

	function submitAnswer() {
		submit(answer);
	}
</script>

<div class="p-4 bg-white rounded-b-3xl">
	<div class="flex items-center gap-2">
		<button
			class="flex-1 rounded-full px-4 py-2 border disabled:border-gray-300 border-green-500 hover:border-green-600 min-h-[2.5rem]"
			disabled={true}
		>
			{answer}
		</button>
		<button
			class="bg-green-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-green-600 transition-colors disabled:bg-gray-300"
			disabled={true}
			onclick={submitAnswer}
		>
			<IconSend />
		</button>
	</div>
</div>
