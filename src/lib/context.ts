export interface ContextUsage {
	usedTokens: number;
	maxTokens: number;
	availableTokens: number;
	percentage: number;
	isWarning: boolean;
	isCritical: boolean;
	maxContextRetained: number; // The actual max context retained by the model (context window - retention buffer)
}

/**
 * Estimates token count from text using the common rule of ~1.3 tokens per word
 */
export function estimateTokenCount(text: string): number {
	if (!text || !text.trim()) return 0;
	const words = text.trim().split(/\s+/).length;
	return Math.ceil(words * 1.3);
}

/**
 * Calculates context usage for conversation history
 * Uses the model's num_ctx setting and applies a retention buffer to prevent overflow
 */
export function calculateContextUsage(
	messages: { content?: string; reasoning?: string }[],
	maxContext: number,
	retentionBuffer: number = 100 // Keep buffer to prevent hitting exact limit
): ContextUsage {
	// Apply retention buffer to ensure we don't hit the absolute limit
	const usableContext = Math.max(0, maxContext - retentionBuffer);
	const maxContextRetained = usableContext;

	let totalTokens = 0;

	for (const message of messages) {
		if (message.content) {
			totalTokens += estimateTokenCount(message.content);
		}
		if (message.reasoning) {
			totalTokens += estimateTokenCount(message.reasoning);
		}
	}

	// Cap usage at maxContextRetained for percentage calculation
	// This ensures percentage never exceeds 100% of usable context
	const effectiveUsedTokens = Math.min(totalTokens, maxContextRetained);
	const percentage = maxContextRetained > 0 ? (effectiveUsedTokens / maxContextRetained) * 100 : 0;

	// availableTokens shows how much more can be added to reach usableContext
	// If we've exceeded usableContext, this will be 0
	const availableTokens = Math.max(0, maxContextRetained - effectiveUsedTokens);

	return {
		usedTokens: totalTokens,
		maxTokens: maxContext,
		availableTokens,
		percentage,
		isWarning: percentage >= 70 && percentage < 90,
		isCritical: percentage >= 90,
		maxContextRetained
	};
}
