<script lang="ts">
	import { writable } from 'svelte/store';
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import type { Trade } from '$lib/types';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';

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

<section class="mb-12">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold mb-2">Opened trades</h1>
		<div class="flex gap-2 items-center">
			<Button onclick={handleOpenImportDialog} variant="link"
				>Import from CSV</Button
			>
			<Button onclick={handleOpenTradeForm}>Add Trade <Plus /></Button>
		</div>
	</div>
	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No opened trades found"
		trades={openedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
