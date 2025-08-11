<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Snippet } from 'svelte';

	let {
		open,
		title = '',
		subtitle = '',
		cancelText = 'Cancel',
		submitText = 'Submit',
		showCancel = true,
		showSubmit = true,
		disabled = false,
		onCancel = () => {},
		onSubmit = () => {},
		children = undefined,
	} = $props<{
		open: boolean;
		title?: string;
		subtitle?: string;
		cancelText?: string;
		submitText?: string;
		showCancel?: boolean;
		showSubmit?: boolean;
		disabled?: boolean;
		onCancel?: () => void;
		onSubmit?: () => void;
		children?: Snippet;
	}>();

	function handleCancel() {
		onCancel?.();
	}

	function handleSubmit() {
		onSubmit?.();
	}
</script>

<Dialog.Root {open}>
	<Dialog.Content>
		{#if title}
			<h2 class="text-lg font-semibold mb-1">{title}</h2>
		{/if}
		{#if subtitle}
			<p class="text-sm text-gray-500 mb-4">{subtitle}</p>
		{/if}

		<!-- Dialog body slot -->
		<div class="mb-4">
			{#if children}
				{@render children()}
			{:else}
				<p class="text-gray-700">No content provided.</p>
			{/if}
		</div>

		<!-- Footer buttons -->
		<div class="flex justify-end gap-2">
			{#if showCancel}
				<button
					type="button"
					class="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
					onclick={handleCancel}
				>
					{cancelText}
				</button>
			{/if}
			{#if showSubmit}
				<button
					type="button"
					class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
					onclick={handleSubmit}
					{disabled}
				>
					{submitText}
				</button>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
