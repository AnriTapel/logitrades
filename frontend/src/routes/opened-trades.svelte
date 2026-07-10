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
	import type { Unsubscriber } from 'svelte/store';

	let {
		initialTrades,
		initialTotal,
		facets,
		handleOpenTradeForm,
		handleOpenImportDialog,
		handleTradeDelete,
		handleTradeEdit,
	}: {
		initialTrades: Trade[];
		initialTotal: number;
		facets: TradeFacets;
		handleOpenTradeForm: () => void;
		handleOpenImportDialog: () => void;
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
				'filterOpened',
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
		let currentFilters: TradeFilters = {
			symbol: '',
			tradeType: 'all',
			tags: [],
		};
		const unsub = openedTradeFiltersStore.subscribe((f) => {
			currentFilters = f;
		});
		unsub();
		void fetchTrades(currentFilters, nextPageIndex * TRADES_PAGE_SIZE);
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
	</div>

	<TradeFiltersToolbar
		filters={openedTradeFiltersStore}
		availableTags={facets.tags}
		dateFieldHint="Filter by opened date"
		disabled={loading}
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
