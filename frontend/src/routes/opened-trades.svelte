<script lang="ts">
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import { TradeFiltersToolbar } from '$lib/components/custom';
	import type { Trade, TradeFacets, TradeFilters } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import Plus from 'lucide-svelte/icons/plus';
	import FileUp from 'lucide-svelte/icons/file-up';
	import { openedTradeFiltersStore } from '$lib/stores/opened-trade-filters';
	import { submitTradeFilterAction } from '$lib/tradeListClient';
	import { debounce } from '$lib/inputDebounce';
	import { TRADES_PAGE_SIZE } from '$lib/constants/trades';
	import { onDestroy } from 'svelte';
	import { get, type Unsubscriber } from 'svelte/store';

	let {
		initialTrades,
		initialTotal,
		facets,
		handleOpenTradeForm,
		handleOpenImportDialog,
		handleTradeDelete,
		handleTradeEdit,
		isArchived = false,
		portfolioId,
	}: {
		initialTrades: Trade[];
		initialTotal: number;
		facets: TradeFacets;
		handleOpenTradeForm: () => void;
		handleOpenImportDialog: () => void;
		handleTradeDelete: (tradeId: number) => void;
		handleTradeEdit: (tradeId: number) => void;
		isArchived?: boolean;
		portfolioId?: number;
	} = $props();

	let trades = $state<Trade[]>([...initialTrades]);
	let total = $state(initialTotal);
	let pageIndex = $state(0);
	let loading = $state(false);

	$effect(() => {
		trades = [...initialTrades];
		total = initialTotal;
		pageIndex = 0;
	});

	// Keep filter store scoped to the active portfolio across resets/refetches
	$effect(() => {
		openedTradeFiltersStore.update((prev) =>
			prev.portfolioId === portfolioId ? prev : { ...prev, portfolioId },
		);
	});

	function withPortfolio(filters: TradeFilters): TradeFilters {
		return portfolioId != null ? { ...filters, portfolioId } : filters;
	}

	async function fetchTrades(
		filters: TradeFilters,
		offset: number,
	): Promise<void> {
		loading = true;
		try {
			const result = await submitTradeFilterAction(
				'filterOpened',
				withPortfolio(filters),
				offset,
			);
			trades = result.items;
			total = result.total;
		} finally {
			loading = false;
		}
	}

	const debouncedFetch = debounce((filters: TradeFilters) => {
		pageIndex = 0;
		void fetchTrades(filters, 0);
	}, 300);

	let initialFiltersChange: boolean = true;
	const storeSubscription: Unsubscriber = openedTradeFiltersStore.subscribe(
		(filters) => {
			if (initialFiltersChange) {
				initialFiltersChange = false;
				return;
			}

			if (filters.symbol?.trim()) {
				debouncedFetch(filters);
			} else {
				pageIndex = 0;
				void fetchTrades(filters, 0);
			}
		},
	);

	onDestroy(() => {
		storeSubscription();
	});

	function handlePageChange(nextPageIndex: number): void {
		pageIndex = nextPageIndex;
		void fetchTrades(get(openedTradeFiltersStore), nextPageIndex * TRADES_PAGE_SIZE);
	}
</script>

<section class="flex flex-col gap-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex flex-col gap-1">
			<p
				class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]"
			>
				Trade execution log
			</p>
			<h2
				class="text-2xl sm:text-[30px] font-extrabold tracking-tight text-[#1a1c1f]"
			>
				Opened trades
			</h2>
		</div>
		{#if !isArchived}
			<div class="flex flex-col sm:flex-row gap-3 shrink-0">
				<Button
					onclick={handleOpenImportDialog}
					class="w-full sm:w-auto bg-[#e2e2e6] hover:bg-[#e2e2e6]/80 text-[#1a1c1f] border-0"
				>
					<FileUp class="size-4" />
					Import from CSV
				</Button>
				<Button
					onclick={handleOpenTradeForm}
					class="w-full sm:w-auto bg-[#003d6d] hover:bg-[#003d6d]/90 text-white"
				>
					<Plus class="size-4" />
					Add Trade
				</Button>
			</div>
		{/if}
	</div>

	<TradeFiltersToolbar
		filters={openedTradeFiltersStore}
		availableTags={facets.tags}
		dateFieldHint="Filter by opened date"
	/>

	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No opened trades found"
		{trades}
		{total}
		{pageIndex}
		pageSize={TRADES_PAGE_SIZE}
		{loading}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
		onPageChange={handlePageChange}
	/>
</section>
