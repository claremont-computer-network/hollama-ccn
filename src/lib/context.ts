export interface ContextUsage {
	usedTokens: number;
	maxTokens: number;
	availableTokens: number;
	percentage: number;
	isWarning: boolean;
	isCritical: boolean;
}

export function estimateTokenCount(text: string): number {
	if (!text || !text.trim()) return 0;
	const words = text.trim().split(/\s+/).length;
	return Math.ceil(words * 1.3);
}

export function calculateContextUsage(
	messages: { content?: string; reasoning?: string }[],
	maxContext: number
): ContextUsage {
	let totalTokens = 0;

	for (const message of messages) {
		if (message.content) {
			totalTokens += estimateTokenCount(message.content);
		}
		if (message.reasoning) {
			totalTokens += estimateTokenCount(message.reasoning);
		}
	}

	const percentage = maxContext > 0 ? (totalTokens / maxContext) * 100 : 0;

	return {
		usedTokens: totalTokens,
		maxTokens: maxContext,
		availableTokens: Math.max(0, maxContext - totalTokens),
		percentage,
		isWarning: percentage >= 70 && percentage < 90,
		isCritical: percentage >= 90
	};
}
