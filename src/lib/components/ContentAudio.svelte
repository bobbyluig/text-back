<script lang="ts">
	import IconPlay from '~icons/material-symbols/play-circle';
	import IconPause from '~icons/material-symbols/pause-circle';
	import IconWaveform from '~icons/material-symbols/graphic-eq';

	interface Props {
		src: string;
	}

	const { src }: Props = $props();

	let audio: HTMLAudioElement;
	let paused = $state(true);

	function togglePlay() {
		if (audio.paused) {
			audio.play();
			paused = false;
		} else {
			audio.pause();
			paused = true;
		}
	}

	function onEnded() {
		audio.currentTime = 0;
		paused = true;
	}
</script>

<div class="relative">
	<button class="flex items-center px-4 py-2 gap-2 rounded-2xl cursor-pointer" onclick={togglePlay}>
		<div>
			{#if paused}
				<IconPlay class="w-10 h-10" />
			{:else}
				<IconPause class="w-10 h-10" />
			{/if}
		</div>
		<div class="flex items-center">
			{#each Array(3) as _}
				<IconWaveform class="w-10 h-10" />
			{/each}
		</div>
	</button>

	<audio bind:this={audio} {src} onended={onEnded} class="hidden"></audio>
</div>
