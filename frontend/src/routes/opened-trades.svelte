<script lang="ts">
	import { writable } from 'svelte/store';
	import TopBar from '$lib/layouts/top-bar.svelte';
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import type { Trade } from '$lib/types';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';

	let {
		handleOpenTradeForm,
		handleOpenImportDialog,
		handleTradeDelete,
		handleTradeEdit,
	}: {
		handleOpenTradeForm: () => void;
		handleOpenImportDialog: () => void;
		handleTradeDelete: (tradeId: number) => void;
		handleTradeEdit: (tradeId: number) => void;
	} = $props();

	let openedTrades = writable<Trade[]>([]);

	const storeSubscription = tradesStore.subscribe((value) => {
		openedTrades.set(value.filter((trade) => !trade.closePrice));
	});

	onDestroy(() => {
		storeSubscription();
	});
</script>

<section class="mb-8">
	<TopBar {handleOpenTradeForm} {handleOpenImportDialog} />
	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No opened trades found"
		trades={openedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
