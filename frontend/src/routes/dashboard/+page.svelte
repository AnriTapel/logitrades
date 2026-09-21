<script lang="ts">
	import {
		BarChart,
		ValueStat,
		TradeTypeStats,
		EmptyState,
		SectionCard,
		TradeFiltersToolbar,
		LineChart,
		CalendarHeatmap,
		RankedGroupTable,
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
		calcMaxWinStreak,
		calcMaxDrawdown,
		calcPayoffRatio,
		calcRecoveryFactor,
		calcSharpeRatio,
		calcBestTrade,
		calcWorstTrade,
		calcTotalFees,
		pnlForPeriod,
	} from '$lib/calcFunctions';
	import {
		buildCoachingHero,
		calcHoldTimeSplit,
		calcHonorRates,
		calcFeeDrag,
		calcSizeConsistency,
		calcStreakVsMax,
		calcConcentration,
		rankTags,
		rankSymbols,
		formatDurationMs,
	} from '$lib/coachingCalcs';
	import {
		createEquityCurveData,
		createPortfolioEquityCurveData,
		createPeriodicPnLData,
		createWeekdayExpectancyData,
		createHourExpectancyData,
		createTradeTypeStats,
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
	import { formatNumber, formatNumberPercentage } from '$lib/formatters';

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

	const hero = $derived(buildCoachingHero(closedTrades));
	const muted = $derived(!hero.sampleOk);
	const maxDrawdown = $derived(calcMaxDrawdown(closedTrades));
	const payoffRatio = $derived(calcPayoffRatio(closedTrades));
	const recoveryFactor = $derived(calcRecoveryFactor(closedTrades));
	const holdTimes = $derived(calcHoldTimeSplit(closedTrades));
	const honor = $derived(calcHonorRates(closedTrades));
	const feeDrag = $derived(calcFeeDrag(closedTrades));
	const sizeConsistency = $derived(calcSizeConsistency(closedTrades));
	const streakVsMax = $derived(calcStreakVsMax(closedTrades));
	const concentration = $derived(calcConcentration(closedTrades));
	const tagRanks = $derived(rankTags(closedTrades));
	const symbolRanks = $derived(rankSymbols(closedTrades));
	const sharpeRatio = $derived(calcSharpeRatio(closedTrades));
	const bestTrade = $derived(calcBestTrade(closedTrades));
	const worstTrade = $derived(calcWorstTrade(closedTrades));

	const winrateCopy = $derived.by(() => {
		if (hero.requiredWinrate == null) return '—';
		return `${formatNumberPercentage(hero.winrate)} vs ${formatNumberPercentage(hero.requiredWinrate)} needed`;
	});

	const planCaptureCopy = $derived.by(() => {
		if (hero.plannedRR == null || hero.realizedR == null) return '—';
		return `${formatNumber(hero.plannedRR, 1)}R planned → ${formatNumber(hero.realizedR, 2)}R realized`;
	});

	const pnlChartTitle = $derived(
		pnlMode === 'cumulative'
			? `Cumulative ${pnlGranularity.charAt(0).toUpperCase()}${pnlGranularity.slice(1)} PnL`
			: `${pnlGranularity.charAt(0).toUpperCase()}${pnlGranularity.slice(1)} PnL`,
	);

	const isPro = $derived(data.plan === 'pro' || data.plan === 'max');

	const equityCurveData = $derived.by(() => {
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
	const weekdayPnLData = $derived(createWeekdayExpectancyData(closedTrades));
	const hourPnLData = $derived(createHourExpectancyData(closedTrades));

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
			<h2 class="text-xl font-semibold mb-4">Coaching</h2>
			<div class="grid grid-cols-2 gap-y-8 mb-16 sm:grid-cols-3">
				<ValueStat
					label="Total PnL"
					value={pnlForPeriod(closedTrades)}
					type="money"
					bordered={false}
					baselineValue={0}
					hint="after fees"
				/>
				<ValueStat
					label="Expectancy"
					value={hero.expectancy}
					type="money"
					bordered={false}
					baselineValue={0}
					{muted}
					hint="per closed trade"
				/>
				<ValueStat
					label="Expectancy (R)"
					value={hero.expectancyR ?? '—'}
					type={hero.expectancyR != null ? 'decimal' : 'string'}
					bordered={false}
					baselineValue={hero.expectancyR != null ? 0 : undefined}
					{muted}
				/>
				<ValueStat
					label="Winrate vs plan"
					value={winrateCopy}
					type="string"
					bordered={false}
					className={muted
						? ''
						: hero.winrateVsRequired != null && hero.winrateVsRequired >= 0
							? '[&_span]:text-green-600'
							: hero.winrateVsRequired != null
								? '[&_span]:text-red-600'
								: ''}
				/>
				<ValueStat
					label="Plan vs capture"
					value={planCaptureCopy}
					type="string"
					bordered={false}
					hint={hero.captureGap != null && hero.captureGap < -0.5
						? 'not getting paid for the plan'
						: undefined}
				/>
				<ValueStat
					label="Profit Factor"
					value={hero.profitFactor}
					type="decimal"
					bordered={false}
					baselineValue={1}
					{muted}
				/>
				<ValueStat
					label="Sample"
					value={hero.n}
					type="integer"
					bordered={false}
					hint={hero.sampleOk
						? `${formatNumberPercentage(hero.percentWithSl)} with SL`
						: `thin — ${formatNumberPercentage(hero.percentWithSl)} with SL`}
				/>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Equity</h2>
			<div class="mb-16">
				<SectionCard title="Equity Curve & Drawdown">
					{#snippet action()}
						<ToggleGroup
							options={equityTimeframeOptions}
							bind:value={equityTimeframe}
							label="Equity timeframe"
						/>
					{/snippet}
					{#if closedTrades.length}
						<LineChart data={equityCurveData} showLegend={false} />
						{#if !isPro}
							<div class="flex gap-1 items-start text-xs sm:items-center">
								<Info class="size-6 sm:size-4" />
								<span class="text-slate-500">
									Curve starts at 0 (trade PnL only). Pro accounts include
									starting capital and cashflows.
								</span>
							</div>
						{/if}
					{:else}
						<EmptyState message="Close a trade to see your equity curve" />
					{/if}
				</SectionCard>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Process</h2>
			<div class="grid grid-cols-2 gap-y-8 mb-16 sm:grid-cols-3 xl:grid-cols-4">
				<ValueStat
					label="Hold time winners"
					value={formatDurationMs(holdTimes.winnersMs)}
					type="string"
					bordered={false}
				/>
				<ValueStat
					label="Hold time losers"
					value={formatDurationMs(holdTimes.losersMs)}
					type="string"
					bordered={false}
					hint={holdTimes.hoping ? 'losers held ≥ 2× winners' : undefined}
				/>
				<ValueStat
					label="SL honor"
					value={honor.slHonorRate ?? '—'}
					type={honor.slHonorRate != null ? 'percentage' : 'string'}
					bordered={false}
					baselineValue={honor.slHonorRate != null ? 0.8 : undefined}
					{muted}
				/>
				<ValueStat
					label="Winners cut short"
					value={honor.cutWinnerRate ?? '—'}
					type={honor.cutWinnerRate != null ? 'percentage' : 'string'}
					bordered={false}
					{muted}
					hint="closed before TP"
				/>
				<ValueStat
					label="Fee drag"
					value={feeDrag ?? '—'}
					type={feeDrag != null ? 'percentage' : 'string'}
					bordered={false}
					{muted}
					hint="fees / gross profit"
				/>
				<ValueStat
					label="Size consistency"
					value={sizeConsistency ?? '—'}
					type={sizeConsistency != null ? 'percentage' : 'string'}
					bordered={false}
					{muted}
					hint="within ±20% of median size"
				/>
				<ValueStat
					label="Loss streak"
					value={`${streakVsMax.currentLossStreak} / max ${streakVsMax.maxLossStreak}`}
					type="string"
					bordered={false}
					hint={streakVsMax.atWorst ? 'at your worst streak' : undefined}
				/>
				<ValueStat
					label="Concentration"
					value={concentration ?? '—'}
					type={concentration != null ? 'percentage' : 'string'}
					bordered={false}
					{muted}
					hint="best trade / gross profit"
				/>
			</div>

			<div class="grid grid-cols-1 md:flex md:flex-row gap-4 mb-16">
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
				<SectionCard
					title="Risk Reward Distribution"
					class="max-w-full md:max-w-[450px] w-full"
				>
					<RiskRewardChart {closedTrades} />
				</SectionCard>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Where</h2>
			<div
				class="grid grid-cols-1 sm:gap-4 gap-8 mb-16 xl:grid-cols-3 sm:grid-cols-2"
			>
				<SectionCard title="Trade Type">
					<TradeTypeStats data={createTradeTypeStats(closedTrades)} />
				</SectionCard>
				<SectionCard title="Tags">
					<RankedGroupTable
						rows={tagRanks}
						emptyLabel="Need ≥ 5 trades per tag"
					/>
				</SectionCard>
				<SectionCard title="Pairs">
					<RankedGroupTable
						rows={symbolRanks}
						emptyLabel="Need ≥ 5 trades per pair"
					/>
				</SectionCard>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Timing (UTC)</h2>
			<div class="grid grid-cols-1 sm:gap-4 gap-8 mb-16 xl:grid-cols-2">
				<SectionCard title="Mean PnL by weekday">
					{#if closedTrades.length}
						<BarChart data={weekdayPnLData} showLegend={false} height={310} />
						<div class="flex gap-1 items-start text-xs sm:items-center">
							<Info class="size-6 sm:size-4" />
							<span class="text-slate-500">Gray bars have n &lt; 10.</span>
						</div>
					{:else}
						<EmptyState message="Close a trade to see weekday PnL" />
					{/if}
				</SectionCard>
				<SectionCard title="Mean PnL by open hour">
					{#if closedTrades.length}
						<BarChart data={hourPnLData} showLegend={false} height={310} />
					{:else}
						<EmptyState message="Close a trade to see hour PnL" />
					{/if}
				</SectionCard>
			</div>

			<h2 class="text-xl font-semibold lg:mb-4 mb-8">Secondary</h2>
			<div class="grid grid-cols-2 gap-y-8 mb-16 sm:grid-cols-4">
				<ValueStat
					label="Avg Win"
					value={calcAverageWin(closedTrades)}
					type="money"
					bordered={false}
				/>
				<ValueStat
					label="Avg Loss"
					value={calcAverageLoss(closedTrades)}
					type="money"
					bordered={false}
				/>
				<ValueStat
					label="Payoff Ratio"
					value={payoffRatio ?? '—'}
					type={payoffRatio != null ? 'decimal' : 'string'}
					bordered={false}
					{muted}
				/>
				<ValueStat
					label="Max Drawdown"
					value={maxDrawdown.absolute}
					type="money"
					bordered={false}
				/>
				<ValueStat
					label="Recovery Factor"
					value={recoveryFactor ?? '—'}
					type={recoveryFactor != null ? 'decimal' : 'string'}
					bordered={false}
					baselineValue={recoveryFactor != null ? 1 : undefined}
					{muted}
				/>
			</div>

			<details class="mb-8">
				<summary class="text-xl font-semibold cursor-pointer mb-8"
					>Reports</summary
				>
				<div class="grid grid-cols-2 gap-y-8 mb-8 sm:grid-cols-3">
					<ValueStat
						label="PnL consistency (ann.)"
						value={sharpeRatio != null ? sharpeRatio.toFixed(2) : '—'}
						type="string"
						bordered={false}
					/>
					{#if isPro}
						<ValueStat
							label="Max DD %"
							value={maxDrawdown.percentage}
							type="percentage"
							bordered={false}
						/>
					{/if}
					<ValueStat
						label="Best Trade"
						value={bestTrade ?? '—'}
						type={bestTrade != null ? 'money' : 'string'}
						bordered={false}
					/>
					<ValueStat
						label="Worst Trade"
						value={worstTrade ?? '—'}
						type={worstTrade != null ? 'money' : 'string'}
						bordered={false}
					/>
					<ValueStat
						label="Max Win Streak"
						value={calcMaxWinStreak(closedTrades)}
						type="integer"
						bordered={false}
					/>
					<ValueStat
						label="Total Fees"
						value={calcTotalFees(closedTrades)}
						type="money"
						bordered={false}
					/>
				</div>
				<SectionCard title={pnlChartTitle}>
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
			</details>
		{/if}
	{:else}
		<EmptyState
			message="Create or import your first trade to see stats"
			className="h-[30vh]"
		/>
	{/if}
</section>
