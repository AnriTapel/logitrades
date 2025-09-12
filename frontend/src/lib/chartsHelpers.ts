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

export function createVolumeData(trades: Trade[]): BarChartData {
	const volumeBySymbol = new Map<string, number>();

	trades.forEach((trade) => {
		const volume = trade.quantity * trade.openPrice;
		volumeBySymbol.set(
			trade.symbol,
			(volumeBySymbol.get(trade.symbol) || 0) + volume
		);
	});

	const sortedEntries = Array.from(volumeBySymbol.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10); // Top 10 symbols

	return {
		labels: sortedEntries.map(([symbol]) => symbol),
		datasets: [
			{
				label: 'Trading Volume ($)',
				data: sortedEntries.map(([, volume]) => volume),
				backgroundColor: sortedEntries.map((_, index) => {
					const colors = [
						financialColors.primary,
						financialColors.secondary,
						financialColors.success,
						financialColors.warning,
						financialColors.neutral,
					];
					return colors[index % colors.length];
				}),
				borderColor: '#374151',
				borderWidth: 1,
			},
		],
	};
}

// Helper function to create trade count data by symbol
export function createTradeCountData(trades: Trade[]): BarChartData {
	const countBySymbol = new Map<string, number>();

	trades.forEach((trade) => {
		countBySymbol.set(trade.symbol, (countBySymbol.get(trade.symbol) || 0) + 1);
	});

	const sortedEntries = Array.from(countBySymbol.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10); // Top 10 symbols

	return {
		labels: sortedEntries.map(([symbol]) => symbol),
		datasets: [
			{
				label: 'Number of Trades',
				data: sortedEntries.map(([, count]) => count),
				backgroundColor: financialColors.primary,
				borderColor: '#374151',
				borderWidth: 1,
			},
		],
	};
}

// Helper function to create monthly P&L data
export function createMonthlyPnLData(trades: Trade[]): BarChartData {
	const pnlByMonth = new Map<string, number>();

	trades
		.filter((trade) => trade.closePrice && trade.closedAt)
		.forEach((trade) => {
			const pnl = (trade.closePrice! - trade.openPrice) * trade.quantity;
			const date = new Date(trade.closedAt!);
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

export function createPnLData(
	trades: Trade[],
	timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
): LineChartData {
	// Group trades by timeframe and calculate cumulative P&L
	const groupedTrades = new Map<string, number>();

	trades
		.filter((trade) => trade.closePrice && trade.closedAt)
		.forEach((trade) => {
			const pnl = (trade.closePrice! - trade.openPrice) * trade.quantity;
			const date = new Date(trade.closedAt!);

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

			groupedTrades.set(key, (groupedTrades.get(key) || 0) + pnl);
		});

	const sortedEntries = Array.from(groupedTrades.entries()).sort(([a], [b]) =>
		a.localeCompare(b)
	);
	let cumulativePnL = 0;

	return {
		labels: sortedEntries.map(([date]) => date),
		datasets: [
			{
				label: 'Cumulative P&L',
				data: sortedEntries.map(([, pnl]) => {
					cumulativePnL += pnl;
					return cumulativePnL;
				}),
				borderColor: financialColors.primary,
				backgroundColor: `${financialColors.primary}20`,
				tension: 0.4,
				fill: true,
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

// Helper function to create win/loss distribution
export function createWinLossDistributionData(trades: Trade[]): PieChartData {
	const closedTrades = trades.filter(
		(trade) => trade.closePrice && trade.closedAt
	);

	let winCount = 0;
	let lossCount = 0;

	closedTrades.forEach((trade) => {
		const pnl = (trade.closePrice! - trade.openPrice) * trade.quantity;
		if (pnl > 0) {
			winCount++;
		} else {
			lossCount++;
		}
	});

	return {
		labels: ['Winning Trades', 'Losing Trades'],
		datasets: [
			{
				label: 'Trade Outcomes',
				data: [winCount, lossCount],
				backgroundColor: [financialColors.profit, financialColors.loss],
			},
		],
	};
}

// Helper function to create leverage distribution
export function createLeverageDistributionData(trades: Trade[]): PieChartData {
	const leverageGroups = new Map<string, number>();

	trades
		.filter((trade) => trade.leverage)
		.forEach((trade) => {
			const leverage = trade.leverage!;
			let group: string;

			if (leverage <= 2) group = '1x-2x';
			else if (leverage <= 5) group = '3x-5x';
			else if (leverage <= 10) group = '6x-10x';
			else group = '10x+';

			leverageGroups.set(group, (leverageGroups.get(group) || 0) + 1);
		});

	const sortedEntries = Array.from(leverageGroups.entries()).sort(([a], [b]) =>
		a.localeCompare(b)
	);

	return {
		labels: sortedEntries.map(([group]) => group),
		datasets: [
			{
				label: 'Leverage Distribution',
				data: sortedEntries.map(([, count]) => count),
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
		.map((trade) => ({
			...trade,
			pnl: (trade.closePrice! - trade.openPrice) * trade.quantity,
			closeDate: new Date(trade.closedAt!),
		}))
		.sort((a, b) => a.closeDate.getTime() - b.closeDate.getTime());

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
				label: 'Portfolio Value',
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

// Helper function to calculate drawdown from equity curve
function calculateDrawdown(equityData: number[]): number[] {
	if (equityData.length === 0) return [];

	const drawdown: number[] = [];
	let peak = equityData[0];

	equityData.forEach((equity) => {
		if (equity > peak) {
			peak = equity;
		}
		const currentDrawdown = ((equity - peak) / peak) * 100;
		drawdown.push(currentDrawdown);
	});

	return drawdown;
}

// Helper function to create multiple equity curves for comparison
export function createMultipleEquityCurves(
	tradeSets: { trades: Trade[]; label: string; color: string }[],
	initialBalance: number = 10000,
	timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
): LineChartData {
	const allDates = new Set<string>();

	// Get all unique dates from all trade sets
	tradeSets.forEach(({ trades }) => {
		const curveData = createEquityCurveData(trades, initialBalance, timeframe);
		curveData.labels.forEach((date) => allDates.add(date));
	});

	// Sort dates
	const sortedDates = Array.from(allDates).sort();

	// Create datasets for each trade set
	const datasets = tradeSets.map(({ trades, label, color }) => {
		const curveData = createEquityCurveData(trades, initialBalance, timeframe);

		// Map data to match all dates
		const mappedData = sortedDates.map((date) => {
			const index = curveData.labels.indexOf(date);
			return index !== -1 ? curveData.datasets[0].data[index] : null;
		});

		// Forward fill missing data
		let lastValue = initialBalance;
		const filledData = mappedData.map((value) => {
			if (value !== null) {
				lastValue = value;
				return value;
			}
			return lastValue;
		});

		return {
			label,
			data: filledData,
			borderColor: color,
			backgroundColor: `${color}20`,
			tension: 0.4,
			fill: false,
			borderWidth: 2,
			pointRadius: 0,
			pointHoverRadius: 4,
		};
	});

	return {
		labels: sortedDates,
		datasets,
	};
}
