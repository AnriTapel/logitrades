<script lang="ts">
	import {
		BarChart,
		ValueStat,
		SymbolStatsTable,
		TradeTypeStats,
		EmptyState,
		TagsFilterPopover,
	} from '$lib/components/custom';

	import { tradesStore } from '$lib/stores/trades';
	import {
		dashboardFiltersStore,
		applyDashboardFilters,
		resetDashboardFilters,
		hasActiveDashboardFilters,
		setDashboardTags,
	} from '$lib/stores/dashboard-filters';
	import {
		calcAverageLoss,
		calcAverageWin,
		calcProfitFactor,
		calcWinrate,
		calcExpectancy,
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
	import { Button } from '$lib/components/ui/button';
	import Info from 'lucide-svelte/icons/info';

	let closedTrades = $derived(
		$tradesStore.filter((it) => it.closePrice && it.closedAt),
	);

	let filteredClosedTrades = $derived(
		applyDashboardFilters(closedTrades, $dashboardFiltersStore),
	);

	const allTags = $derived(
		[...new Set($tradesStore.flatMap((t) => t.tags ?? []))].sort((a, b) =>
			a.localeCompare(b),
		),
	);

	let hasActiveFilters = $derived(
		hasActiveDashboardFilters($dashboardFiltersStore),
	);

	let maxDrawdown = $derived(calcMaxDrawdown(filteredClosedTrades));
	let avgRiskReward = $derived(calcAverageRiskReward(filteredClosedTrades));
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
		<div class="flex flex-wrap items-center gap-2 mb-8">
			<p class="text-sm font-medium text-muted-foreground mr-2">Filters</p>
			<TagsFilterPopover
				availableTags={allTags}
				selectedTags={$dashboardFiltersStore.tags}
				onSelectedTagsChange={setDashboardTags}
			/>
			{#if hasActiveFilters}
				<Button variant="ghost" size="sm" onclick={resetDashboardFilters}>
					Reset
				</Button>
			{/if}
		</div>

		{#if hasActiveFilters && filteredClosedTrades.length === 0}
			<EmptyState
				message="No closed trades match the selected filters"
				className="h-[30vh]"
			/>
		{:else}
			<h2 class="text-xl font-semibold mb-4">Performance Overview</h2>
			<div class="grid grid-cols-2 gap-y-8 mb-16 sm:grid-cols-3">
				<ValueStat
					label="Total PnL"
					value={pnlForPeriod(filteredClosedTrades)}
					type={'money'}
					bordered={false}
					baselineValue={0}
				/>
				<ValueStat
					label="Winrate"
					value={calcWinrate(filteredClosedTrades)}
					type={'percentage'}
					bordered={false}
					baselineValue={0.5}
				/>
				<ValueStat
					label="Total Trades"
					value={filteredClosedTrades.length}
					type={'integer'}
					bordered={false}
				/>
				<ValueStat
					label="Profit Factor"
					value={calcProfitFactor(filteredClosedTrades)}
					type={'integer'}
					bordered={false}
				/>
				<ValueStat
					label="Expectancy"
					value={calcExpectancy(filteredClosedTrades)}
					type={'money'}
					bordered={false}
					baselineValue={0}
				/>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Equity Analysis</h2>
			<div class="grid grid-cols-1 gap-8 sm:gap-4 mb-16 sm:grid-cols-4">
				<div
					class="col-span-1 p-4 border rounded-lg shadow-md flex flex-col gap-4 sm:col-span-3"
				>
					<p class="text-l font-bold">Equity Curve & Drawdown</p>
					{#if filteredClosedTrades.length}
						<LineChart
							data={createEquityCurveData(filteredClosedTrades)}
							showLegend={false}
						/>
					{:else}
						<EmptyState message="Close a trade to see your equity curve" />
					{/if}
				</div>
				<div class="grid grid-cols-2 flex flex-col gap-4 sm:grid-cols-1">
					<ValueStat
						label="Gross Profit"
						value={calcGrossProfit(filteredClosedTrades)}
						type={'money'}
						className="flex-1 col-span-1"
						baselineValue={0}
					/>
					<ValueStat
						label="Gross Loss"
						value={calcGrossLoss(filteredClosedTrades)}
						type={'money'}
						className="flex-1 col-span-1"
						baselineValue={0}
					/>
				</div>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Trade Statistics</h2>
			<div
				class="lg:shadow-md lg:border lg:rounded-lg lg:grid-cols-2 lg:gap-x-24 lg:gap-y-4 grid grid-cols-1 gap-8 mb-16"
			>
				<!-- Profitability -->
				<div class="lg:p-4 flex flex-col gap-4">
					<p class="text-l font-bold">Profitability</p>
					<div class="flex flex-col md:flex-row gap-4">
						<ValueStat
							label="Avg Win"
							value={calcAverageWin(filteredClosedTrades)}
							type={'money'}
							className="w-full lg:shadow-none"
							baselineValue={0}
						/>
						<ValueStat
							label="Avg Loss"
							value={calcAverageLoss(filteredClosedTrades)}
							type={'money'}
							className="w-full lg:shadow-none"
							baselineValue={0}
						/>
					</div>
				</div>
				<!-- Behavior -->
				<div class="lg:p-4 flex flex-col gap-4">
					<p class="text-l font-bold">Behavior</p>
					<div class="flex flex-col md:flex-row gap-4">
						<ValueStat
							label="Avg Trade Duration"
							value={calcAverageTradeDuration(filteredClosedTrades)}
							type={'string'}
							className="w-full lg:shadow-none"
						/>
						<ValueStat
							label="Avg Risk:Reward"
							value={avgRiskReward ?? 0}
							type={'integer'}
							className="w-full lg:shadow-none"
						/>
					</div>
				</div>
				<!-- Consistency -->
				<div class="lg:p-4 flex flex-col gap-4">
					<p class="text-l font-bold">Consistency</p>
					<div class="flex flex-col md:flex-row gap-4">
						<ValueStat
							label="Max Win Streak"
							value={calcMaxWinStreak(filteredClosedTrades)}
							type={'integer'}
							className="w-full lg:shadow-none"
						/>
						<ValueStat
							label="Max Loss Streak"
							value={calcMaxLossStreak(filteredClosedTrades)}
							type={'integer'}
							className="w-full lg:shadow-none"
						/>
					</div>
				</div>
				<!-- Risk -->
				<div class="lg:p-4 flex flex-col gap-4">
					<p class="text-l font-bold">Risk</p>
					<div class="flex flex-col md:flex-row gap-4">
						<ValueStat
							label="Max Drawdown"
							value={maxDrawdown.absolute}
							type={'money'}
							className="w-full lg:shadow-none"
							baselineValue={0}
						/>
						<ValueStat
							label="Max DD %"
							value={maxDrawdown.percentage}
							type={'percentage'}
							className="w-full lg:shadow-none"
							baselineValue={0}
						/>
					</div>
				</div>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Market Breakdown</h2>
			<div
				class="grid grid-cols-1 sm:gap-4 gap-8 mb-16 xl:grid-cols-3 sm:grid-cols-2"
			>
				<div class="p-4 border rounded-lg shadow-md flex flex-col gap-4">
					<p class="text-l font-bold">Risk Reward Distribution</p>
					<RiskRewardChart closedTrades={filteredClosedTrades} />
				</div>
				<div class="p-4 border rounded-lg shadow-md flex flex-col gap-4">
					<p class="text-l font-bold">Trade Type Stats</p>
					<TradeTypeStats data={createTradeTypeStats(filteredClosedTrades)} />
				</div>
				<div class="p-4 border rounded-lg shadow-md flex flex-col gap-4">
					<p class="text-l font-bold">Trade Pair Stats</p>
					<SymbolStatsTable data={getSymbolStats(filteredClosedTrades)} />
				</div>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Monthly Performance</h2>
			<div class="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3 sm:grid-cols-2">
				<div
					class="p-4 border rounded-lg shadow-md flex flex-col gap-4 col-span-1"
				>
					<p class="text-l font-bold">Monthly PnL</p>
					{#if filteredClosedTrades.length}
						<BarChart
							data={createMonthlyPnLData(filteredClosedTrades)}
							showLegend={false}
							height={310}
						/>
					{:else}
						<EmptyState message="Close a trade to see monthly P&L" />
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		<EmptyState
			message="Create or import your first trade to see stats"
			className="h-[30vh]"
		/>
	{/if}
</section>
