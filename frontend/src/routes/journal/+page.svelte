<script lang="ts">
	import { invalidate, goto } from '$app/navigation';
	import type { PageData, PageProps } from './$types';
	import ImportDialog from '$lib/layouts/import-dialog.svelte';
	import StatsSummary from '$lib/layouts/stats-summary.svelte';
	import ConfirmationModal from '$lib/components/custom/confirmation-modal.svelte';
	import TradeDetailsDialog from '$lib/layouts/trade-details-dialog.svelte';
	import OpenedTrades from '../opened-trades.svelte';
	import ClosedTrades from '../closed-trades.svelte';
	import type { Trade } from '$lib/types';

	let { data }: PageProps = $props();
	let isImportDialogOpen = $state(false);
	let confirmDeleteTradeId = $state<number | null>(null);
	let viewedTrade = $state<Trade | null>(null);

	async function refreshJournalData(): Promise<void> {
		await invalidate('journal:trades');
		await invalidate('journal:facets');
		await invalidate('journal:summary');
	}

	function handleTradeView(trade: Trade) {
		viewedTrade = trade;
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
		handleCloseTradeDetailsDialog();
	}

	async function handleTradeEdit(tradeId: number) {
		handleCloseTradeDetailsDialog();
		await goto(`/trade?edit=${tradeId}`);
	}

	function handleOpenTradeForm() {
		goto('/trade');
	}

	function handleOpenImportDialog() {
		isImportDialogOpen = true;
	}

	function handleCloseTradeDetailsDialog() {
		viewedTrade = null;
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
	{handleTradeView}
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
	{handleTradeView}
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

<TradeDetailsDialog
	open={viewedTrade != null}
	onClose={handleCloseTradeDetailsDialog}
	trade={viewedTrade}
	existingSymbols={data.facets.symbols}
	existingTags={data.facets.tags}
	portfolios={data.portfolios ?? []}
	activePortfolioId={data.portfolioId}
	plan={data.plan ?? 'free'}
	portfolioSummary={data.portfolioSummary ?? null}
	onEdit={handleTradeEdit}
	onDelete={handleTradeDelete}
/>

<ConfirmationModal
	open={confirmDeleteTradeId != null}
	title="Delete trade"
	message="Are you sure you want to delete this trade? This cannot be undone."
	confirmButtonText="Delete"
	rejectButtonText="Cancel"
	onConfirm={handleConfirmTradeDelete}
	onReject={handleRejectTradeDelete}
/>
