<script lang="ts">
	import TradesTable from '$lib/layouts/trades-table.svelte';
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

<section class="mb-8">
	<h1 class="text-2xl font-bold mb-2">Closed trades</h1>
	<TradesTable
		styling={{ maxBodyHeight: '40vh' }}
		noTradesMessage="No closed trades found"
		trades={closedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
