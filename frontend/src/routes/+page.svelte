<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import type { PageData } from './$types';
	import TradeForm from './_components/trade-form.svelte';
	import { tradesStore } from '$lib/stores/trades';
	import ImportDialog from './_components/import-dialog.svelte';
	import OpenedTrades from './opened-trades.svelte';
	import ClosedTrades from './closed-trades.svelte';
	import DashboardPreview from './dashboard-preview.svelte';

	let { data }: { data: PageData } = $props();
	let isTradeFormOpen = $state(false);
	let isImportDialogOpen = $state(false);

	$effect(() => {
		tradesStore.set(data.trades);
	});

	$effect(() => {
		if (!data.isEditMode) {
			isTradeFormOpen = false;
		}
	});

	async function handleTradeDelete(tradeId: number) {
		const formData = new FormData();
		formData.append('tradeId', tradeId.toString());

		await fetch('?/delete', {
			method: 'POST',
			body: formData,
		});

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

<OpenedTrades
	{handleTradeDelete}
	{handleTradeEdit}
	{handleOpenTradeForm}
	{handleOpenImportDialog}
/>

<ClosedTrades {handleTradeDelete} {handleTradeEdit} />

<DashboardPreview />

{#if isImportDialogOpen}
	<ImportDialog onCancel={handleCloseImportDialog} />
{/if}

{#if isTradeFormOpen}
	<TradeForm
		data={data.form}
		onCancel={handleCloseTradeForm}
		isEdit={data.isEditMode}
	/>
{/if}
