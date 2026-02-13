<script lang="ts">
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import { tradesStore } from '$lib/stores/trades';
	import type { Trade } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

	let {
		handleTradeDelete,
		handleTradeEdit,
	}: {
		handleTradeDelete: (tradeId: number) => void;
		handleTradeEdit: (tradeId: number) => void;
	} = $props();

	let closedTrades = writable<Trade[]>([]);

	const storeSubscription = tradesStore.subscribe((value) => {
		// React to store updates if necessary
		closedTrades.set(value.filter((trade) => trade.closePrice));
	});

	onDestroy(() => {
		storeSubscription();
	});
</script>

<section class="mb-6 md:mb-12">
	<h1 class="text-xl sm:text-2xl font-bold mb-4">Closed trades</h1>
	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No closed trades found"
		trades={closedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
