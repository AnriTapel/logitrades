<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		options,
		value = $bindable<string>(),
		disabled,
		label,
		name,
		class: className = '',
		itemClass = '',
	}: {
		options: { label: string; value: string; icon?: Component }[];
		value: string;
		disabled?: boolean;
		label?: string;
		name?: string;
		class?: string;
		itemClass?: string;
	} = $props();
</script>

<input type="hidden" {name} {value} />
<ToggleGroup.Root
	type="single"
	bind:value
	{disabled}
	aria-label={label}
	class={cn('flex items-center gap-2', className)}
>
	{#each options as option (option.value)}
		<ToggleGroup.Item
			value={option.value}
			data-state={Array.isArray(value)
				? value.includes(option.value)
					? 'on'
					: 'off'
				: value === option.value
					? 'on'
					: 'off'}
			class={cn(
				'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] px-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
				itemClass,
			)}
		>
			{#if option.icon}
				{@const Icon = option.icon}
				<Icon class="size-3" />
			{/if}
			{option.label}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
