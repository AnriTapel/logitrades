import {
	calcAbsolutePnl,
	calcWinrate,
	pnlForPeriod,
	totalTradedVolumeForPeriod,
} from './calcFunctions';
import { chartTheme } from './chart-theme';
import type { BalanceTransaction, BarChartData, LineChartData, PieChartData, Trade } from './types';

/**
 *
 * Layout utils
 *
 */

const financialColors = {
	profit: chartTheme.profit,
	loss: chartTheme.loss,
	neutral: chartTheme.neutral,
	primary: chartTheme.primary,
	secondary: 'hsl(209.1 55% 52%)',
	accent1: 'hsl(209.1 40% 58%)',
	accent2: 'hsl(200 15% 55%)',
	accent3: 'hsl(200 10.5% 65%)',
	accent4: 'hsl(200 8.6% 40%)',
} as const;

// Generate cohesive color palette with similar tones
export const getColorPalette = (count: number): string[] => {
	const colors = [
		financialColors.primary,
		financialColors.secondary,
		financialColors.accent1,
		financialColors.accent2,
		financialColors.accent3,
		financialColors.accent4,
		financialColors.neutral,
	];

	const palette: string[] = [];
	for (let i = 0; i < count; i++) {
		palette.push(colors[i % colors.length]);
	}
	return palette;
};

/**
 *
 * Data convertion functions
 *
 */

// Date formatting helpers
function formatDateDDMMMYY(dateStr: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: '2-digit',
	}).format(new Date(dateStr));
}

function formatDateMMMYY(dateStr: string): string {
	// dateStr is in format "YYYY-MM"
	const [year, month] = dateStr.split('-');
	return new Intl.DateTimeFormat('en-GB', {
		month: 'short',
		year: '2-digit',
	}).format(new Date(parseInt(year), parseInt(month) - 1));
}

// Convert a Date to "YYYY-MM" month key format (local time, used by equity curve)
function toMonthKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		'0',
	)}`;
}

export type PnlGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PnlMode = 'periodic' | 'cumulative';

const GRANULARITY_CONFIG: Record<
	PnlGranularity,
	{ count: number | null; label: string }
> = {
	daily: { count: 30, label: 'Daily P&L' },
	weekly: { count: 12, label: 'Weekly P&L' },
	monthly: { count: 12, label: 'Monthly P&L' },
	yearly: { count: null, label: 'Yearly P&L' },
};

function toUtcDayKey(isoDate: string): string {
	return isoDate.slice(0, 10);
}

function toUtcWeekKey(isoDate: string): string {
	const date = new Date(isoDate);
	const day = date.getUTCDay();
	const diff = day === 0 ? -6 : 1 - day;
	const monday = new Date(date);
	monday.setUTCDate(date.getUTCDate() + diff);
	return monday.toISOString().slice(0, 10);
}

function toUtcMonthKey(isoDate: string): string {
	const date = new Date(isoDate);
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function toUtcYearKey(isoDate: string): string {
	return String(new Date(isoDate).getUTCFullYear());
}

function toPeriodKey(isoDate: string, granularity: PnlGranularity): string {
	switch (granularity) {
		case 'daily':
			return toUtcDayKey(isoDate);
		case 'weekly':
			return toUtcWeekKey(isoDate);
		case 'monthly':
			return toUtcMonthKey(isoDate);
		case 'yearly':
			return toUtcYearKey(isoDate);
	}
}

function getCurrentPeriodKey(granularity: PnlGranularity): string {
	return toPeriodKey(new Date().toISOString(), granularity);
}

function getWindowStartKey(granularity: PnlGranularity): string | null {
	const now = new Date();
	switch (granularity) {
		case 'daily': {
			const start = new Date(now);
			start.setUTCDate(start.getUTCDate() - 30);
			return toUtcDayKey(start.toISOString());
		}
		case 'weekly': {
			const weekDate = new Date(toUtcWeekKey(now.toISOString()));
			weekDate.setUTCDate(weekDate.getUTCDate() - 12 * 7);
			return toUtcWeekKey(weekDate.toISOString());
		}
		case 'monthly': {
			return toUtcMonthKey(
				new Date(
					Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 1),
				).toISOString(),
			);
		}
		case 'yearly':
			return null;
	}
}

function addPeriod(
	startKey: string,
	offset: number,
	granularity: PnlGranularity,
): string {
	switch (granularity) {
		case 'daily': {
			const date = new Date(startKey);
			date.setUTCDate(date.getUTCDate() + offset);
			return toUtcDayKey(date.toISOString());
		}
		case 'weekly': {
			const date = new Date(startKey);
			date.setUTCDate(date.getUTCDate() + offset * 7);
			return toUtcWeekKey(date.toISOString());
		}
		case 'monthly': {
			const [year, month] = startKey.split('-').map(Number);
			return toUtcMonthKey(
				new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString(),
			);
		}
		case 'yearly':
			return String(parseInt(startKey, 10) + offset);
	}
}

function generatePeriodRange(
	startKey: string,
	count: number,
	granularity: PnlGranularity,
): string[] {
	const result: string[] = [];
	for (let i = 0; i < count; i++) {
		result.push(addPeriod(startKey, i, granularity));
	}
	return result;
}

function formatPeriodLabel(key: string, granularity: PnlGranularity): string {
	switch (granularity) {
		case 'monthly':
			return formatDateMMMYY(key);
		case 'yearly':
			return key;
		default:
			return formatDateDDMMMYY(key);
	}
}

export function createPeriodicPnLData(
	trades: Trade[],
	granularity: PnlGranularity = 'monthly',
	mode: PnlMode = 'periodic',
): BarChartData {
	const pnlByPeriod = new Map<string, number>();

	for (const trade of trades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null || !trade.closedAt) continue;
		const periodKey = toPeriodKey(trade.closedAt, granularity);
		pnlByPeriod.set(periodKey, (pnlByPeriod.get(periodKey) ?? 0) + pnl);
	}

	const config = GRANULARITY_CONFIG[granularity];
	let periodsToDisplay: string[];

	if (granularity === 'yearly') {
		const yearsWithData = Array.from(pnlByPeriod.keys()).sort();
		const currentYear = getCurrentPeriodKey('yearly');
		const startYear = yearsWithData[0] || currentYear;
		const count = parseInt(currentYear, 10) - parseInt(startYear, 10) + 1;
		periodsToDisplay = generatePeriodRange(startYear, count, 'yearly');
	} else {
		const windowStart = getWindowStartKey(granularity)!;
		const currentPeriod = getCurrentPeriodKey(granularity);
		const periodsWithData = Array.from(pnlByPeriod.keys())
			.filter((period) => period >= windowStart && period <= currentPeriod)
			.sort();
		const startPeriod = periodsWithData[0] || currentPeriod;
		periodsToDisplay = generatePeriodRange(
			startPeriod,
			config.count!,
			granularity,
		);
	}

	const periodicValues = periodsToDisplay.map(
		(period) => pnlByPeriod.get(period) ?? null,
	);
	const dataValues =
		mode === 'cumulative'
			? periodicValues.reduce<(number | null)[]>((acc, value) => {
					const previous = acc.length > 0 ? (acc[acc.length - 1] ?? 0) : 0;
					const next = previous + (value ?? 0);
					acc.push(next);
					return acc;
				}, [])
			: periodicValues;

	const datasetLabel =
		mode === 'cumulative' ? `Cumulative ${config.label}` : config.label;

	return {
		labels: periodsToDisplay.map((period) =>
			formatPeriodLabel(period, granularity),
		),
		datasets: [
			{
				label: datasetLabel,
				data: dataValues,
				backgroundColor: dataValues.map((pnl) => {
					if (pnl == null) return 'transparent';
					return pnl >= 0 ? financialColors.profit : financialColors.loss;
				}),
				borderWidth: 0,
				borderRadius: 4,
			},
		],
	};
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function createWeekdayPnLData(trades: Trade[]): BarChartData {
	const pnlByWeekday = new Array<number>(7).fill(0);

	for (const trade of trades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null || !trade.closedAt) continue;
		const day = new Date(trade.closedAt).getUTCDay();
		const index = day === 0 ? 6 : day - 1;
		pnlByWeekday[index] += pnl;
	}

	return {
		labels: WEEKDAY_LABELS,
		datasets: [
			{
				label: 'PnL by Weekday',
				data: pnlByWeekday,
				backgroundColor: pnlByWeekday.map((pnl) =>
					pnl >= 0 ? financialColors.profit : financialColors.loss,
				),
				borderWidth: 0,
				borderRadius: 4,
			},
		],
	};
}

export type SymbolStatsRow = {
	symbol: string;
	pnl: number;
	notionalVolume: number;
	winrate: number;
};

export function getSymbolStats(allTrades: Trade[]): SymbolStatsRow[] {
	const statsBySymbol = Object.groupBy(allTrades, (trade) => trade.symbol);

	return Object.entries(statsBySymbol)
		.map(([symbol, trades = []]) => {
			return {
				symbol,
				pnl: pnlForPeriod(trades),
				notionalVolume: totalTradedVolumeForPeriod(trades),
				winrate: calcWinrate(trades),
			};
		})
		.sort((a, b) => b.notionalVolume - a.notionalVolume);
}

export type TagStatsRow = {
	tag: string;
	pnl: number;
	tradesCount: number;
	winrate: number;
};

export function getTagStats(trades: Trade[]): TagStatsRow[] {
	const statsByTag = new Map<string, Trade[]>();

	for (const trade of trades) {
		if (!trade.tags?.length) continue;
		for (const tag of trade.tags) {
			const existing = statsByTag.get(tag) ?? [];
			existing.push(trade);
			statsByTag.set(tag, existing);
		}
	}

	return Array.from(statsByTag.entries())
		.map(([tag, tagTrades]) => ({
			tag,
			pnl: pnlForPeriod(tagTrades),
			tradesCount: tagTrades.length,
			winrate: calcWinrate(tagTrades),
		}))
		.sort((a, b) => b.pnl - a.pnl)
		.slice(0, 10);
}

export type TradeTypeStats = {
	type: 'long' | 'short';
	tradeCount: number;
	winrate: number;
	pnl: number;
};

export function createTradeTypeStats(trades: Trade[]): TradeTypeStats[] {
	const calculateStats = (tradeType: 'buy' | 'sell'): TradeTypeStats => {
		const filteredTrades = trades.filter((t) => t.tradeType === tradeType);
		const closedTrades = filteredTrades.filter(
			(t) => t.closePrice && t.closedAt,
		);
		const wins = closedTrades.filter((t) => {
			const pnl = calcAbsolutePnl(t);
			return pnl !== null && pnl > 0;
		}).length;

		return {
			type: tradeType === 'buy' ? 'long' : 'short',
			tradeCount: filteredTrades.length,
			winrate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
			pnl: pnlForPeriod(closedTrades),
		};
	};

	return [calculateStats('buy'), calculateStats('sell')];
}

// Helper function to create equity curve data
export function createEquityCurveData(
	trades: Trade[],
	initialBalance: number = 0,
	timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
): LineChartData {
	// Get all closed trades sorted by close date
	const closedTrades = trades
		.filter((trade) => trade.closePrice && trade.closedAt)
		.reverse() // Assuming trades are sorted by closedAt descending
		.map((trade) => ({
			...trade,
			pnl: calcAbsolutePnl(trade) ?? 0,
			closeDate: new Date(trade.closedAt!),
		}));

	// Group trades by timeframe
	const equityByTimeframe = new Map<string, number>();
	let cumulativePnL = 0;

	closedTrades.forEach((trade) => {
		const date = trade.closeDate;
		let key: string;

		switch (timeframe) {
			case 'daily':
				key = date.toISOString().split('T')[0];
				break;
			case 'weekly':
				const weekStart = new Date(date);
				weekStart.setDate(date.getDate() - date.getDay());
				key = weekStart.toISOString().split('T')[0];
				break;
			case 'monthly':
				key = toMonthKey(date);
				break;
		}

		cumulativePnL += trade.pnl;
		equityByTimeframe.set(key, initialBalance + cumulativePnL);
	});

	// Convert to array and sort by date
	const sortedEntries = Array.from(equityByTimeframe.entries()).sort(
		([a], [b]) => a.localeCompare(b),
	);

	// Create labels and data arrays with formatted dates
	const labels = sortedEntries.map(([date]) => {
		if (timeframe === 'monthly') {
			return formatDateMMMYY(date);
		}
		return formatDateDDMMMYY(date);
	});
	const equityData = sortedEntries.map(([, equity]) => equity);

	// Calculate drawdown data if requested
	const drawdownData = calculateDrawdown(equityData);

	return {
		labels,
		datasets: [
			{
				label: 'Equity Curve',
				data: equityData,
				borderColor: financialColors.primary,
				backgroundColor: 'hsl(209.1 65.4% 40.8% / 0.15)',
				tension: 0.4,
				fill: false,
				borderWidth: 3,
				pointRadius: 0,
				pointHoverRadius: 6,
			},
			// Add drawdown dataset if requested
			...(drawdownData.length > 0
				? [
						{
							label: 'Drawdown',
							data: drawdownData,
							borderColor: financialColors.loss,
							backgroundColor: 'hsl(0 40% 48% / 0.22)',
							tension: 0.4,
							fill: '+1', // Fill to the previous dataset
							borderWidth: 2,
							pointRadius: 0,
							pointHoverRadius: 4,
						},
					]
				: []),
		],
	};
}

/**
 * Builds a portfolio equity curve incorporating:
 * - A starting capital deposit at startedAt (or the earliest event date)
 * - Cash-flow events (deposits +, withdrawals -)
 * - Closed trade PnL deltas
 *
 * Each unique calendar day becomes a label; equity is the running total of all
 * events up to and including that day.  Reuses the same drawdown styling as
 * createEquityCurveData.
 */
export function createPortfolioEquityCurveData(
	trades: Trade[],
	transactions: BalanceTransaction[],
	startingCapital: number,
	startedAt?: string | null,
	timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
): LineChartData {
	type Event = { date: string; delta: number };
	const events: Event[] = [];

	// Closed-trade PnL events
	for (const trade of trades) {
		if (!trade.closedAt) continue;
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null) continue;
		events.push({ date: trade.closedAt.split('T')[0], delta: pnl });
	}

	// Deposit / withdrawal events
	for (const tx of transactions) {
		const date = tx.occurred_at.split('T')[0];
		const delta = tx.type === 'deposit' ? tx.amount : -tx.amount;
		events.push({ date, delta });
	}

	// Determine origin date for starting capital, then sort all events chronologically
	const originDate =
		startedAt
			? startedAt.split('T')[0]
			: events[0]?.date ?? new Date().toISOString().split('T')[0];
	events.push({ date: originDate, delta: startingCapital });
	events.sort((a, b) => a.date.localeCompare(b.date));

	// Bucket by timeframe key
	function toKey(dateStr: string): string {
		const d = new Date(dateStr);
		switch (timeframe) {
			case 'monthly':
				return toMonthKey(d);
			case 'weekly': {
				const ws = new Date(d);
				ws.setDate(d.getDate() - d.getDay());
				return ws.toISOString().split('T')[0];
			}
			default:
				return dateStr;
		}
	}

	const buckets = new Map<string, number>();
	for (const ev of events) {
		const key = toKey(ev.date);
		buckets.set(key, (buckets.get(key) ?? 0) + ev.delta);
	}

	// Build cumulative equity
	const sorted = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
	let cumulative = 0;
	const equityData: number[] = [];
	const labels: string[] = [];
	for (const [key, delta] of sorted) {
		cumulative += delta;
		equityData.push(cumulative);
		labels.push(timeframe === 'monthly' ? formatDateMMMYY(key) : formatDateDDMMMYY(key));
	}

	const drawdownData = calculateDrawdown(equityData);

	return {
		labels,
		datasets: [
			{
				label: 'Account Equity',
				data: equityData,
				borderColor: financialColors.primary,
				backgroundColor: 'hsl(209.1 65.4% 40.8% / 0.15)',
				tension: 0.4,
				fill: false,
				borderWidth: 3,
				pointRadius: 0,
				pointHoverRadius: 6,
			},
			...(drawdownData.length > 0
				? [
						{
							label: 'Drawdown',
							data: drawdownData,
							borderColor: financialColors.loss,
							backgroundColor: 'hsl(0 40% 48% / 0.22)',
							tension: 0.4,
							fill: '+1',
							borderWidth: 2,
							pointRadius: 0,
							pointHoverRadius: 4,
						},
					]
				: []),
		],
	};
}

// Helper function to create Risk/Reward ratio distribution
export function createRiskRewardDistribution(trades: Trade[]): BarChartData {
	const ranges = [
		{ min: -Infinity, max: -4, label: '<-4' },
		{ min: -4, max: -2, label: '[-4, -2)' },
		{ min: -2, max: -1.2, label: '[-2, -1.2)' },
		{ min: -1.2, max: -0.8, label: '[-1.2, -0.8)' },
		{ min: -0.8, max: 0.8, label: '[-0.8, 0.8)' },
		{ min: 0.8, max: 1.2, label: '[0.8, 1.2)' },
		{ min: 1.2, max: 2, label: '[1.2, 2)' },
		{ min: 2, max: 4, label: '[2, 4]' },
		{ min: 4, max: Infinity, label: '>4' },
	];

	const rangeCounts = new Array(ranges.length).fill(0);

	// Filter and process trades
	trades.forEach((trade) => {
		const pnl = calcAbsolutePnl(trade);
		if (!trade.stopLoss || !pnl) {
			return;
		}

		const risk =
			Math.abs(trade.stopLoss - trade.openPrice) * trade.quantity;
		const ratio = pnl / risk;

		// Find the appropriate range and increment its counter
		const rangeIndex = ranges.findIndex(
			(range) => ratio >= range.min && ratio < range.max,
		);
		if (rangeIndex !== -1) {
			rangeCounts[rangeIndex]++;
		}
	});

	return {
		labels: ranges.map((range) => range.label),
		datasets: [
			{
				label: 'Risk/Reward Ratio Distribution',
				data: rangeCounts,
				backgroundColor: rangeCounts.map((_, index) => {
					if (index < 4) return financialColors.loss;
					if (index === 4) return financialColors.neutral;
					return financialColors.profit;
				}),
				borderWidth: 0,
				borderRadius: 4,
				barPercentage: 0.8,
				categoryPercentage: 0.9,
			},
		],
	};
}

// Helper function to calculate drawdown from equity curve
function calculateDrawdown(equityData: number[]): number[] {
	if (equityData.length === 0) return [];

	const drawdown: number[] = [];
	let peak = 0;

	equityData.forEach((equity) => {
		if (equity > peak) {
			peak = equity;
		}
		const currentDrawdown = equity - peak;
		drawdown.push(currentDrawdown);
	});

	return drawdown;
}
