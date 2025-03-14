<script lang="ts">
	import IconPlay from '~icons/material-symbols/play-circle';

	interface Props {
		data: string;
	}

	const { data }: Props = $props();

	let paused = $state(true);
	let video: HTMLVideoElement;

	/**
	 * Toggles video playback.
	 */
	const togglePlay = () => {
		if (video.paused) {
			video.play();
			paused = false;
		} else {
			video.pause();
			paused = true;
		}
	};

	/**
	 * Resets the video playback state.
	 */
	const onEnded = () => {
		video.currentTime = 0;
		paused = true;
	};
</script>

<div class="relative">
	<video
		bind:this={video}
		src={data}
		class="cursor-pointer rounded-2xl max-h-[200px]"
		onclick={togglePlay}
		onended={onEnded}
	>
		<track kind="captions" />
	</video>

	{#if paused}
		<button
			onclick={togglePlay}
			class="cursor-pointer absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 p-1 text-white rounded-full"
		>
			<IconPlay class="w-10 h-10" />
		</button>
	{/if}
</div>
