<script lang="ts">
	import { writable } from 'svelte/store';
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import type { Trade } from '$lib/types';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, FileUp } from 'lucide-svelte';

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

<section class="mb-6 md:mb-12">
	<div class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
		<h1 class="text-xl sm:text-2xl font-bold order-2 sm:order-1">Opened trades</h1>
		<div class="flex flex-col sm:flex-row gap-2 sm:items-center order-1 sm:order-2">
			<Button onclick={handleOpenImportDialog} variant="outline" class="w-full sm:w-auto">
				<FileUp /> Import from CSV
			</Button>
			<Button onclick={handleOpenTradeForm} class="w-full sm:w-auto">
				<Plus /> Add Trade
			</Button>
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
