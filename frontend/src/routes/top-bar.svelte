<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		pnlForPeriod,
		totalTradedVolumeForPeriod,
		totalEquityInOpenedTrades,
	} from '$lib/calcFunctions';
	import { formatIntToCurrency, formatNumber } from '$lib/formatters';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';

	const {
		handleOpenTradeForm,
		handleOpenImportDialog,
	}: {
		handleOpenTradeForm: () => void;
		handleOpenImportDialog: () => void;
	} = $props();

	let pnlLast7Days: number = $state(0);
	let volumeLast7Days: number = $state(0);
	let equityInOpenTrades: number = $state(0);

	const unsubscibe = tradesStore.subscribe((trades) => {
		const today = new Date();
		const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));

		const last7DaysTrades = trades.filter(
			(trade) => new Date(trade.openedAt) >= sevenDaysAgo
		);

		pnlLast7Days = pnlForPeriod(last7DaysTrades);
		volumeLast7Days = totalTradedVolumeForPeriod(last7DaysTrades);

		const openTrades = trades.filter((trade) => !trade.closePrice);
		equityInOpenTrades = totalEquityInOpenedTrades(openTrades);
	});

	onDestroy(() => {
		unsubscibe();
	});
</script>

<div class="flex justify-between items-center mb-4">
	<h1 class="text-2xl font-bold">Your trades</h1>

	{#if $tradesStore.length > 0}
		<div class="flex gap-8 mt-4">
			<div>
				<div class="text-sm text-gray-500">7-Day PnL</div>
				<div
					class="text-lg font-semibold"
					class:text-green-600={pnlLast7Days > 0}
					class:text-red-600={pnlLast7Days < 0}
				>
					{formatIntToCurrency(pnlLast7Days)}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-500">7-Day Volume</div>
				<div class="text-lg font-semibold">
					{formatNumber(volumeLast7Days)}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-500">Open Equity</div>
				<div class="text-lg font-semibold">
					{formatIntToCurrency(equityInOpenTrades)}
				</div>
			</div>
		</div>
	{/if}

	<div class="flex gap-2">
		<Button on:click={handleOpenTradeForm}>Add Trade</Button>
		<Button on:click={handleOpenImportDialog} variant="outline"
			>Import from CSV</Button
		>
	</div>
</div>
