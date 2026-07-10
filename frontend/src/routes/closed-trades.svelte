<script lang="ts">
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import { TradeFiltersToolbar } from '$lib/components/custom';
	import type { Trade, TradeFacets, TradeFilters } from '$lib/types';
	import {
		closedTradeFiltersStore,
		setClosedTradeFilters,
	} from '$lib/stores/closed-trade-filters';
	import { submitTradeFilterAction } from '$lib/tradeListClient';
	import { debounce } from '$lib/inputDebounce';
	import { TRADES_PAGE_SIZE } from '$lib/constants/trades';
	import { onDestroy } from 'svelte';

	let {
		initialTrades,
		initialTotal,
		facets,
		handleTradeDelete,
		handleTradeEdit,
	}: {
		initialTrades: Trade[];
		initialTotal: number;
		facets: TradeFacets;
		handleTradeDelete: (tradeId: number) => void;
		handleTradeEdit: (tradeId: number) => void;
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

	async function fetchTrades(
		filters: TradeFilters,
		offset: number,
	): Promise<void> {
		loading = true;
		try {
			const result = await submitTradeFilterAction(
				'filterClosed',
				filters,
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
	const storeSubscription = closedTradeFiltersStore.subscribe((filters) => {
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
	});

	onDestroy(() => {
		storeSubscription();
	});

	function handlePageChange(nextPageIndex: number): void {
		pageIndex = nextPageIndex;
		let currentFilters: TradeFilters = {
			symbol: '',
			tradeType: 'all',
			tags: [],
		};
		const unsub = closedTradeFiltersStore.subscribe((f) => {
			currentFilters = f;
		});
		unsub();
		void fetchTrades(currentFilters, nextPageIndex * TRADES_PAGE_SIZE);
	}
</script>

<section class="flex flex-col gap-8">
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Historical records
		</p>
		<h2
			class="text-2xl sm:text-[30px] font-extrabold tracking-tight text-[#1a1c1f]"
		>
			Closed trades
		</h2>
	</div>

	<TradeFiltersToolbar
		filters={closedTradeFiltersStore}
		availableTags={facets.tags}
		dateFieldHint="Filter by closed date"
		disabled={loading}
	/>

	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No closed trades found"
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
