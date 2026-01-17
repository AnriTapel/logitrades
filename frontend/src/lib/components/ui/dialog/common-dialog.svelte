<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Snippet } from 'svelte';
	import Button from '../button/button.svelte';
	import { cn } from '$lib/utils';

	let {
		open,
		title = '',
		subtitle = '',
		cancelText = 'Cancel',
		submitText = 'Submit',
		showCancel = true,
		showSubmit = true,
		disabled = false,
		class: className = '',
		onCancel = () => {},
		onSubmit = () => {},
		children,
	} = $props<{
		open: boolean;
		title?: string;
		subtitle?: string;
		cancelText?: string;
		submitText?: string;
		showCancel?: boolean;
		showSubmit?: boolean;
		disabled?: boolean;
		class?: string;
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

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onCancel?.();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class={cn('min-w-[300px] max-w-full', className)}>
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
				<Button variant="secondary" onclick={handleCancel}>
					{cancelText}
				</Button>
			{/if}
			{#if showSubmit}
				<Button
					type="submit"
					variant="default"
					onclick={handleSubmit}
					{disabled}
				>
					{submitText}
				</Button>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
