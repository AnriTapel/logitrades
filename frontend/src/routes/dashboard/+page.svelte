<script lang="ts">
	import {
		BarChart,
		ValueStat,
		SymbolStatsTable,
		TradeTypeStats,
		EmptyState,
	} from '$lib/components/custom';

	import { tradesStore } from '$lib/stores/trades';
	import {
		calcAverageLoss,
		calcAverageWin,
		calcProfitFactor,
		calcWinrate,
	} from '$lib/calcFunctions';
	import LineChart from '$lib/components/custom/charts/line-chart.svelte';
	import {
		createEquityCurveData,
		createMonthlyPnLData,
		createTradeTypeStats,
		getSymbolStats,
	} from '$lib/chartsHelpers';
	import RiskRewardChart from '$lib/layouts/risk-reward-chart.svelte';

	let closedTrades = $derived(
		$tradesStore.filter((it) => it.closePrice && it.closedAt),
	);
</script>

<svelte:head>
	<title>Trading Dashboard - Analytics & Performance Stats | LogiTrades</title>
</svelte:head>

<section class="mb-12">
	<h1 class="text-2xl font-bold mb-4">Stats dashboard</h1>

	{#if $tradesStore.length}
		<div
			class="grid grid-cols-3 gap-4 grid-rows-[repeat(2,minmax(0,380px))] mb-4"
		>
			<div class="grid grid-cols-2 gap-4">
				<ValueStat
					label="Winrate"
					value={calcWinrate(closedTrades)}
					type={'percentage'}
				/>

				<ValueStat
					label="Average Win"
					value={calcAverageWin($tradesStore)}
					type={'money'}
				/>

				<ValueStat
					label="Average Loss"
					value={calcAverageLoss($tradesStore)}
					type={'money'}
				/>

				<ValueStat
					label="Profit Factor"
					value={calcProfitFactor($tradesStore)}
					type={'integer'}
				/>
			</div>

			<div
				class="p-4 border grow rounded-lg shadow-sm w-full flex flex-col gap-4"
			>
				<p class="text-l font-bold">Equity Curve & Drawdown</p>
				{#if closedTrades.length}
					<LineChart
						data={createEquityCurveData($tradesStore)}
						showLegend={false}
					/>
				{:else}
					<EmptyState message="Close a trade to see your equity curve" />
				{/if}
			</div>

			<div
				class="p-4 border grow rounded-lg shadow-sm w-full flex flex-col gap-4"
			>
				<p class="text-l font-bold">Trade Pair Stats</p>
				<SymbolStatsTable data={getSymbolStats($tradesStore)} />
			</div>

			<div
				class="p-4 border grow rounded-lg shadow-sm w-full flex flex-col gap-4"
			>
				<p class="text-l font-bold">Trade Type Stats</p>
				<TradeTypeStats data={createTradeTypeStats($tradesStore)} />
			</div>

			<div
				class="p-4 border grow rounded-lg shadow-sm w-full flex flex-col gap-4"
			>
				<p class="text-l font-bold">Risk Reward Distribution</p>
				<RiskRewardChart {closedTrades} />
			</div>

			<div
				class="p-4 border grow rounded-lg shadow-sm w-full flex flex-col gap-4"
			>
				<p class="text-l font-bold">Monthly PnL</p>
				{#if closedTrades.length}
					<BarChart
						data={createMonthlyPnLData($tradesStore)}
						showLegend={false}
					/>
				{:else}
					<EmptyState message="Close a trade to see monthly P&L" />
				{/if}
			</div>
		</div>
	{:else}
		<EmptyState
			message="Create or import your first trade to see stats"
			className="h-[30vh]"
		/>
	{/if}
</section>
