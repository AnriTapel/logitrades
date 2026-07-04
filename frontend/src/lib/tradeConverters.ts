import { toUtcIso } from '$lib/dates';
import type { TradeFormInput } from './schemas/tradeSchemas';
import type { Trade } from './types';

// TODO: resolve any type
export const convertApiTradeToUiTrade = (trade: any): Trade => {
	return {
		id: trade.id,
		symbol: trade.symbol,
		tradeType: trade.type,
		openPrice: trade.open_price,
		quantity: trade.quantity,
		stopLoss: trade.stop_loss ?? undefined,
		takeProfit: trade.take_profit ?? undefined,
		leverage: trade.leverage ?? undefined,
		openedAt: toUtcIso(trade.opened_at),
		closePrice: trade.close_price ?? undefined,
		closedAt: trade.closed_at ? toUtcIso(trade.closed_at) : undefined,
		createdAt: toUtcIso(trade.created_at),
		comment: trade.comment ?? undefined,
	};
};

export const convertUiTradeToTradeFormInput = (
	trade: Trade,
): TradeFormInput => {
	return {
		...trade,
		leverage: trade.leverage || 1,
		useLeverage: Boolean(trade.leverage) && trade.leverage !== 1,
		closePrice: trade.closePrice,
	};
};

export const normalizeTradeFormInputForApi = (
	trade: TradeFormInput,
): TradeFormInput => {
	return {
		...trade,
		symbol: trade.symbol.toUpperCase(),
	};
};
