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

	const pnl =
		(closePrice - openPrice) * quantity * (tradeType === 'buy' ? 1 : -1);

	return pnl * leverage;
}

export function calcPnlPercentage(trade: Trade): number | null {
	const absolutePnl = calcAbsolutePnl(trade);
	if (absolutePnl === null) {
		return null;
	}
	const investedAmount = trade.openPrice * trade.quantity;

	return (absolutePnl / investedAmount) * 100;
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
