<script lang="ts">
	import {
		type SortingState,
		getCoreRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { createColumns } from './trades-table-columns';
	import { localeStore } from '$lib/stores/locale';
	import type { Trade } from '$lib/types';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button';

	const {
		trades,
		total,
		pageIndex = 0,
		pageSize = 50,
		loading = false,
		styling,
		noTradesMessage = 'No trades found',
		onDelete,
		onEdit,
		onPageChange,
		onRowClick,
	}: {
		trades: Trade[];
		total: number;
		pageIndex?: number;
		pageSize?: number;
		loading?: boolean;
		styling?: {
			maxBodyHeight?: string;
		};
		noTradesMessage?: string;
		onDelete: (tradeId: number) => void;
		onEdit: (tradeId: number) => void;
		onPageChange?: (pageIndex: number) => void;
		onRowClick?: (trade: Trade) => void;
	} = $props();

	let sorting = $state<SortingState>([{ id: 'tradeDates', desc: true }]);

	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const canPreviousPage = $derived(pageIndex > 0);
	const canNextPage = $derived(pageIndex < pageCount - 1);

	const columns = $derived(
		createColumns(onEdit, onDelete, $localeStore.currency),
	);

	const table = createSvelteTable({
		get data() {
			return trades;
		},
		get columns() {
			return columns;
		},
		get pageCount() {
			return pageCount;
		},
		manualPagination: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getRowId: (row) => String(row.id),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onPaginationChange: (updater) => {
			const current = { pageIndex, pageSize };
			const next = typeof updater === 'function' ? updater(current) : updater;
			onPageChange?.(next.pageIndex);
		},
		state: {
			get sorting() {
				return sorting;
			},
			get pagination() {
				return { pageIndex, pageSize };
			},
		},
	});
</script>

<div class="w-full space-y-3 md:space-y-4">
	<div
		class="rounded-md border relative overflow-x-auto overflow-y-auto"
		style={styling?.maxBodyHeight ? `max-height: ${styling.maxBodyHeight}` : ''}
	>
		<Table.Root noWrapper class="min-w-[640px]">
			<Table.Header class="sticky top-0 bg-background z-10">
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
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

			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row
						data-state={row.getIsSelected() ? 'selected' : undefined}
						class={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
						on:click={() => onRowClick?.(row.original)}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell
								on:click={(e) => {
									if (cell.column.id === 'actions') {
										e.stopPropagation();
									}
								}}
							>
								<FlexRender
									content={cell.column.columnDef.cell}
									context={cell.getContext()}
								/>
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell
							colspan={columns.length}
							class="h-24 text-center text-muted-foreground"
						>
							{noTradesMessage}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if total > pageSize}
		<div class="flex items-center justify-between gap-4">
			<p class="text-sm text-muted-foreground">
				Page {pageIndex + 1} of {pageCount} ({total} trades)
			</p>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={!canPreviousPage || loading}
					onclick={() => onPageChange?.(pageIndex - 1)}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					disabled={!canNextPage || loading}
					onclick={() => onPageChange?.(pageIndex + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.overflow-y-auto) {
		scrollbar-width: thin;
	}
</style>
