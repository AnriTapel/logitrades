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
	import Loader2 from 'lucide-svelte/icons/loader-2';

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
	} = $props();

	let sorting = $state<SortingState>([
		{ id: 'tradeDates', desc: true },
	]);

	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const canPreviousPage = $derived(pageIndex > 0);
	const canNextPage = $derived(pageIndex < pageCount - 1);

	const columns = $derived(
		createColumns(onEdit, onDelete, $localeStore.currency),
	);

	const table = $derived(
		createSvelteTable({
			data: trades,
			columns,
			pageCount,
			manualPagination: true,
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
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
		}),
	);
</script>

<div class="w-full space-y-3 md:space-y-4">
	{#if loading}
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<Loader2 class="size-4 animate-spin" />
			<span>Loading trades...</span>
		</div>
	{/if}

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
