<script lang="ts">
	import { invalidate, goto } from '$app/navigation';
	import type { PageData } from './$types';
	import TradeForm from '$lib/layouts/trade-form.svelte';
	import ImportDialog from '$lib/layouts/import-dialog.svelte';
	import StatsSummary from '$lib/layouts/stats-summary.svelte';
	import OpenedTrades from '../opened-trades.svelte';
	import ClosedTrades from '../closed-trades.svelte';

	let { data }: { data: PageData } = $props();
	let isTradeFormOpen = $state(false);
	let isImportDialogOpen = $state(false);

	$effect(() => {
		if (data.isEditMode || data.isAddMode) {
			isTradeFormOpen = true;
		} else {
			isTradeFormOpen = false;
		}
	});

	async function refreshJournalData(): Promise<void> {
		await invalidate('journal:trades');
		await invalidate('journal:facets');
		await invalidate('journal:summary');
	}

	async function handleTradeDelete(tradeId: number) {
		const formData = new FormData();
		formData.append('tradeId', tradeId.toString());

		await fetch('?/delete', {
			method: 'POST',
			body: formData,
		});

		await refreshJournalData();
	}

	async function handleTradeEdit(tradeId: number) {
		await goto(`?edit=${tradeId}`, { keepFocus: true });
		isTradeFormOpen = true;
	}

	function handleOpenTradeForm() {
		isTradeFormOpen = true;
		goto('?add=true', { keepFocus: true });
	}

	function handleCloseTradeForm() {
		isTradeFormOpen = false;
		goto('?', { keepFocus: true });
	}

	function handleOpenImportDialog() {
		isImportDialogOpen = true;
	}

	async function handleCloseImportDialog() {
		isImportDialogOpen = false;
		await refreshJournalData();
		await invalidate('dashboard:trades');
		await invalidate('dashboard:facets');
	}
</script>

<svelte:head>
	<title
		>LogiTrades - Trading Journal & Analytics Platform | Track & Analyze Your
		Trades</title
	>
</svelte:head>

<StatsSummary summary={data.summary} />

<OpenedTrades
	initialTrades={data.openedTrades.items}
	initialTotal={data.openedTrades.total}
	facets={data.facets}
	{handleTradeDelete}
	{handleTradeEdit}
	{handleOpenTradeForm}
	{handleOpenImportDialog}
/>

<ClosedTrades
	initialTrades={data.closedTrades.items}
	initialTotal={data.closedTrades.total}
	facets={data.facets}
	{handleTradeDelete}
	{handleTradeEdit}
/>

{#if isImportDialogOpen}
	<ImportDialog onCancel={handleCloseImportDialog} />
{/if}

{#if isTradeFormOpen}
	<TradeForm
		data={data.form}
		onCancel={handleCloseTradeForm}
		existingSymbols={data.facets.symbols}
		existingTags={data.facets.tags}
		isEdit={data.isEditMode}
	/>
{/if}
