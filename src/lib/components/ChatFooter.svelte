<script lang="ts">
	import IconSend from '~icons/material-symbols/send';
</script>

<div class="p-4 bg-white rounded-b-3xl">
	<div class="flex items-center gap-2">
		<input
			type="text"
			placeholder="Type a message..."
			class="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-green-500"
		/>
		<button
			class="bg-green-500 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-green-600 transition-colors"
		>
			<IconSend />
		</button>
	</div>
</div>
