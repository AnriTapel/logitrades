<script lang="ts">
	import {
		pnlForPeriod,
		totalTradedVolumeForPeriod,
		totalEquityInOpenedTrades,
		calcAbsolutePnl,
	} from '$lib/calcFunctions';
	import { formatIntToCurrency } from '$lib/formatters';
	import { tradesStore } from '$lib/stores/trades';
	import { localeStore } from '$lib/stores/locale';
	import { getFinancialColor, cn } from '$lib/utils';
	import { onDestroy } from 'svelte';

	let pnlLast7Days = $state(0);
	let volumeLast7Days = $state(0);
	let equityInOpenTrades = $state(0);
	let totalPnL = $state(0);

	const unsubscribeTrades = tradesStore.subscribe((trades) => {
		const pivotDate = new Date();
		pivotDate.setDate(pivotDate.getDate() - 7);

		const last7DaysTrades = trades.filter(
			(trade) => new Date(trade.openedAt) >= pivotDate,
		);

		totalPnL = trades.reduce((acc, trade) => {
			return acc + (calcAbsolutePnl(trade) ?? 0);
		}, 0);

		pnlLast7Days = pnlForPeriod(last7DaysTrades);
		volumeLast7Days = totalTradedVolumeForPeriod(last7DaysTrades);

		const openTrades = trades.filter((trade) => !trade.closePrice);
		equityInOpenTrades = totalEquityInOpenedTrades(openTrades);
	});

	onDestroy(() => {
		unsubscribeTrades();
	});

	const stats = $derived([
		{
			label: 'Open Equity',
			value: formatIntToCurrency(equityInOpenTrades, $localeStore.currency),
			colorClass: 'text-[#003d6d]',
		},
		{
			label: '7-Day Volume',
			value: formatIntToCurrency(volumeLast7Days, $localeStore.currency),
			colorClass: 'text-[#1a1c1f]',
		},
		{
			label: '7-Day PnL',
			value: formatIntToCurrency(pnlLast7Days, $localeStore.currency),
			colorClass: getFinancialColor(pnlLast7Days, 0),
		},
		{
			label: 'Total PnL',
			value: formatIntToCurrency(totalPnL, $localeStore.currency),
			colorClass: getFinancialColor(totalPnL, 0),
		},
	]);
</script>

<section class="flex flex-col gap-8">
	<div class="flex flex-col gap-1">
		<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c6076]">
			Your trading stats
		</p>
		<h2 class="text-2xl font-extrabold tracking-tight text-[#1a1c1f]">Summary</h2>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
		{#each stats as stat}
			<div
				class="flex flex-col gap-2 rounded-lg border border-white bg-[#f3f3f7] p-6"
			>
				<p class="text-xs font-bold uppercase tracking-wider text-[#4c6076]">
					{stat.label}
				</p>
				<p class={cn('text-2xl font-bold tracking-tight', stat.colorClass)}>
					{stat.value}
				</p>
			</div>
		{/each}
	</div>
</section>
