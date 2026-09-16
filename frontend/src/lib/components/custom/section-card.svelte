<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		title,
		action,
		class: className = '',
		contentClass = '',
		children,
	}: {
		title: string;
		action?: Snippet;
		class?: string;
		contentClass?: string;
		children?: Snippet;
	} = $props();
</script>

<Card.Root class={cn('shadow-md', className)}>
	<Card.Header>
		{#if action}
			<div class="flex flex-wrap items-center justify-between gap-3 w-full">
				<Card.Title class="text-l font-bold">{title}</Card.Title>
				{@render action()}
			</div>
		{:else}
			<Card.Title class="text-l font-bold">{title}</Card.Title>
		{/if}
	</Card.Header>
	<Card.Content class={cn('flex flex-col gap-4 pb-4', contentClass)}>
		{@render children?.()}
	</Card.Content>
</Card.Root>
