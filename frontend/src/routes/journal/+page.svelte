<script lang="ts">
	import { invalidate, goto } from '$app/navigation';
	import type { PageData } from './$types';
	import ImportDialog from '$lib/layouts/import-dialog.svelte';
	import StatsSummary from '$lib/layouts/stats-summary.svelte';
	import ConfirmationModal from '$lib/components/custom/confirmation-modal.svelte';
	import OpenedTrades from '../opened-trades.svelte';
	import ClosedTrades from '../closed-trades.svelte';

	let { data }: { data: PageData } = $props();
	let isImportDialogOpen = $state(false);
	let confirmDeleteTradeId = $state<number | null>(null);

	async function refreshJournalData(): Promise<void> {
		await invalidate('journal:trades');
		await invalidate('journal:facets');
		await invalidate('journal:summary');
	}

	function handleTradeDelete(tradeId: number) {
		confirmDeleteTradeId = tradeId;
	}

	function handleRejectTradeDelete() {
		confirmDeleteTradeId = null;
	}

	async function handleConfirmTradeDelete() {
		const tradeId = confirmDeleteTradeId;
		if (tradeId == null) return;

		confirmDeleteTradeId = null;

		const formData = new FormData();
		formData.append('tradeId', tradeId.toString());

		await fetch('?/delete', {
			method: 'POST',
			body: formData,
		});

		await refreshJournalData();
	}

	async function handleTradeEdit(tradeId: number) {
		await goto(`/trade?edit=${tradeId}`);
	}

	function handleOpenTradeForm() {
		goto('/trade');
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

<StatsSummary
	summary={data.summary}
	portfolioSummary={data.portfolioSummary ?? null}
	plan={data.plan ?? 'free'}
	isArchived={data.isArchived ?? false}
/>

<OpenedTrades
	initialTrades={data.openedTrades.items}
	initialTotal={data.openedTrades.total}
	facets={data.facets}
	{handleTradeDelete}
	{handleTradeEdit}
	{handleOpenTradeForm}
	{handleOpenImportDialog}
	isArchived={data.isArchived ?? false}
	portfolioId={data.portfolioId}
/>

<ClosedTrades
	initialTrades={data.closedTrades.items}
	initialTotal={data.closedTrades.total}
	facets={data.facets}
	{handleTradeDelete}
	{handleTradeEdit}
	isArchived={data.isArchived ?? false}
	portfolioId={data.portfolioId}
/>

{#if isImportDialogOpen}
	<ImportDialog
		onCancel={handleCloseImportDialog}
		portfolioId={data.portfolioId}
		isArchived={data.isArchived ?? false}
	/>
{/if}

<ConfirmationModal
	open={confirmDeleteTradeId != null}
	title="Delete trade"
	message="Are you sure you want to delete this trade? This cannot be undone."
	confirmButtonText="Delete"
	rejectButtonText="Cancel"
	onConfirm={handleConfirmTradeDelete}
	onReject={handleRejectTradeDelete}
/>
