<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
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

	async function handleTradeEdit(tradeId: number) {
		await goto(`?edit=${tradeId}`, { keepFocus: true });
		isTradeFormOpen = true;
	}

	function handleOpenTradeForm() {
		isTradeFormOpen = true;
	}

	function handleCloseTradeForm() {
		isTradeFormOpen = false;
		goto('?', { keepFocus: true }); // Remove edit param
	}
</script>

<div class="container mx-auto p-4">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-2xl font-bold">Your trades</h1>
		<Button on:click={handleOpenTradeForm}>Add Trade</Button>
	</div>

	{#if isTradeFormOpen}
		<TradeForm
			data={data.form}
			onCancel={handleCloseTradeForm}
			isEdit={Boolean(location.search.includes('edit'))}
		/>
	{/if}

	{#if $tradesStore.length > 0}
		<TradesTable
			trades={tradesStore}
			onDelete={handleTradeDelete}
			onEdit={handleTradeEdit}
		/>
	{/if}
</div>
