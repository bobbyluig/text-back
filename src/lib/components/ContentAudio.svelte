<script lang="ts">
	import IconPlay from '~icons/material-symbols/play-circle';
	import IconPause from '~icons/material-symbols/pause-circle';
	import IconWaveform from '~icons/material-symbols/graphic-eq';

	interface Props {
		data: string;
	}

	const { data }: Props = $props();

	let audio: HTMLAudioElement;
	let paused = $state(true);

	/**
	 * Toggles audio playback.
	 */
	function togglePlay() {
		if (audio.paused) {
			audio.play();
			paused = false;
		} else {
			audio.pause();
			paused = true;
		}
	}

	/**
	 * Resets the audio playback state.
	 */
	function onEnded() {
		audio.currentTime = 0;
		paused = true;
	}
</script>

<div class="relative">
	<button class="flex items-center px-4 py-2 rounded-2xl cursor-pointer" onclick={togglePlay}>
		<IconWaveform class="w-10 h-10" />
		{#if paused}
			<IconPlay class="w-10 h-10" />
		{:else}
			<IconPause class="w-10 h-10" />
		{/if}
		<IconWaveform class="w-10 h-10" />
	</button>

	<audio bind:this={audio} class="hidden" onended={onEnded} preload="auto" src={data}></audio>
</div>
