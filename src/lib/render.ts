import type { Question, QuestionMessage } from '$lib/question';
import type { MessagePlatform } from '@prisma/client';

/**
 * A rendered chat containing messages.
 */
export type RenderedChat = {
	choices: Array<string>;
	description: string;
	mask: { recipient: boolean };
	messages: Array<RenderedChatMessage>;
	recipient: string;
};

/**
 * A rendered chat message.
 */
export type RenderedChatMessage = {
	content:
		| { type: 'audio'; data: string }
		| { type: 'image'; data: string; metadata: { height: number; width: number } }
		| { type: 'link'; data: string }
		| { type: 'text'; data: string }
		| { type: 'video'; data: string; metadata: { height: number; width: number } };
	date: string;
	mask: { content: boolean; date: boolean; platform: boolean; reaction: boolean };
	participant: string;
	platform: string;
	reaction: string;
};

/**
 * Returns the media URL associated with the content.
 */
export function getMediaUrl(content: string): string {
	return `media/${content}`;
}

/**
 * Preloads an audio file. The returned promise resolves when the audio has been loaded.
 */
export async function preloadAudio(url: string): Promise<void> {
	return new Promise<void>((resolve) => {
		const audio = new Audio();
		audio.src = url;
		audio.preload = 'auto';
		audio.oncanplaythrough = () => resolve();
	});
}

/**
 * Preloads an image file. The returned promise resolves when the image has been loaded.
 */
export async function preloadImage(url: string): Promise<void> {
	return new Promise<void>((resolve) => {
		const img = new Image();
		img.src = url;
		img.onload = () => resolve();
	});
}

/**
 * Preloads a video file. The returned promise resolves when the video has been loaded.
 */
export async function preloadVideo(url: string): Promise<void> {
	return new Promise<void>((resolve) => {
		const video = document.createElement('video');
		video.src = url;
		video.preload = 'auto';
		video.oncanplaythrough = () => resolve();
	});
}

/**
 * Returns the content of a message and preloads any necessary assets.
 */
export async function renderContent(
	message: QuestionMessage
): Promise<RenderedChatMessage['content']> {
	if (!message.isMedia) {
		return message.content.startsWith('http://') || message.content.startsWith('https://')
			? { type: 'link', data: message.content }
			: { type: 'text', data: message.content };
	}

	const audioExtension = ['.aac', '.mp3', '.wav'];
	if (audioExtension.some((extension) => message.content.endsWith(extension))) {
		return new Promise((resolve) => {
			const audio = new Audio();
			audio.src = getMediaUrl(message.content);
			audio.preload = 'auto';
			audio.oncanplaythrough = () => resolve({ type: 'audio', data: audio.src });
		});
	}

	const imageExtensions = ['.gif', '.jpg', '.jpeg', '.png', '.webp'];
	if (imageExtensions.some((extension) => message.content.endsWith(extension))) {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = getMediaUrl(message.content);
			img.onload = () =>
				resolve({
					type: 'image',
					data: img.src,
					metadata: { height: img.height, width: img.width }
				});
		});
	}

	const videoExtensions = ['.mp4', '.webm'];
	if (!videoExtensions.some((extension) => message.content.endsWith(extension))) {
		throw new Error('Unsupported media extension');
	}

	return new Promise((resolve) => {
		const video = document.createElement('video');
		video.src = getMediaUrl(message.content);
		video.preload = 'metadata';
		video.onloadedmetadata = () => {
			const hasVideo = video.videoHeight > 0 && video.videoWidth > 0;
			if (!hasVideo) {
				resolve({ type: 'audio', data: video.src });
			} else {
				resolve({
					type: 'video',
					data: video.src,
					metadata: { height: video.videoHeight, width: video.videoWidth }
				});
			}
		};
	});
}

/**
 * Returns a rendered representation of the date.
 */
export function renderDate(date: Date): string {
	return date.toLocaleDateString('en-us', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Returns a rendered description of the question variant.
 */
export function renderDescription(question: Question): string {
	const recipient = question.recipient;
	const sender = question.messages[question.messages.length - 1].participant;

	switch (question.variant) {
		case 'continue':
			return `What was the hidden message to ${recipient}?`;
		case 'duration':
			return `How long did it take for ${sender} to reply?`;
		case 'platform':
			return `What platform was the last message sent from?`;
		case 'proposal':
			return `What was the hidden message to ${recipient}?`;
		case 'react':
			return `What was the reaction on ${sender}'s message?`;
		case 'when':
			return `What day was the last message sent on?`;
		case 'who':
			return `Who sent the last message?`;
	}
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

/**
 * Returns a rendered representation of the question.
 */
export async function renderQuestion(question: Question): Promise<RenderedChat> {
	const rendered = {
		choices: question.choices,
		description: renderDescription(question),
		mask: { recipient: false },
		messages: await Promise.all(
			question.messages.map(async (message) => ({
				content: await renderContent(message),
				date: renderTime(message.date),
				mask: { content: false, date: false, platform: false, reaction: false },
				participant: message.participant,
				platform: renderPlatform(message.platform),
				reaction: message.reaction
			}))
		),
		recipient: question.recipient
	};

	switch (question.variant) {
		case 'continue':
			rendered.messages[rendered.messages.length - 1].mask.content = true;
			break;
		case 'duration':
			rendered.messages[rendered.messages.length - 1].mask.date = true;
			break;
		case 'platform':
			rendered.messages.forEach((message, i) => {
				message.mask.platform = true;
				if (i !== rendered.messages.length - 1) {
					message.mask.content = true;
				}
			});
			break;
		case 'proposal':
			rendered.messages[rendered.messages.length - 1].mask.content = true;
			break;
		case 'react':
			rendered.messages[rendered.messages.length - 1].mask.reaction = true;
			break;
		case 'when':
			rendered.messages.forEach((message) => {
				message.mask.date = true;
			});
			break;
		case 'who':
			rendered.mask.recipient = true;
			rendered.messages.forEach((message, i) => {
				if (i !== rendered.messages.length - 1) {
					message.mask.content = true;
				}
			});
			break;
	}

	return rendered;
}

/**
 * Returns a new rendered chat with all masks disabled.
 */
export function revealChat(chat: RenderedChat): RenderedChat {
	return {
		...chat,
		mask: { recipient: false },
		messages: chat.messages.map((message) => ({
			...message,
			mask: { content: false, date: false, platform: false, reaction: false }
		}))
	};
}
