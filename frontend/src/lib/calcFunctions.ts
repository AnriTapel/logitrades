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
