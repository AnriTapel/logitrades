<script lang="ts">
	import {
		BarChart,
		ValueStat,
		SymbolStatsTable,
		TagStatsTable,
		TradeTypeStats,
		EmptyState,
		SectionCard,
		TradeFiltersToolbar,
		LineChart,
		CalendarHeatmap,
	} from '$lib/components/custom';
	import ToggleGroup from '$lib/components/custom/toggle-group.svelte';
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
		calcAveragePlannedRiskReward,
		calcAverageRealizedR,
		calcBestTrade,
		calcWorstTrade,
		calcPayoffRatio,
		calcRecoveryFactor,
		calcSharpeRatio,
		calcCurrentStreak,
		calcTotalFees,
		pnlForPeriod,
	} from '$lib/calcFunctions';
	import {
		createEquityCurveData,
		createPortfolioEquityCurveData,
		createPeriodicPnLData,
		createWeekdayPnLData,
		createTradeTypeStats,
		getSymbolStats,
		getTagStats,
		type PnlGranularity,
		type PnlMode,
	} from '$lib/chartsHelpers';
	import RiskRewardChart from '$lib/layouts/risk-reward-chart.svelte';
	import Info from 'lucide-svelte/icons/info';
	import { submitTradeFilterAction } from '$lib/tradeListClient';
	import { debounce } from '$lib/inputDebounce';
	import type { Trade, TradeFilters } from '$lib/types';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';

	const STORAGE_KEYS = {
		pnlGranularity: 'dashboard.pnlGranularity',
		pnlMode: 'dashboard.pnlMode',
		equityTimeframe: 'dashboard.equityTimeframe',
	} as const;

	const pnlGranularityOptions = [
		{ label: 'D', value: 'daily' },
		{ label: 'W', value: 'weekly' },
		{ label: 'M', value: 'monthly' },
		{ label: 'Y', value: 'yearly' },
	];

	const pnlModeOptions = [
		{ label: 'Period', value: 'periodic' },
		{ label: 'Cumulative', value: 'cumulative' },
	];

	const equityTimeframeOptions = [
		{ label: 'D', value: 'daily' },
		{ label: 'W', value: 'weekly' },
		{ label: 'M', value: 'monthly' },
	];

	function readStoredPreference<T extends string>(
		key: string,
		allowed: readonly T[],
		fallback: T,
	): T {
		if (!browser) return fallback;
		const stored = localStorage.getItem(key);
		return stored && allowed.includes(stored as T) ? (stored as T) : fallback;
	}

	let { data }: PageProps = $props();

	let closedTrades = $state<Trade[]>([]);

	$effect(() => {
		closedTrades = [...data.closedTrades.items];
	});

	let pnlGranularity = $state<PnlGranularity>(
		readStoredPreference(
			STORAGE_KEYS.pnlGranularity,
			['daily', 'weekly', 'monthly', 'yearly'],
			'monthly',
		),
	);
	let pnlMode = $state<PnlMode>(
		readStoredPreference(
			STORAGE_KEYS.pnlMode,
			['periodic', 'cumulative'],
			'periodic',
		),
	);
	let equityTimeframe = $state<'daily' | 'weekly' | 'monthly'>(
		readStoredPreference(
			STORAGE_KEYS.equityTimeframe,
			['daily', 'weekly', 'monthly'],
			'daily',
		),
	);

	$effect(() => {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEYS.pnlGranularity, pnlGranularity);
	});

	$effect(() => {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEYS.pnlMode, pnlMode);
	});

	$effect(() => {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEYS.equityTimeframe, equityTimeframe);
	});

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
	let avgPlannedRiskReward = $derived(calcAveragePlannedRiskReward(closedTrades));
	let avgRealizedR = $derived(calcAverageRealizedR(closedTrades));
	let payoffRatio = $derived(calcPayoffRatio(closedTrades));
	let recoveryFactor = $derived(calcRecoveryFactor(closedTrades));
	let sharpeRatio = $derived(calcSharpeRatio(closedTrades));
	let currentStreak = $derived(calcCurrentStreak(closedTrades));
	let bestTrade = $derived(calcBestTrade(closedTrades));
	let worstTrade = $derived(calcWorstTrade(closedTrades));

	const streakDisplay = $derived(
		currentStreak
			? `${currentStreak.count} ${currentStreak.type === 'win' ? 'wins' : 'losses'}`
			: '—',
	);

	const pnlChartTitle = $derived(
		pnlMode === 'cumulative'
			? `Cumulative ${pnlGranularity.charAt(0).toUpperCase()}${pnlGranularity.slice(1)} PnL`
			: `${pnlGranularity.charAt(0).toUpperCase()}${pnlGranularity.slice(1)} PnL`,
	);

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
				equityTimeframe,
			);
		}
		return createEquityCurveData(closedTrades, 0, equityTimeframe);
	});

	const periodicPnLData = $derived(
		createPeriodicPnLData(closedTrades, pnlGranularity, pnlMode),
	);
	const weekdayPnLData = $derived(createWeekdayPnLData(closedTrades));
	const tagStats = $derived(getTagStats(closedTrades));

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
					type={'decimal'}
					bordered={false}
				/>
				<ValueStat
					label="Expectancy"
					value={calcExpectancy(closedTrades)}
					type={'money'}
					bordered={false}
					baselineValue={0}
				/>
				<ValueStat
					label="Total Fees"
					value={calcTotalFees(closedTrades)}
					type={'money'}
					bordered={false}
				/>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Equity Analysis</h2>
			<div class="grid grid-cols-1 gap-8 sm:gap-4 mb-16 sm:grid-cols-4">
				<SectionCard
					title="Equity Curve & Drawdown"
					class="col-span-1 sm:col-span-3"
				>
					{#snippet action()}
						<ToggleGroup
							options={equityTimeframeOptions}
							bind:value={equityTimeframe}
							label="Equity timeframe"
						/>
					{/snippet}
					{#if closedTrades.length}
						<LineChart data={equityCurveData} showLegend={false} />
					{:else}
						<EmptyState message="Close a trade to see your equity curve" />
					{/if}
				</SectionCard>
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

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Trade Statistics</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-16">
				<SectionCard
					title="Profitability"
					contentClass="grid grid-cols-2 gap-4"
				>
					<ValueStat
						label="Avg Win"
						value={calcAverageWin(closedTrades)}
						type={'money'}
						bordered={false}
						baselineValue={0}
					/>
					<ValueStat
						label="Avg Loss"
						value={calcAverageLoss(closedTrades)}
						type={'money'}
						bordered={false}
						baselineValue={0}
					/>
					<ValueStat
						label="Best Trade"
						value={bestTrade ?? '—'}
						type={bestTrade != null ? 'money' : 'string'}
						bordered={false}
						baselineValue={0}
					/>
					<ValueStat
						label="Worst Trade"
						value={worstTrade ?? '—'}
						type={worstTrade != null ? 'money' : 'string'}
						bordered={false}
						baselineValue={0}
					/>
					<ValueStat
						label="Payoff Ratio"
						value={payoffRatio ?? '—'}
						type={payoffRatio != null ? 'decimal' : 'string'}
						bordered={false}
					/>
				</SectionCard>

				<SectionCard title="Behavior" contentClass="grid grid-cols-2 gap-4">
					<ValueStat
						label="Avg Trade Duration"
						value={calcAverageTradeDuration(closedTrades)}
						type={'string'}
						bordered={false}
					/>
					<ValueStat
						label="Avg Risk:Reward"
						value={avgPlannedRiskReward ?? '—'}
						type={avgPlannedRiskReward != null ? 'decimal' : 'string'}
						bordered={false}
					/>
					<ValueStat
						label="Avg Realized R"
						value={avgRealizedR ?? '—'}
						type={avgRealizedR != null ? 'decimal' : 'string'}
						bordered={false}
					/>
					<ValueStat
						label="Current Streak"
						value={streakDisplay}
						type={'string'}
						bordered={false}
					/>
				</SectionCard>

				<SectionCard title="Consistency" contentClass="grid grid-cols-2 gap-4">
					<ValueStat
						label="Max Win Streak"
						value={calcMaxWinStreak(closedTrades)}
						type={'integer'}
						bordered={false}
					/>
					<ValueStat
						label="Max Loss Streak"
						value={calcMaxLossStreak(closedTrades)}
						type={'integer'}
						bordered={false}
					/>
				</SectionCard>

				<SectionCard title="Risk" contentClass="grid grid-cols-2 gap-4">
					<ValueStat
						label="Max Drawdown"
						value={maxDrawdown.absolute}
						type={'money'}
						bordered={false}
						baselineValue={0}
					/>
					<ValueStat
						label="Max DD %"
						value={maxDrawdown.percentage}
						type={'percentage'}
						bordered={false}
						baselineValue={0}
					/>
					<ValueStat
						label="Recovery Factor"
						value={recoveryFactor ?? '—'}
						type={recoveryFactor != null ? 'decimal' : 'string'}
						bordered={false}
					/>
					<ValueStat
						label="Sharpe Ratio"
						value={sharpeRatio != null ? sharpeRatio.toFixed(2) : '—'}
						type={'string'}
						bordered={false}
					/>
				</SectionCard>

				<div class="grid col-span-1 gap-4 md:col-span-2 xl:col-span-4 mt-4">
					<SectionCard
						title="Daily PnL Heatmap"
						class="max-w-full md:max-w-[400px] w-full"
					>
						{#if closedTrades.length}
							<CalendarHeatmap trades={closedTrades} monthsToShow={12} />
						{:else}
							<EmptyState message="Close a trade to see daily PnL" />
						{/if}
					</SectionCard>
				</div>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Market Breakdown</h2>
			<div
				class="grid grid-cols-1 sm:gap-4 gap-8 mb-16 xl:grid-cols-3 sm:grid-cols-2"
			>
				<SectionCard title="Risk Reward Distribution">
					<RiskRewardChart {closedTrades} />
				</SectionCard>
				<SectionCard title="Trade Type Stats">
					<TradeTypeStats data={createTradeTypeStats(closedTrades)} />
				</SectionCard>
				<SectionCard title="Trade Pair Stats">
					<SymbolStatsTable data={getSymbolStats(closedTrades)} />
				</SectionCard>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Patterns</h2>
			<div
				class="grid grid-cols-1 sm:gap-4 gap-8 mb-16 xl:grid-cols-3 sm:grid-cols-2"
			>
				<SectionCard title="PnL by Weekday">
					{#if closedTrades.length}
						<BarChart data={weekdayPnLData} showLegend={false} height={310} />
					{:else}
						<EmptyState message="Close a trade to see weekday PnL" />
					{/if}
				</SectionCard>
				<SectionCard title="Tag Stats">
					<TagStatsTable data={tagStats} />
				</SectionCard>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">PnL Performance</h2>
			<div class="grid grid-cols-1 gap-4 xl:grid-cols-3 sm:grid-cols-2">
				<SectionCard title={pnlChartTitle} class="col-span-1">
					{#snippet action()}
						<div class="flex flex-wrap items-center gap-2">
							<ToggleGroup
								options={pnlGranularityOptions}
								bind:value={pnlGranularity}
								label="PnL granularity"
							/>
							<ToggleGroup
								options={pnlModeOptions}
								bind:value={pnlMode}
								label="PnL mode"
							/>
						</div>
					{/snippet}
					{#if closedTrades.length}
						<BarChart data={periodicPnLData} showLegend={false} height={310} />
					{:else}
						<EmptyState message="Close a trade to see P&L" />
					{/if}
				</SectionCard>
			</div>
		{/if}
	{:else}
		<EmptyState
			message="Create or import your first trade to see stats"
			className="h-[30vh]"
		/>
	{/if}
</section>
