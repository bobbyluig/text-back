<script lang="ts">
	import IconSend from '~icons/material-symbols/send';

	interface Message {
		id: number;
		text: string;
		sender: 'me' | 'other';
		timestamp: Date;
		reaction?: string;
	}

	const messages: Message[] = [
		{
			id: 1,
			text: 'a',
			sender: 'other',
			timestamp: new Date('2025-03-01T09:00:00'),
			reaction: '👋'
		},
		{
			id: 2,
			text: "I'm doing great! Just finished working on that new project.",
			sender: 'me',
			timestamp: new Date('2025-03-01T09:02:00')
		},
		{
			id: 3,
			text: "That's awesome! How did it turn out?",
			sender: 'other',
			timestamp: new Date('2025-03-01T09:03:00')
		},
		{
			id: 4,
			text: 'Really well! The client was super happy with the results.',
			sender: 'me',
			timestamp: new Date('2025-03-01T09:05:00'),
			reaction: '🌟'
		},
		{
			id: 5,
			text: 'Would love to hear more about it sometime!',
			sender: 'other',
			timestamp: new Date('2025-03-01T09:06:00'),
			reaction: '💯'
		},
		{
			id: 6,
			text: 'https://tailwindcss.com/docs/box-shadow',
			sender: 'me',
			timestamp: new Date('2025-03-01T09:07:00')
		},
		{
			id: 7,
			text: 'Perfect! How about Wednesday afternoon?',
			sender: 'other',
			timestamp: new Date('2025-03-01T09:08:00'),
			reaction: '👍'
		},
		{
			id: 8,
			text: 'Wednesday works great for me! Looking forward to it.',
			sender: 'other',
			timestamp: new Date('2025-03-01T09:09:00'),
			reaction: '🎉'
		}
	];

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-us', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<main class="flex justify-center items-center min-h-screen bg-gray-800">
	<div class="w-[95vw] max-w-[420px] h-[95vh] bg-white rounded-3xl flex flex-col">
		<div class="px-4 py-2 bg-gray-100 rounded-t-3xl text-center shadow-md">
			<div class="text-xl font-semibold text-gray-800">Lujing Cen</div>
			<div class="text-xs text-gray-500">Score: 0 · Streak: 0</div>
		</div>

		<div class="flex-1 overflow-y-scroll p-4 grid grid-cols-1 gap-4 scrollbar-none">
			{#each messages as message}
				<div
					class="grid {message.sender === 'me' ? 'justify-items-end' : 'justify-items-start'} 
					{message.reaction ? 'mb-4' : ''}"
				>
					<div class="text-xs text-gray-500 mb-1">
						<div>Messenger · {formatTime(message.timestamp)}</div>
					</div>
					<div
						class="{message.sender === 'me'
							? 'bg-green-500 text-white'
							: 'bg-gray-200 text-gray-800'} 
						rounded-2xl px-4 py-2 max-w-[70%] relative group break-words"
					>
						{message.text}
						{#if message.reaction}
							<div
								class="absolute -bottom-4 {message.sender === 'me'
									? 'left-0'
									: 'right-0'} bg-white rounded-full px-1.5 py-0.5 shadow-md text-sm"
							>
								{message.reaction}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

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
	</div>
</main>
