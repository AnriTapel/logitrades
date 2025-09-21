import { calcAbsolutePnl } from './calcFunctions';
import type { BarChartData, LineChartData, PieChartData, Trade } from './types';

/**
 *
 * Layout utils
 *
 */

const financialColors = {
	profit: '#10b981', // green-500
	loss: '#ef4444', // red-500
	neutral: '#6b7280', // gray-500
	primary: '#3b82f6', // blue-500
	secondary: '#8b5cf6', // purple-500
	success: '#22c55e', // green-500
	warning: '#f59e0b', // amber-500
	info: '#06b6d4', // cyan-500
	indigo: '#6366f1', // indigo-500
	pink: '#ec4899', // pink-500
	teal: '#14b8a6', // teal-500
} as const;

// Generate color palette
export const getColorPalette = (count: number): string[] => {
	const colors = [
		financialColors.primary,
		financialColors.secondary,
		financialColors.success,
		financialColors.warning,
		financialColors.info,
		financialColors.indigo,
		financialColors.pink,
		financialColors.teal,
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
		labels: sortedEntries.map(([month]) => month),
		datasets: [
			{
				label: 'Monthly P&L',
				data: sortedEntries.map(([, pnl]) => pnl),
				backgroundColor: sortedEntries.map(([, pnl]) =>
					pnl >= 0 ? financialColors.profit : financialColors.loss
				),
				borderColor: '#374151',
				borderWidth: 1,
			},
		],
	};
}

export function createSymbolDistributionData(
	trades: Trade[],
	minPercentage: number = 2
): PieChartData {
	const volumeBySymbol = new Map<string, number>();

	trades.forEach((trade) => {
		const volume = trade.quantity * trade.openPrice;
		volumeBySymbol.set(
			trade.symbol,
			(volumeBySymbol.get(trade.symbol) || 0) + volume
		);
	});

	const totalVolume = Array.from(volumeBySymbol.values()).reduce(
		(sum, volume) => sum + volume,
		0
	);
	const sortedEntries = Array.from(volumeBySymbol.entries())
		.map(([symbol, volume]) => ({
			symbol,
			volume,
			percentage: (volume / totalVolume) * 100,
		}))
		.sort((a, b) => b.volume - a.volume);

	// Group small percentages into "Others"
	const significantEntries = sortedEntries.filter(
		(entry) => entry.percentage >= minPercentage
	);
	const othersVolume = sortedEntries
		.filter((entry) => entry.percentage < minPercentage)
		.reduce((sum, entry) => sum + entry.volume, 0);

	const labels: string[] = significantEntries.map((entry) => entry.symbol);
	const data: number[] = significantEntries.map((entry) => entry.volume);

	if (othersVolume > 0) {
		labels.push('Others');
		data.push(othersVolume);
	}

	return {
		labels,
		datasets: [
			{
				label: 'Trading Volume by Symbol',
				data,
			},
		],
	};
}

// Helper function to create trade type distribution
export function createTradeTypeDistributionData(trades: Trade[]): PieChartData {
	const buyCount = trades.filter((trade) => trade.tradeType === 'buy').length;
	const sellCount = trades.filter((trade) => trade.tradeType === 'sell').length;

	return {
		labels: ['Buy', 'Sell'],
		datasets: [
			{
				label: 'Trade Types',
				data: [buyCount, sellCount],
				backgroundColor: [financialColors.success, financialColors.loss],
			},
		],
	};
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

	// Create labels and data arrays
	const labels = sortedEntries.map(([date]) => date);
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
				borderColor: '#374151',
				borderWidth: 1,
				barPercentage: 0.8, // Controls bar width
				categoryPercentage: 0.9, // Controls spacing between bars
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
