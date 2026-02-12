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
		calcExpectancy,
		calcBestTrade,
		calcWorstTrade,
		calcMaxWinStreak,
		calcMaxLossStreak,
		calcAverageTradeDuration,
		calcMaxDrawdown,
		calcGrossProfit,
		calcGrossLoss,
		calcAverageRiskReward,
		pnlForPeriod,
	} from '$lib/calcFunctions';
	import LineChart from '$lib/components/custom/charts/line-chart.svelte';
	import {
		createEquityCurveData,
		createMonthlyPnLData,
		createTradeTypeStats,
		getSymbolStats,
	} from '$lib/chartsHelpers';
	import RiskRewardChart from '$lib/layouts/risk-reward-chart.svelte';
	import Info from 'lucide-svelte/icons/info';

	let closedTrades = $derived(
		$tradesStore.filter((it) => it.closePrice && it.closedAt),
	);

	let maxDrawdown = $derived(calcMaxDrawdown(closedTrades));
	let avgRiskReward = $derived(calcAverageRiskReward(closedTrades));
</script>

<svelte:head>
	<title>Trading Dashboard - Analytics & Performance Stats | LogiTrades</title>
</svelte:head>

<section class="mb-12">
	<div class="flex gap-1 items-start mb-8 text-sm sm:items-center">
		<Info class="size-6 sm:size-4" />
		<span class="text-sm"
			>All statistics are calculated using closed trades only. Open trades are
			excluded.</span
		>
	</div>

	{#if $tradesStore.length}
		<h2 class="text-xl font-semibold mb-4">Performance Overview</h2>
		<div class="grid grid-cols-2 gap-y-8 mb-16 sm:grid-cols-3">
			<ValueStat
				label="Total PnL"
				value={pnlForPeriod(closedTrades)}
				type={'money'}
				bordered={false}
			/>
			<ValueStat
				label="Winrate"
				value={calcWinrate(closedTrades)}
				type={'percentage'}
				bordered={false}
			/>
			<ValueStat
				label="Total Trades"
				value={closedTrades.length}
				type={'integer'}
				bordered={false}
			/>
			<ValueStat
				label="Profit Factor"
				value={calcProfitFactor(closedTrades)}
				type={'integer'}
				bordered={false}
			/>
			<ValueStat
				label="Expectancy"
				value={calcExpectancy(closedTrades)}
				type={'money'}
				bordered={false}
			/>
		</div>

		<h2 class="text-xl font-semibold mb-4">Equity Analysis</h2>
		<div class="grid grid-cols-1 gap-4 mb-16 sm:grid-cols-4">
			<div
				class="col-span-1 p-4 border rounded-lg shadow-sm flex flex-col gap-4 sm:col-span-3"
			>
				<p class="text-l font-bold">Equity Curve & Drawdown</p>
				{#if closedTrades.length}
					<LineChart
						data={createEquityCurveData(closedTrades)}
						showLegend={false}
					/>
				{:else}
					<EmptyState message="Close a trade to see your equity curve" />
				{/if}
			</div>
			<div class="grid grid-cols-2 flex flex-col gap-4 sm:grid-cols-1">
				<ValueStat
					label="Gross Profit"
					value={calcGrossProfit(closedTrades)}
					type={'money'}
					className="flex-1 col-span-1"
				/>
				<ValueStat
					label="Gross Loss"
					value={calcGrossLoss(closedTrades)}
					type={'money'}
					className="flex-1 col-span-1"
				/>
			</div>
		</div>

		<h2 class="text-xl font-semibold mb-4">Trade Statistics</h2>
		<div class="grid grid-cols-2 gap-4 mb-16 sm:grid-cols-4">
			<ValueStat
				className="col-span-1"
				label="Avg Win"
				value={calcAverageWin(closedTrades)}
				type={'money'}
			/>
			<ValueStat
				className="col-span-1"
				label="Avg Loss"
				value={calcAverageLoss(closedTrades)}
				type={'money'}
			/>
			<ValueStat
				className="col-span-1"
				label="Best Trade"
				value={calcBestTrade(closedTrades) ?? 0}
				type={'money'}
			/>
			<ValueStat
				className="col-span-1"
				label="Worst Trade"
				value={calcWorstTrade(closedTrades) ?? 0}
				type={'money'}
			/>
			<ValueStat
				className="col-span-1"
				label="Max Win Streak"
				value={calcMaxWinStreak(closedTrades)}
				type={'integer'}
			/>
			<ValueStat
				className="col-span-1"
				label="Max Loss Streak"
				value={calcMaxLossStreak(closedTrades)}
				type={'integer'}
			/>
			<ValueStat
				className="col-span-1"
				label="Avg Trade Duration"
				value={calcAverageTradeDuration(closedTrades)}
				type={'string'}
			/>
			<ValueStat
				className="col-span-1"
				label="Avg Risk:Reward"
				value={avgRiskReward ?? 0}
				type={'integer'}
			/>
			<ValueStat
				className="col-span-1"
				label="Max Drawdown"
				value={maxDrawdown.absolute}
				type={'money'}
			/>
			<ValueStat
				className="col-span-1"
				label="Max DD %"
				value={maxDrawdown.percentage}
				type={'percentage'}
			/>
		</div>

		<h2 class="text-xl font-semibold mb-4">Market Breakdown</h2>
		<div class="grid grid-cols-1 gap-4 mb-16 xl:grid-cols-3 sm:grid-cols-2">
			<div class="p-4 border rounded-lg shadow-sm flex flex-col gap-4">
				<p class="text-l font-bold">Risk Reward Distribution</p>
				<RiskRewardChart {closedTrades} />
			</div>
			<div class="p-4 border rounded-lg shadow-sm flex flex-col gap-4">
				<p class="text-l font-bold">Trade Type Stats</p>
				<TradeTypeStats data={createTradeTypeStats(closedTrades)} />
			</div>
			<div class="p-4 border rounded-lg shadow-sm flex flex-col gap-4">
				<p class="text-l font-bold">Trade Pair Stats</p>
				<SymbolStatsTable data={getSymbolStats(closedTrades)} />
			</div>
		</div>

		<h2 class="text-xl font-semibold mb-4">Monthly Performance</h2>
		<div class="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3 sm:grid-cols-2">
			<div
				class="p-4 border rounded-lg shadow-sm flex flex-col gap-4 col-span-1"
			>
				<p class="text-l font-bold">Monthly PnL</p>
				{#if closedTrades.length}
					<BarChart
						data={createMonthlyPnLData(closedTrades)}
						showLegend={false}
						height={310}
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
