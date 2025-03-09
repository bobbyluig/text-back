import type { MessagePlatform } from '@prisma/client';

/**
 * Returns a rendered representation of the date.
 */
export function renderDate(date: Date): string {
	return date.toLocaleDateString('en-us', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Returns a rendered representation of the platform.
 */
export function renderPlatform(platform: MessagePlatform): string {
	switch (platform) {
		case 'INSTAGRAM':
			return 'Instagram';
		case 'MESSENGER':
			return 'Messenger';
	}
}

/**
 * Returns a rendered representation of the time.
 */
export function renderTime(date: Date): string {
	return date.toLocaleTimeString('en-us', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
