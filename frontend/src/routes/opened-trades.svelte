<script lang="ts">
	import { writable } from 'svelte/store';
	import TopBar from './top-bar.svelte';
	import TradesTable from './trades-table.svelte';
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
	<TradesTable
		trades={openedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
