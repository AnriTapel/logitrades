<script lang="ts">
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { cn } from '$lib/utils';

	let {
		enabled = $bindable(true),
		leverage = $bindable(1),
		disabled = false,
		showToggle = true,
		checkboxProps = {},
		sliderProps = {},
		labelClass = 'text-xs font-semibold uppercase tracking-[0.6px] text-[#4c6076]',
		badgeClass = 'rounded-[2px] bg-[#d2e4ff] px-2 py-0.5 text-[10px] font-bold text-[#001c37]',
		class: className = '',
	}: {
		enabled?: boolean;
		leverage?: number;
		disabled?: boolean;
		showToggle?: boolean;
		checkboxProps?: Record<string, unknown>;
		sliderProps?: Record<string, unknown>;
		labelClass?: string;
		badgeClass?: string;
		class?: string;
	} = $props();
</script>

<div class={cn('flex flex-col gap-4', className)}>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if showToggle}
				<Checkbox
					{...checkboxProps}
					{disabled}
					bind:checked={enabled}
				/>
			{/if}
			<span class={labelClass}>Leverage</span>
		</div>
		<span
			class={cn(badgeClass, { 'opacity-50': showToggle && !enabled })}
		>
			{leverage}x
		</span>
	</div>

	<div class="flex flex-col gap-2 px-1">
		<Slider
			type="single"
			{...sliderProps}
			disabled={disabled || (showToggle && !enabled)}
			bind:value={leverage}
			min={1}
			max={50}
			step={1}
		/>
		<div class="flex justify-between text-[10px] font-medium text-[#94a3b8]">
			<span>1x</span>
			<span>25x</span>
			<span>50x</span>
		</div>
	</div>
</div>
