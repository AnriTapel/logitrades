<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { TagsFilterPopover } from '$lib/components/custom';
	import type { TradeFilters } from '$lib/types';
	import ToggleGroup from './toggle-group.svelte';
	import type { Writable } from 'svelte/store';
	import DateTimePicker from './date-time-picker.svelte';
	import {
		EMPTY_TRADE_FILTERS,
		hasActiveTradeFilters,
	} from '$lib/filters/tradeFilters';

	let {
		filters,
		availableTags = [],
		showSymbolFilter = true,
		showDateRange = true,
		dateFieldHint,
	}: {
		filters: Writable<TradeFilters>;
		availableTags?: string[];
		showSymbolFilter?: boolean;
		showDateRange?: boolean;
		dateFieldHint?: string;
	} = $props();

	const selectedTags = $derived($filters.tags ?? []);
	const hasActiveFilters = $derived(hasActiveTradeFilters($filters));

	function onTagsChange(tags: string[]): void {
		filters.update((prev) => ({ ...prev, tags }));
	}

	function resetFilters(): void {
		filters.set({ ...EMPTY_TRADE_FILTERS });
	}
</script>

<div class="flex flex-row flex-wrap gap-4 items-center">
	{#if showSymbolFilter}
		<div class="flex flex-col gap-1">
			<Label for="filter-symbol" class="text-xs text-muted-foreground"
				>Symbol</Label
			>
			<Input
				id="filter-symbol"
				type="text"
				placeholder="Filter by symbol..."
				bind:value={$filters.symbol}
				class="w-42 shrink-0 h-9"
			/>
		</div>
	{/if}

	<div class="flex flex-col gap-1">
		<Label for="tradeTypeFilter" class="text-xs text-muted-foreground"
			>Side</Label
		>
		<ToggleGroup
			name="tradeTypeFilter"
			bind:value={$filters.tradeType}
			class="h-11 w-full gap-0 rounded bg-[#f3f3f7] p-1"
			itemClass="h-full flex-1 rounded text-xs font-bold uppercase data-[state=on]:bg-white data-[state=on]:text-[#003d6d] data-[state=on]:shadow-sm data-[state=off]:text-[#64748b]"
			options={[
				{ label: 'All', value: 'all' },
				{ label: 'Long', value: 'buy' },
				{ label: 'Short', value: 'sell' },
			]}
		></ToggleGroup>
	</div>

	{#if availableTags.length > 0}
		<div class="flex flex-col items-start gap-1">
			<Label for="tagsFilter" class="text-xs text-muted-foreground">Tags</Label>
			<div class="flex items-center gap-2">
				<TagsFilterPopover
					{availableTags}
					{selectedTags}
					onSelectedTagsChange={onTagsChange}
				/>
			</div>
		</div>
	{/if}

	{#if showDateRange}
		<div class="flex flex-col gap-1 items-start">
			<Label for="tagsFilter" class="text-xs text-muted-foreground"
				>{dateFieldHint}:</Label
			>
			<div class="flex items-center gap-2">
				<DateTimePicker
					name="dateFrom"
					placeholder="Select start date"
					bind:value={$filters.dateFrom}
					withTime={false}
				/>
				<DateTimePicker
					name="dateTo"
					placeholder="Select end date"
					bind:value={$filters.dateTo}
					withTime={false}
				/>
			</div>
		</div>
	{/if}

	<Button
		variant="ghost"
		class="self-end"
		onclick={resetFilters}
		disabled={!hasActiveFilters}
	>
		Reset
	</Button>
</div>
