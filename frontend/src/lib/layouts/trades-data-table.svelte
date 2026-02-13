<script lang="ts">
	import {
		type ColumnFiltersState,
		type SortingState,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { createColumns } from './trades-table-columns';
	import type { Trade } from '$lib/types';
	import type { Writable } from 'svelte/store';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button';

	const {
		trades,
		styling,
		noTradesMessage = 'No trades found',
		onDelete,
		onEdit,
	}: {
		trades: Writable<Trade[]>;
		styling?: {
			maxBodyHeight?: string;
		};
		noTradesMessage?: string;
		onDelete: (tradeId: number) => void;
		onEdit: (tradeId: number) => void;
	} = $props();

	// State for sorting
	let sorting = $state<SortingState>([
		{ id: 'tradeDates', desc: true }, // Default sort by most recent
	]);

	// State for filtering
	let columnFilters = $state<ColumnFiltersState>([]);

	// Filter input values
	let symbolFilter = $state('');
	let typeFilter = $state<string>('');

	// Update column filters when inputs change
	$effect(() => {
		const filters: ColumnFiltersState = [];
		if (symbolFilter) {
			filters.push({ id: 'symbol', value: symbolFilter });
		}
		if (typeFilter) {
			filters.push({ id: 'tradeType', value: typeFilter });
		}
		columnFilters = filters;
	});

	// Create columns with callbacks
	const columns = createColumns(onEdit, onDelete);

	// Create table instance
	const table = $derived(
		createSvelteTable({
			data: $trades,
			columns,
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
			getFilteredRowModel: getFilteredRowModel(),
			onSortingChange: (updater) => {
				if (typeof updater === 'function') {
					sorting = updater(sorting);
				} else {
					sorting = updater;
				}
			},
			onColumnFiltersChange: (updater) => {
				if (typeof updater === 'function') {
					columnFilters = updater(columnFilters);
				} else {
					columnFilters = updater;
				}
			},
			state: {
				get sorting() {
					return sorting;
				},
				get columnFilters() {
					return columnFilters;
				},
			},
		}),
	);
</script>

<div class="w-full space-y-3 md:space-y-4">
	<!-- Filter controls -->
	<div class="flex flex-row flex-wrap gap-2 items-center">
		<div class="flex-1 min-w-[140px] max-w-xs">
			<Input
				type="text"
				placeholder="Filter by symbol..."
				bind:value={symbolFilter}
				class="h-9"
			/>
		</div>

		<div class="flex gap-2 flex-wrap">
			<Button
				variant={typeFilter === '' ? 'default' : 'outline'}
				size="sm"
				onclick={() => (typeFilter = '')}
			>
				All
			</Button>
			<Button
				variant={typeFilter === 'buy' ? 'default' : 'outline'}
				size="sm"
				onclick={() => (typeFilter = 'buy')}
			>
				Long
			</Button>
			<Button
				variant={typeFilter === 'sell' ? 'default' : 'outline'}
				size="sm"
				onclick={() => (typeFilter = 'sell')}
			>
				Short
			</Button>
		</div>
	</div>

	<!-- Table with virtual scrolling and horizontal scroll on mobile -->
	<div
		class="rounded-md border relative overflow-x-auto overflow-y-auto"
		style={styling?.maxBodyHeight ? `max-height: ${styling.maxBodyHeight}` : ''}
	>
		<Table.Root noWrapper class="min-w-[640px]">
			<Table.Header class="sticky top-0 bg-background z-10">
				{#each table.getHeaderGroups() as headerGroup}
					<Table.Row>
						{#each headerGroup.headers as header}
							<Table.Head class="whitespace-nowrap">
								{#if !header.isPlaceholder}
									{#if header.column.getCanSort()}
										<Button
											variant="ghost"
											onclick={() => {
												const currentSort = header.column.getIsSorted();
												if (currentSort === false) {
													header.column.toggleSorting(false);
												} else if (currentSort === 'asc') {
													header.column.toggleSorting(true);
												} else {
													header.column.clearSorting();
												}
											}}
											class="h-8 px-2 whitespace-nowrap"
										>
											<FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
											<ArrowUpDown class="ml-2 h-4 w-4" />
										</Button>
									{:else}
										<FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
									{/if}
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>

			{#if table.getRowModel().rows.length === 0}
				<caption class="p-8 mb-4 text-sm text-muted-foreground">
					{noTradesMessage}
				</caption>
			{:else}
				<Table.Body>
					{#each table.getRowModel().rows as row}
						<Table.Row
							data-state={row.getIsSelected() ? 'selected' : undefined}
						>
							{#each row.getVisibleCells() as cell}
								<Table.Cell>
									<FlexRender
										content={cell.column.columnDef.cell}
										context={cell.getContext()}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>
</div>

<style>
	/* Ensure scrolling works properly */
	:global(.overflow-y-auto) {
		scrollbar-width: thin;
	}
</style>
