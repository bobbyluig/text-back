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
	content: { data: string; type: 'audio' | 'image' | 'link' | 'text' | 'video' };
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
 * Returns the content of a message and preloads any necessary assets.
 */
export async function renderContent(
	message: QuestionMessage
): Promise<RenderedChatMessage['content']> {
	if (!message.isMedia) {
		return message.content.startsWith('http://') || message.content.startsWith('https://')
			? { data: message.content, type: 'link' }
			: { data: message.content, type: 'text' };
	}

	const audioExtension = ['.aac', '.mp3', '.wav'];
	if (audioExtension.some((extension) => message.content.endsWith(extension))) {
		return new Promise((resolve) => {
			const audio = new Audio();
			audio.src = getMediaUrl(message.content);
			audio.preload = 'auto';
			audio.oncanplaythrough = () => resolve({ data: audio.src, type: 'audio' });
		});
	}

	const imageExtensions = ['.gif', '.jpg', '.jpeg', '.png', '.webp'];
	if (imageExtensions.some((extension) => message.content.endsWith(extension))) {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = getMediaUrl(message.content);
			img.onload = () => resolve({ data: img.src, type: 'image' });
		});
	}

	const videoExtensions = ['.mp4', '.webm'];
	if (videoExtensions.some((extension) => message.content.endsWith(extension))) {
		return new Promise((resolve) => {
			const video = document.createElement('video');
			video.src = getMediaUrl(message.content);
			video.preload = 'auto';
			video.onloadedmetadata = () => {
				if (video.videoHeight > 0 && video.videoWidth > 0) {
					resolve({ data: video.src, type: 'video' });
				} else {
					resolve({ data: video.src, type: 'audio' });
				}
			};
		});
	}

	throw new Error('Unsupported extension');
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

/**
 * Returns a promise that resolves after the specified time.
 */
export async function sleep(duration: number): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, duration));
}

/**
 * Performs a slide transition on the element. This is intended to be called right after the element
 * is mounted. One special behavior of this transition function is that the height is computed after
 * the delay, which effectively allows the element to preload and reflow prior to transition start.
 */
export async function slideDelayed(
	element: HTMLElement,
	{ delay = 0, duration = 400 }: { delay?: number; duration?: number } = {}
): Promise<void> {
	// Set initial transition properties. In particular, we want to make sure that the height of the
	// element is zero until we decided to start the transition.
	element.style.setProperty('max-height', '0px');
	element.style.setProperty('overflow', 'hidden');
	element.style.setProperty('transition-duration', `${duration}ms`);
	element.style.setProperty('transition-property', 'max-height');
	element.style.setProperty('transition-timing-function', 'var(--ease-out)');

	// Wait for the delay, potentially allowing the element to fully load.
	await sleep(delay);

	// Start the transition.
	element.style.setProperty('max-height', `${element.scrollHeight}px`);

	// Wait for the transition to complete.
	await new Promise((resolve) => {
		element.addEventListener('transitionend', resolve);
	});

	// Clean up all added properties.
	element.style.removeProperty('max-height');
	element.style.removeProperty('overflow');
	element.style.removeProperty('transition-duration');
	element.style.removeProperty('transition-property');
	element.style.removeProperty('transition-timing-function');
}

/**
 * Splits a string into characters, taking into consideration emojis.
 */
export function split(s: string): Array<string> {
	return [...new Intl.Segmenter().segment(s)].map((x) => x.segment);
}

/**
 * A typewriter animation for text.
 */
export function typewriter(node: HTMLElement, { speed = 1 }: { speed?: number } = {}) {
	const text = node.textContent ?? '';
	const characters = split(text);
	return {
		duration: characters.length / (speed * 0.01),
		tick: (t: number) => {
			const i = Math.trunc(characters.length * t);
			node.textContent = characters.slice(0, i).join('');
		}
	};
}
