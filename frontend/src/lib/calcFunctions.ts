import type { Trade } from '$lib/types';

export function calcAbsolutePnl(trade: Trade): number | null {
	const {
		openPrice,
		closePrice,
		quantity,
		leverage = 1,
		tradeType,
		fee = 0,
	} = trade;
	if (closePrice == null || closePrice === undefined) {
		return null;
	}

	if (leverage > 1) {
		const liquidationPriceLong = openPrice * (1 - 1 / leverage);
		const liquidationPriceShort = openPrice * (1 + 1 / leverage);

		if (tradeType === 'buy' && closePrice <= liquidationPriceLong) {
			return (-openPrice * quantity) / leverage - fee;
		}

		if (tradeType === 'sell' && closePrice >= liquidationPriceShort) {
			return (-openPrice * quantity) / leverage - fee;
		}
	}

	return (
		(closePrice - openPrice) * quantity * (tradeType === 'buy' ? 1 : -1) - fee
	);
}

/** All calc helpers expect closed trades (closePrice + closedAt set). */
export function calcWinrate(trades: Trade[]): number {
	if (trades.length === 0) {
		return 0;
	}
	const winningTrades = trades.filter((trade) => {
		const pnl = calcAbsolutePnl(trade);
		return pnl !== null && pnl > 0;
	});
	return winningTrades.length / trades.length;
}

export const calcAverageWin = (trades: Trade[]): number => {
	const winningTrades = trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl > 0);
	if (winningTrades.length === 0) {
		return 0;
	}
	const totalWin = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
	return totalWin / winningTrades.length;
};

export const calcAverageLoss = (trades: Trade[]): number => {
	const losingTrades = trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl < 0);
	if (losingTrades.length === 0) {
		return 0;
	}
	const totalLoss = losingTrades.reduce((sum, pnl) => sum + pnl, 0);
	return totalLoss / losingTrades.length;
};

export const calcProfitFactor = (trades: Trade[]): number => {
	const totalProfit = trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl > 0)
		.reduce((sum, pnl) => sum + pnl, 0);

	const totalLoss = Math.abs(
		trades
			.map((trade) => calcAbsolutePnl(trade))
			.filter((pnl): pnl is number => pnl !== null && pnl < 0)
			.reduce((sum, pnl) => sum + pnl, 0),
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
	const investedAmount =
		(trade.openPrice * trade.quantity) / (trade.leverage ?? 1);

	return absolutePnl / investedAmount;
}

export function pnlForPeriod(trades: Trade[]): number {
	return trades.reduce((total, trade) => {
		const pnl = calcAbsolutePnl(trade);
		return pnl !== null ? total + pnl : total;
	}, 0);
}

export function totalTradedVolumeForPeriod(trades: Trade[]): number {
	return trades.reduce((total, trade) => {
		const closePrice = trade.closePrice || 0;
		return total + (trade.openPrice + closePrice) * trade.quantity;
	}, 0);
}

export function totalEquityInOpenedTrades(trades: Trade[]): number {
	return trades.reduce(
		(total, trade) => total + trade.openPrice * trade.quantity,
		0,
	);
}

export function calcExpectancy(trades: Trade[]): number {
	if (trades.length === 0) {
		return 0;
	}
	const totalPnl = trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null)
		.reduce((sum, pnl) => sum + pnl, 0);
	return totalPnl / trades.length;
}

export function calcBestTrade(trades: Trade[]): number | null {
	if (trades.length === 0) {
		return null;
	}
	const pnls = trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null);
	if (pnls.length === 0) {
		return null;
	}
	return Math.max(...pnls);
}

export function calcWorstTrade(trades: Trade[]): number | null {
	if (trades.length === 0) {
		return null;
	}
	const pnls = trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null);
	if (pnls.length === 0) {
		return null;
	}
	return Math.min(...pnls);
}

export function calcGrossProfit(trades: Trade[]): number {
	return trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl > 0)
		.reduce((sum, pnl) => sum + pnl, 0);
}

export function calcGrossLoss(trades: Trade[]): number {
	return trades
		.map((trade) => calcAbsolutePnl(trade))
		.filter((pnl): pnl is number => pnl !== null && pnl < 0)
		.reduce((sum, pnl) => sum + pnl, 0);
}

export function calcMaxWinStreak(trades: Trade[]): number {
	if (trades.length === 0) {
		return 0;
	}

	const sortedTrades = [...trades].sort((a, b) => {
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
	if (trades.length === 0) {
		return 0;
	}

	const sortedTrades = [...trades].sort((a, b) => {
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
	if (trades.length === 0) {
		return '0m';
	}

	const totalDurationMs = trades.reduce((sum, trade) => {
		const openTime = new Date(trade.openedAt).getTime();
		const closeTime = new Date(trade.closedAt!).getTime();
		return sum + (closeTime - openTime);
	}, 0);

	const avgDurationMs = totalDurationMs / trades.length;
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

export function calcMaxDrawdown(trades: Trade[]): {
	absolute: number;
	percentage: number;
} {
	if (trades.length === 0) {
		return { absolute: 0, percentage: 0 };
	}

	const sortedTrades = [...trades].sort((a, b) => {
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
			maxDrawdownPct =
				peakEquity !== 0 ? currentDrawdown / Math.abs(peakEquity) : 0;
		}
	}

	return { absolute: -maxDrawdownAbs, percentage: -maxDrawdownPct };
}

/** Mean realized R-multiple: net PnL / planned $ risk (|entry − SL| × qty). */
export function calcAverageRealizedR(trades: Trade[]): number | null {
	const tradesWithSL = trades.filter((t) => t.stopLoss != null);

	if (tradesWithSL.length === 0) {
		return null;
	}

	const realizedRs: number[] = [];

	for (const trade of tradesWithSL) {
		const actualPnl = calcAbsolutePnl(trade);
		if (actualPnl === null) continue;

		const plannedRisk =
			Math.abs(trade.stopLoss! - trade.openPrice) * trade.quantity;

		if (plannedRisk === 0) continue;

		realizedRs.push(actualPnl / plannedRisk);
	}

	if (realizedRs.length === 0) {
		return null;
	}

	return realizedRs.reduce((sum, r) => sum + r, 0) / realizedRs.length;
}

/** Mean planned R:R: |TP − entry| / |entry − SL| for trades with both SL and TP. */
export function calcAveragePlannedRiskReward(trades: Trade[]): number | null {
	const tradesWithSlAndTp = trades.filter(
		(t) => t.stopLoss != null && t.takeProfit != null,
	);

	if (tradesWithSlAndTp.length === 0) {
		return null;
	}

	const plannedRatios: number[] = [];

	for (const trade of tradesWithSlAndTp) {
		const plannedRisk =
			Math.abs(trade.stopLoss! - trade.openPrice) * trade.quantity;
		const plannedReward =
			Math.abs(trade.takeProfit! - trade.openPrice) * trade.quantity;

		if (plannedRisk === 0) continue;

		plannedRatios.push(plannedReward / plannedRisk);
	}

	if (plannedRatios.length === 0) {
		return null;
	}

	return plannedRatios.reduce((sum, rr) => sum + rr, 0) / plannedRatios.length;
}

export function calcPayoffRatio(trades: Trade[]): number | null {
	const avgWin = calcAverageWin(trades);
	const avgLoss = calcAverageLoss(trades);
	if (avgLoss === 0) {
		return null;
	}
	return avgWin / Math.abs(avgLoss);
}

export function calcRecoveryFactor(trades: Trade[]): number | null {
	if (trades.length === 0) {
		return null;
	}
	const netPnl = pnlForPeriod(trades);
	const maxDrawdown = calcMaxDrawdown(trades);
	if (maxDrawdown.absolute === 0) {
		return null;
	}
	return netPnl / Math.abs(maxDrawdown.absolute);
}

/**
 * Annualized Sharpe ratio from daily PnL returns (PnL-based, not equity-normalized).
 * Standard approach for trading journals without a fixed equity base.
 */
export function calcSharpeRatio(trades: Trade[]): number | null {
	if (trades.length === 0) {
		return null;
	}

	const pnlByDay = new Map<string, number>();
	for (const trade of trades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl === null || !trade.closedAt) continue;
		const dayKey = trade.closedAt.slice(0, 10);
		pnlByDay.set(dayKey, (pnlByDay.get(dayKey) ?? 0) + pnl);
	}

	const dailyReturns = Array.from(pnlByDay.values());
	if (dailyReturns.length < 2) {
		return null;
	}

	const mean =
		dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
	const variance =
		dailyReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
		(dailyReturns.length - 1);
	const std = Math.sqrt(variance);
	if (std === 0) {
		return null;
	}

	return (mean / std) * Math.sqrt(252);
}

export function calcCurrentStreak(
	trades: Trade[],
): { count: number; type: 'win' | 'loss' } | null {
	if (trades.length === 0) {
		return null;
	}

	const sortedTrades = [...trades].sort(
		(a, b) => new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime(),
	);

	const latestPnl = calcAbsolutePnl(sortedTrades[0]);
	if (latestPnl === null || latestPnl === 0) {
		return null;
	}

	const streakType: 'win' | 'loss' = latestPnl > 0 ? 'win' : 'loss';
	let count = 0;

	for (const trade of sortedTrades) {
		const pnl = calcAbsolutePnl(trade);
		if (pnl === null || pnl === 0) {
			break;
		}
		if (
			(streakType === 'win' && pnl > 0) ||
			(streakType === 'loss' && pnl < 0)
		) {
			count++;
			continue;
		}
		break;
	}

	return count > 0 ? { count, type: streakType } : null;
}

export function calcTotalFees(trades: Trade[]): number {
	return trades.reduce((sum, trade) => sum + (trade.fee ?? 0), 0);
}
