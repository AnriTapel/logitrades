<script lang="ts">
	import { ToggleGroup } from 'bits-ui';

	let {
		options,
		value = $bindable<string>(),
		disabled,
		label,
		name,
	}: {
		options: { label: string; value: string }[];
		value: string;
		disabled?: boolean;
		label?: string;
		name?: string;
	} = $props();
</script>

<input type="hidden" {name} {value} />
<ToggleGroup.Root
	type="single"
	bind:value
	{disabled}
	aria-label={label}
	class="flex items-center gap-2"
>
	{#each options as option}
		<ToggleGroup.Item
			value={option.value}
			data-state={Array.isArray(value)
				? value.includes(option.value)
					? 'on'
					: 'off'
				: value === option.value
					? 'on'
					: 'off'}
			class="inline-flex items-center justify-center rounded-[9px] px-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8"
		>
			{option.label}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
