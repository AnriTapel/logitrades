<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { deleteTrade } from '$lib';
	import type { PageData } from './$types';
	import TradeForm from './trade-form.svelte';
	import TradesTable from './trades-table.svelte';
	import { tradesStore } from '$lib/stores/trades';
	import ImportDialog from './import-dialog.svelte';
	import TopBar from './top-bar.svelte';

	let { data } = $props<{ data: PageData }>();
	let isTradeFormOpen = $state(false);
	let isImportDialogOpen = $state(false);

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

	function handleOpenImportDialog() {
		isImportDialogOpen = true;
	}

	function handleCloseImportDialog() {
		isImportDialogOpen = false;
	}
</script>

<div class="container mx-auto p-4">
	<TopBar {handleOpenTradeForm} {handleOpenImportDialog} />

	{#if isImportDialogOpen}
		<ImportDialog onCancel={handleCloseImportDialog} />
	{/if}

	{#if isTradeFormOpen}
		<TradeForm
			data={data.form}
			onCancel={handleCloseTradeForm}
			isEdit={Boolean(location.search.includes('edit'))}
		/>
	{/if}

	<TradesTable onDelete={handleTradeDelete} onEdit={handleTradeEdit} />
</div>
