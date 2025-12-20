import { calcAbsolutePnl } from './calcFunctions';
import type { BarChartData, LineChartData, PieChartData, Trade } from './types';

/**
 *
 * Layout utils
 *
 */

// Glossy, cohesive color palette - ocean/sky tones with soft gradients
const financialColors = {
	profit: '#34d399', // emerald-400 - softer green
	loss: '#f87171', // red-400 - softer red
	neutral: '#94a3b8', // slate-400 - muted gray
	primary: '#60a5fa', // blue-400 - soft blue
	secondary: '#818cf8', // indigo-400 - soft indigo
	accent1: '#67e8f9', // cyan-300 - light cyan
	accent2: '#a78bfa', // violet-400 - soft violet
	accent3: '#93c5fd', // blue-300 - lighter blue
	accent4: '#c4b5fd', // violet-300 - lighter violet
} as const;

// Generate cohesive color palette with similar tones
export const getColorPalette = (count: number): string[] => {
	// Blue-violet gradient palette for cohesive look
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

// Helper function to create monthly P&L data
export function createMonthlyPnLData(trades: Trade[]): BarChartData {
	const pnlByMonth = new Map<string, number>();

	trades.forEach((trade) => {
		const pnl = calcAbsolutePnl(trade);
		if (pnl == null || !trade.closedAt) {
			return;
		}

		const date = new Date(trade.closedAt);
		const monthKey = `${date.getFullYear()}-${String(
			date.getMonth() + 1
		).padStart(2, '0')}`;
		pnlByMonth.set(monthKey, (pnlByMonth.get(monthKey) || 0) + pnl);
	});

	const sortedEntries = Array.from(pnlByMonth.entries()).sort(([a], [b]) =>
		a.localeCompare(b)
	);

	return {
		labels: sortedEntries.map(([month]) => formatDateMMMYY(month)),
		datasets: [
			{
				label: 'Monthly P&L',
				data: sortedEntries.map(([, pnl]) => pnl),
				backgroundColor: sortedEntries.map(([, pnl]) =>
					pnl >= 0 ? financialColors.profit : financialColors.loss
				),
				borderWidth: 0,
				borderRadius: 4,
			},
		],
	};
}

export type SymbolStatsRow = {
	symbol: string;
	tradeCount: number;
	winrate: number;
};

export function createSymbolStatsData(trades: Trade[]): SymbolStatsRow[] {
	const statsBySymbol = new Map<string, { total: number; wins: number }>();

	trades.forEach((trade) => {
		const stats = statsBySymbol.get(trade.symbol) || { total: 0, wins: 0 };
		stats.total += 1;

		// Only count closed trades for winrate
		if (trade.closePrice && trade.closedAt) {
			const pnl = calcAbsolutePnl(trade);
			if (pnl !== null && pnl > 0) {
				stats.wins += 1;
			}
		}

		statsBySymbol.set(trade.symbol, stats);
	});

	return Array.from(statsBySymbol.entries())
		.map(([symbol, stats]) => {
			const closedTrades = trades.filter(
				(t) => t.symbol === symbol && t.closePrice && t.closedAt
			).length;
			return {
				symbol,
				tradeCount: stats.total,
				winrate: closedTrades > 0 ? (stats.wins / closedTrades) * 100 : 0,
			};
		})
		.sort((a, b) => b.tradeCount - a.tradeCount);
}

export type TradeTypeStats = {
	type: 'long' | 'short';
	tradeCount: number;
	winrate: number;
};

export function createTradeTypeStats(trades: Trade[]): TradeTypeStats[] {
	const calculateStats = (tradeType: 'buy' | 'sell'): TradeTypeStats => {
		const filteredTrades = trades.filter((t) => t.tradeType === tradeType);
		const closedTrades = filteredTrades.filter(
			(t) => t.closePrice && t.closedAt
		);
		const wins = closedTrades.filter((t) => {
			const pnl = calcAbsolutePnl(t);
			return pnl !== null && pnl > 0;
		}).length;

		return {
			type: tradeType === 'buy' ? 'long' : 'short',
			tradeCount: filteredTrades.length,
			winrate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
		};
	};

	return [calculateStats('buy'), calculateStats('sell')];
}

// Helper function to create equity curve data
export function createEquityCurveData(
	trades: Trade[],
	initialBalance: number = 0,
	timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
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
				key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
					2,
					'0'
				)}`;
				break;
		}

		cumulativePnL += trade.pnl;
		equityByTimeframe.set(key, initialBalance + cumulativePnL);
	});

	// Convert to array and sort by date
	const sortedEntries = Array.from(equityByTimeframe.entries()).sort(
		([a], [b]) => a.localeCompare(b)
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
				backgroundColor: `${financialColors.primary}20`,
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
							backgroundColor: `${financialColors.loss}30`,
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
			Math.abs(trade.stopLoss - trade.openPrice) *
			trade.quantity *
			(trade.leverage ?? 1);
		const ratio = pnl / risk;

		// Find the appropriate range and increment its counter
		const rangeIndex = ranges.findIndex(
			(range) => ratio >= range.min && ratio < range.max
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
