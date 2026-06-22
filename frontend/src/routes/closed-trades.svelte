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
		closedTrades.set(
			value.filter((trade) => trade.closePrice && trade.closedAt),
		);
	});

	onDestroy(() => {
		storeSubscription();
	});
</script>

<section class="flex flex-col gap-8">
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Historical records
		</p>
		<h2 class="text-2xl sm:text-[30px] font-extrabold tracking-tight text-[#1a1c1f]">
			Closed trades
		</h2>
	</div>

	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No closed trades found"
		trades={closedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
