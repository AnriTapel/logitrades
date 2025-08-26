<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { deleteTrade } from '$lib';
	import type { PageData } from './$types';
	import TradeForm from './trade-form.svelte';
	import TradesTable from './trades-table.svelte';
	import { tradesStore } from '$lib/stores/trades';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props<{ data: PageData }>();
	let isTradeFormOpen = $state(false);

	$effect(() => {
		tradesStore.set(data.trades);
	});

	async function handleTradeDelete(tradeId: number) {
		await deleteTrade(tradeId);
		await invalidateAll();
	}

	function handleOpenTradeForm() {
		isTradeFormOpen = true;
	}

	function handleCloseTradeForm() {
		isTradeFormOpen = false;
	}
</script>

<div class="container mx-auto p-4">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-2xl font-bold">Your trades</h1>
		<Button on:click={handleOpenTradeForm}>Add Trade</Button>
	</div>

	<TradeForm
		data={data.form}
		open={isTradeFormOpen}
		onCancel={handleCloseTradeForm}
	/>

	<TradesTable trades={tradesStore} onDelete={handleTradeDelete} />
</div>
