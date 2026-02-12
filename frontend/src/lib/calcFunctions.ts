import type { Trade } from '$lib/types';

export function calcAbsolutePnl(trade: Trade): number | null {
	const { openPrice, closePrice, quantity, leverage = 1, tradeType } = trade;
	if (closePrice == null || closePrice === undefined) {
		return null;
	}

	if (leverage > 1) {
		const liquidationPriceLong = openPrice * (1 - 1 / leverage);
		const liquidationPriceShort = openPrice * (1 + 1 / leverage);

		if (tradeType === 'buy' && closePrice <= liquidationPriceLong) {
			return -openPrice * quantity;
		}

		if (tradeType === 'sell' && closePrice >= liquidationPriceShort) {
			return -openPrice * quantity;
		}
	}

	return (
		(closePrice - openPrice) *
		quantity *
		(leverage ?? 1) *
		(tradeType === 'buy' ? 1 : -1)
	);
}

export function calcWinrate(trades: Trade[]): number {
	if (trades.length === 0) {
		return 0;
	}
	const winningTrades = trades.filter((trade) => {
		const pnl = calcAbsolutePnl(trade);
		return pnl !== null && pnl > 0;
	});
	return (winningTrades.length / trades.length) * 100;
}

export const calcAverageWin = (trades: Trade[]): number => {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	const winningTrades = closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl > 0);
	if (winningTrades.length === 0) {
		return 0;
	}
	const totalWin = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
	return totalWin / winningTrades.length;
};

export const calcAverageLoss = (trades: Trade[]): number => {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	const losingTrades = closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl < 0);
	if (losingTrades.length === 0) {
		return 0;
	}
	const totalLoss = losingTrades.reduce((sum, pnl) => sum + pnl, 0);
	return totalLoss / losingTrades.length;
};

export const calcProfitFactor = (trades: Trade[]): number => {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	const totalProfit = closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl > 0)
		.reduce((sum, pnl) => sum + pnl, 0);

	const totalLoss = Math.abs(
		closedTrades
			.map((trade) => calcAbsolutePnl(trade))
			.filter((pnl): pnl is number => pnl !== null && pnl < 0)
			.reduce((sum, pnl) => sum + pnl, 0)
	);

	if (totalLoss === 0) {
		return totalProfit > 0 ? Infinity : 0;
	}

	return totalProfit / totalLoss;
};

export function calcPnlPercentage(trade: Trade): number | null {
	const absolutePnl = calcAbsolutePnl(trade);
	if (absolutePnl === null) {
		return null;
	}
	const investedAmount = trade.openPrice * trade.quantity;

	return absolutePnl / investedAmount;
}

export function calculatePnl(trade: Trade): number {
	if (!trade.closePrice) {
		return 0;
	}

	const { openPrice, closePrice, quantity, leverage = 1, tradeType } = trade;

	if (leverage > 1) {
		const liquidationPriceLong = openPrice * (1 - 1 / leverage);
		const liquidationPriceShort = openPrice * (1 + 1 / leverage);

		if (tradeType === 'buy' && closePrice <= liquidationPriceLong) {
			return -openPrice * quantity;
		}

		if (tradeType === 'sell' && closePrice >= liquidationPriceShort) {
			return -openPrice * quantity;
		}
	}

	const pnl =
		(closePrice - openPrice) * quantity * (tradeType === 'buy' ? 1 : -1);

	return pnl * leverage;
}

export function pnlForPeriod(trades: Trade[]): number {
	return trades.reduce((total, trade) => {
		if (!trade.closePrice || !trade.closedAt) {
			return total;
		}
		return total + calculatePnl(trade);
	}, 0);
}

export function totalTradedVolumeForPeriod(trades: Trade[]): number {
	return trades.reduce((total, trade) => {
		const closePrice = trade.closePrice || 0;
		return (
			total +
			(trade.openPrice + closePrice) * trade.quantity * (trade.leverage ?? 1)
		);
	}, 0);
}

export function totalEquityInOpenedTrades(trades: Trade[]): number {
	return trades.reduce(
		(total, trade) => total + trade.openPrice * trade.quantity,
		0
	);
}

export function calcExpectancy(trades: Trade[]): number {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return 0;
	}
	const totalPnl = closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null)
		.reduce((sum, pnl) => sum + pnl, 0);
	return totalPnl / closedTrades.length;
}

export function calcBestTrade(trades: Trade[]): number | null {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return null;
	}
	const pnls = closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null);
	if (pnls.length === 0) {
		return null;
	}
	return Math.max(...pnls);
}

export function calcWorstTrade(trades: Trade[]): number | null {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return null;
	}
	const pnls = closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null);
	if (pnls.length === 0) {
		return null;
	}
	return Math.min(...pnls);
}

export function calcGrossProfit(trades: Trade[]): number {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	return closedTrades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl > 0)
		.reduce((sum, pnl) => sum + pnl, 0);
}

export function calcGrossLoss(trades: Trade[]): number {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	return Math.abs(
		closedTrades
			.map((trade) => calcAbsolutePnl(trade))
			.filter((pnl): pnl is number => pnl !== null && pnl < 0)
			.reduce((sum, pnl) => sum + pnl, 0)
	);
}

export function calcMaxWinStreak(trades: Trade[]): number {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return 0;
	}
	
	// Sort by closedAt chronologically
	const sortedTrades = [...closedTrades].sort((a, b) => {
		return new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime();
	});
	
	let maxStreak = 0;
	let currentStreak = 0;
	
	for (const trade of sortedTrades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl !== null && pnl > 0) {
			currentStreak++;
			maxStreak = Math.max(maxStreak, currentStreak);
		} else {
			currentStreak = 0;
		}
	}
	
	return maxStreak;
}

export function calcMaxLossStreak(trades: Trade[]): number {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return 0;
	}
	
	// Sort by closedAt chronologically
	const sortedTrades = [...closedTrades].sort((a, b) => {
		return new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime();
	});
	
	let maxStreak = 0;
	let currentStreak = 0;
	
	for (const trade of sortedTrades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl !== null && pnl < 0) {
			currentStreak++;
			maxStreak = Math.max(maxStreak, currentStreak);
		} else {
			currentStreak = 0;
		}
	}
	
	return maxStreak;
}

export function calcAverageTradeDuration(trades: Trade[]): string {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return '0m';
	}
	
	const totalDurationMs = closedTrades.reduce((sum, trade) => {
		const openTime = new Date(trade.openedAt).getTime();
		const closeTime = new Date(trade.closedAt!).getTime();
		return sum + (closeTime - openTime);
	}, 0);
	
	const avgDurationMs = totalDurationMs / closedTrades.length;
	const avgDurationMinutes = avgDurationMs / (1000 * 60);
	const avgDurationHours = avgDurationMinutes / 60;
	const avgDurationDays = avgDurationHours / 24;
	
	// Smart formatting: use most appropriate unit
	if (avgDurationDays >= 1) {
		return `${avgDurationDays.toFixed(1)}d`;
	} else if (avgDurationHours >= 1) {
		return `${avgDurationHours.toFixed(1)}h`;
	} else {
		return `${Math.round(avgDurationMinutes)}m`;
	}
}

export function calcMaxDrawdown(trades: Trade[]): { absolute: number; percentage: number } {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	if (closedTrades.length === 0) {
		return { absolute: 0, percentage: 0 };
	}
	
	// Sort by closedAt chronologically
	const sortedTrades = [...closedTrades].sort((a, b) => {
		return new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime();
	});
	
	let runningEquity = 0;
	let peakEquity = 0;
	let maxDrawdownAbs = 0;
	let maxDrawdownPct = 0;
	
	for (const trade of sortedTrades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl === null) continue;
		
		runningEquity += pnl;
		
		if (runningEquity > peakEquity) {
			peakEquity = runningEquity;
		}
		
		const currentDrawdown = peakEquity - runningEquity;
		if (currentDrawdown > maxDrawdownAbs) {
			maxDrawdownAbs = currentDrawdown;
			// Calculate percentage drawdown from peak
			maxDrawdownPct = peakEquity !== 0 ? (currentDrawdown / Math.abs(peakEquity)) * 100 : 0;
		}
	}
	
	return { absolute: maxDrawdownAbs, percentage: maxDrawdownPct };
}

export function calcAverageRiskReward(trades: Trade[]): number | null {
	const closedTrades = trades.filter((t) => t.closePrice != null && t.closedAt != null);
	
	// Only include trades with stopLoss defined
	const tradesWithSL = closedTrades.filter((t) => t.stopLoss != null);
	
	if (tradesWithSL.length === 0) {
		return null;
	}
	
	const rrRatios: number[] = [];
	
	for (const trade of tradesWithSL) {
		const actualPnl = calcAbsolutePnl(trade);
		if (actualPnl === null) continue;
		
		// Calculate planned risk
		const plannedRisk = Math.abs(trade.stopLoss! - trade.openPrice) * 
			trade.quantity * 
			(trade.leverage ?? 1);
		
		if (plannedRisk === 0) continue;
		
		const rrRatio = actualPnl / plannedRisk;
		rrRatios.push(rrRatio);
	}
	
	if (rrRatios.length === 0) {
		return null;
	}
	
	const avgRR = rrRatios.reduce((sum, rr) => sum + rr, 0) / rrRatios.length;
	return avgRR;
}
