import type { MessagePlatform } from '@prisma/client';

/**
 * Returns whether the given media content is an audio file.
 */
export function isAudio(content: string): boolean {
	return ['.aac', '.wav'].some((extension) => content.endsWith(extension));
}

/**
 * Returns whether the given media content is an image file.
 */
export function isImage(content: string): boolean {
	return ['.gif', '.jpg', '.jpeg', '.png', '.webp'].some((extension) =>
		content.endsWith(extension)
	);
}

/**
 * Returns whether the given text content is a link.
 */
export function isLink(content: string): boolean {
	return content.startsWith('http://') || content.startsWith('https://');
}

/**
 * Returns whether the given media content is a video file.
 */
export function isVideo(content: string): boolean {
	return ['.mp4'].some((extension) => content.endsWith(extension));
}

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
