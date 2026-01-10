<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		pnlForPeriod,
		totalTradedVolumeForPeriod,
		totalEquityInOpenedTrades,
	} from '$lib/calcFunctions';
	import { formatIntToCurrency } from '$lib/formatters';
	import { tradesStore } from '$lib/stores/trades';
	import { onDestroy } from 'svelte';
	import { isAuthenticated } from '$lib/stores/auth';

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

	let authenticated = $state(false);

	const unsubscribeAuth = isAuthenticated.subscribe((value) => {
		authenticated = value;
	});

	const unsubscibe = tradesStore.subscribe((trades) => {
		const pivotDate = new Date();
		pivotDate.setDate(pivotDate.getDate() - 7);

		const last7DaysTrades = trades.filter(
			(trade) => new Date(trade.openedAt) >= pivotDate
		);

		pnlLast7Days = pnlForPeriod(last7DaysTrades);
		volumeLast7Days = totalTradedVolumeForPeriod(last7DaysTrades);

		const openTrades = trades.filter((trade) => !trade.closePrice);
		equityInOpenTrades = totalEquityInOpenedTrades(openTrades);
	});

	onDestroy(() => {
		unsubscibe();
		unsubscribeAuth();
	});
</script>

<div class="flex justify-between items-center mb-4">
	<h1 class="text-2xl font-bold">Opened trades</h1>

	<div class="flex gap-12 mt-4">
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
				{formatIntToCurrency(volumeLast7Days)}
			</div>
		</div>
		<div>
			<div class="text-sm text-gray-500">Open Equity</div>
			<div class="text-lg font-semibold">
				{formatIntToCurrency(equityInOpenTrades)}
			</div>
		</div>
	</div>

	<div class="flex gap-2">
		<Button onclick={handleOpenTradeForm}>Add Trade</Button>
		<Button onclick={handleOpenImportDialog} variant="outline"
			>Import from CSV</Button
		>
		{#if authenticated}
			<form action="/?/logout" method="POST">
				<Button type="submit" variant="outline">Logout</Button>
			</form>
		{:else}
			<a href="/login">
				<Button variant="outline">Login</Button>
			</a>
		{/if}
	</div>
</div>
