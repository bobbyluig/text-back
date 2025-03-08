<script lang="ts">
	import type { QuestionMask } from '$lib/question';

	interface Props {
		mask: QuestionMask;
		recipient: string;
		score: number;
		streak: number;
	}
	const { mask, recipient, score, streak }: Props = $props();
</script>

<div class="px-4 py-2 bg-gray-100 rounded-t-3xl text-center shadow-md">
	<div class="text-xl font-semibold text-gray-800">
		{mask.recipient ? 'Recipient Hidden' : recipient}
	</div>
	<div class="text-xs text-gray-500">
		Score: {score} · Streak: {streak}
	</div>
</div>
