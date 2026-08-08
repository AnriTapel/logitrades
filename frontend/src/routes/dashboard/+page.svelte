<script lang="ts">
	import {
		BarChart,
		ValueStat,
		SymbolStatsTable,
		TradeTypeStats,
		EmptyState,
		TradeFiltersToolbar,
		LineChart,
		CalendarHeatmap,
	} from '$lib/components/custom';
	import type { PageProps } from './$types';
	import {
		dashboardFiltersStore,
		hasActiveDashboardFilters,
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
	import {
		createEquityCurveData,
		createPortfolioEquityCurveData,
		createMonthlyPnLData,
		createTradeTypeStats,
		getSymbolStats,
	} from '$lib/chartsHelpers';
	import RiskRewardChart from '$lib/layouts/risk-reward-chart.svelte';
	import Info from 'lucide-svelte/icons/info';
	import { submitTradeFilterAction } from '$lib/tradeListClient';
	import { debounce } from '$lib/inputDebounce';
	import type { TradeFilters } from '$lib/types';
	import { onDestroy } from 'svelte';

	let { data }: PageProps = $props();

	let closedTrades = $derived([...data.closedTrades.items]);

	$effect(() => {
		dashboardFiltersStore.update((prev) =>
			prev.portfolioId === data.portfolioId
				? prev
				: { ...prev, portfolioId: data.portfolioId },
		);
	});

	let hasActiveFilters = $derived(
		hasActiveDashboardFilters($dashboardFiltersStore),
	);

	let maxDrawdown = $derived(calcMaxDrawdown(closedTrades));
	let avgRiskReward = $derived(calcAverageRiskReward(closedTrades));

	const isPro = $derived(data.plan === 'pro' || data.plan === 'max');

	const equityCurveData = $derived.by(() => {
		// Portfolio equity needs the full closed-trade set + full ledger.
		// When filters are active, fall back to trade-only equity so cashflows
		// are not mixed with a filtered PnL subset.
		if (isPro && data.portfolioSummary && !hasActiveFilters) {
			return createPortfolioEquityCurveData(
				closedTrades,
				data.transactions ?? [],
				data.portfolioSummary.starting_capital ?? 0,
				data.portfolioSummary.started_at ?? null,
			);
		}
		return createEquityCurveData(closedTrades);
	});

	function withPortfolio(filters: TradeFilters): TradeFilters {
		return data.portfolioId != null
			? { ...filters, portfolioId: data.portfolioId }
			: filters;
	}

	async function fetchDashboardTrades(filters: TradeFilters): Promise<void> {
		const result = await submitTradeFilterAction(
			'filterDashboard',
			withPortfolio(filters),
		);
		closedTrades = result.items;
	}

	const debouncedFetch = debounce((filters: TradeFilters) => {
		void fetchDashboardTrades(filters);
	}, 300);

	let initialFiltersChange: boolean = true;
	let storeSubscription = dashboardFiltersStore.subscribe((filters) => {
		if (initialFiltersChange) {
			initialFiltersChange = false;
			return;
		}
		if (filters.symbol?.trim()) {
			debouncedFetch(filters);
		} else {
			void fetchDashboardTrades(filters);
		}
	});

	onDestroy(() => {
		storeSubscription();
	});
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

	{#if data.closedTrades.total > 0 || hasActiveFilters}
		<div class="mb-8">
			<TradeFiltersToolbar
				filters={dashboardFiltersStore}
				showSymbolFilter={false}
				availableTags={data.facets.tags}
				dateFieldHint="Filter by closed date"
			/>
		</div>

		{#if hasActiveFilters && closedTrades.length === 0}
			<EmptyState
				message="No closed trades match the selected filters"
				className="h-[30vh]"
			/>
		{:else}
			<h2 class="text-xl font-semibold mb-4">Performance Overview</h2>
			<div class="grid grid-cols-2 gap-y-8 mb-16 sm:grid-cols-3">
				<ValueStat
					label="Total PnL"
					value={pnlForPeriod(closedTrades)}
					type={'money'}
					bordered={false}
					baselineValue={0}
				/>
				<ValueStat
					label="Winrate"
					value={calcWinrate(closedTrades)}
					type={'percentage'}
					bordered={false}
					baselineValue={0.5}
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
					baselineValue={0}
				/>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Equity Analysis</h2>
			<div class="grid grid-cols-1 gap-8 sm:gap-4 mb-16 sm:grid-cols-4">
				<div
					class="col-span-1 p-4 border rounded-lg shadow-md flex flex-col gap-4 sm:col-span-3"
				>
					<p class="text-l font-bold">Equity Curve & Drawdown</p>
					{#if closedTrades.length}
						<LineChart data={equityCurveData} showLegend={false} />
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
						baselineValue={0}
					/>
					<ValueStat
						label="Gross Loss"
						value={calcGrossLoss(closedTrades)}
						type={'money'}
						className="flex-1 col-span-1"
						baselineValue={0}
					/>
				</div>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Daily PnL Heatmap</h2>
			<div class="mb-16 grid grid-cols-1 gap-4 md:grid-cols-5">
				<div
					class="p-4 border rounded-lg shadow-md flex flex-col gap-4 col-span-1 md:col-span-2"
				>
					{#if closedTrades.length}
						<CalendarHeatmap trades={closedTrades} monthsToShow={12} />
					{:else}
						<EmptyState message="Close a trade to see daily PnL" />
					{/if}
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
							value={calcAverageWin(closedTrades)}
							type={'money'}
							className="w-full lg:shadow-none"
							baselineValue={0}
						/>
						<ValueStat
							label="Avg Loss"
							value={calcAverageLoss(closedTrades)}
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
							value={calcAverageTradeDuration(closedTrades)}
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
							value={calcMaxWinStreak(closedTrades)}
							type={'integer'}
							className="w-full lg:shadow-none"
						/>
						<ValueStat
							label="Max Loss Streak"
							value={calcMaxLossStreak(closedTrades)}
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
					<RiskRewardChart {closedTrades} />
				</div>
				<div class="p-4 border rounded-lg shadow-md flex flex-col gap-4">
					<p class="text-l font-bold">Trade Type Stats</p>
					<TradeTypeStats data={createTradeTypeStats(closedTrades)} />
				</div>
				<div class="p-4 border rounded-lg shadow-md flex flex-col gap-4">
					<p class="text-l font-bold">Trade Pair Stats</p>
					<SymbolStatsTable data={getSymbolStats(closedTrades)} />
				</div>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Monthly Performance</h2>
			<div class="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3 sm:grid-cols-2">
				<div
					class="p-4 border rounded-lg shadow-md flex flex-col gap-4 col-span-1"
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
		{/if}
	{:else}
		<EmptyState
			message="Create or import your first trade to see stats"
			className="h-[30vh]"
		/>
	{/if}
</section>
