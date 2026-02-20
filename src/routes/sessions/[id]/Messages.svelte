<script lang="ts">
	import LL from '$i18n/i18n-svelte';
	import EmptyMessage from '$lib/components/EmptyMessage.svelte';
	import { calculateContextUsage } from '$lib/context';
	import { saveSession, type Editor, type Message, type Session } from '$lib/sessions';

	import Article from './Article.svelte';

	interface Props {
		session: Session;
		editor: Editor;
		handleRetry: (index: number) => void;
	}

	let { session = $bindable(), editor = $bindable(), handleRetry }: Props = $props();

	const contextUsage = $derived(
		calculateContextUsage(session.messages, session.options.num_ctx || 2048, 100)
	);

	function handleEditMessage(message: Message) {
		editor.messageIndexToEdit = session.messages.findIndex((m) => m === message);
		editor.isCodeEditor = true;
		editor.prompt = message.content;
		editor.attachments = (message.images || []).map((img, idx) => ({
			type: 'image',
			id: `${idx}-${img.filename}`,
			name: img.filename,
			dataUrl: `data:image/png;base64,${img.data}`
		}));
		editor.promptTextarea?.focus();
	}

	function handleDeleteAttachment(message: Message) {
		session.messages = session.messages.filter((m) => m !== message);
		saveSession(session);
	}
</script>

<div class="context-usage">
	{#if contextUsage.maxTokens > 0}
		<div
			class:warning={contextUsage.isWarning}
			class:critical={contextUsage.isCritical}
			data-testid="context-usage"
		>
			<span>{$LL.context()}</span>
			<span
				>{contextUsage.usedTokens} / {contextUsage.maxTokens} ({Math.round(
					contextUsage.percentage
				)}%)</span
			>
		</div>
	{/if}
</div>

{#if editor.isNewSession}
	<EmptyMessage>{$LL.writePromptToStart()}</EmptyMessage>
{/if}

{#each session.messages as message, i (session.id + i)}
	{#key message.role}
		<Article
			{message}
			retryIndex={['assistant', 'system'].includes(message.role) ? i : undefined}
			{handleRetry}
			handleEditMessage={() => handleEditMessage(message)}
			handleDeleteAttachment={() => handleDeleteAttachment(message)}
		/>
	{/key}
{/each}

{#if editor.isCompletionInProgress}
	<Article
		message={{
			role: 'assistant',
			content: editor.completion || '...',
			reasoning: editor.reasoning
		}}
		isStreamingArticle={true}
		currentRawReasoning={editor.reasoning}
		currentRawCompletion={editor.completion}
	/>
{/if}

{#each session.messages as message, i (session.id + i)}
	{#key message.role}
		<Article
			{message}
			retryIndex={['assistant', 'system'].includes(message.role) ? i : undefined}
			{handleRetry}
			handleEditMessage={() => handleEditMessage(message)}
			handleDeleteAttachment={() => handleDeleteAttachment(message)}
		/>
	{/key}
{/each}

{#if editor.isCompletionInProgress}
	<Article
		message={{
			role: 'assistant',
			content: editor.completion || '...',
			reasoning: editor.reasoning
		}}
		isStreamingArticle={true}
		currentRawReasoning={editor.reasoning}
		currentRawCompletion={editor.completion}
	/>
{/if}

<style lang="postcss">
	.context-usage {
		@apply mb-4 flex justify-between border-b border-gray-200 px-4 py-2 text-sm;
		@apply sticky top-0 z-10 bg-white;

		&.warning {
			@apply border-yellow-200 bg-yellow-50 text-yellow-800;
		}

		&.critical {
			@apply border-red-200 bg-red-50 text-red-800;
		}

		span:first-child {
			@apply font-medium;
		}
	}
</style>
