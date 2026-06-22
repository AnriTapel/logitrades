<script lang="ts">
	import { writable } from 'svelte/store';
	import TradesDataTable from '$lib/layouts/trades-data-table.svelte';
	import type { Trade } from '$lib/types';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import Plus from 'lucide-svelte/icons/plus';
	import FileUp from 'lucide-svelte/icons/file-up';

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

<section class="flex flex-col gap-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex flex-col gap-1">
			<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
				Trade execution log
			</p>
			<h2 class="text-2xl sm:text-[30px] font-extrabold tracking-tight text-[#1a1c1f]">
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

	<TradesDataTable
		styling={{ maxBodyHeight: '60vh' }}
		noTradesMessage="No opened trades found"
		trades={openedTrades}
		onDelete={handleTradeDelete}
		onEdit={handleTradeEdit}
	/>
</section>
