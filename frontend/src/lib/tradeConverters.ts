import type { TradeFormInput } from './schemas/tradeSchemas';
import { formatDateTimeISO } from './formatters';
import type { Trade } from './types';

// TODO: resolve any type
export const convertApiTradeToUiTrade = (trade: any): Trade => {
	return {
		id: trade.id,
		symbol: trade.symbol,
		tradeType: trade.type,
		openPrice: trade.open_price, // updated to match backend field name
		quantity: trade.quantity,
		stopLoss: trade.stop_loss ?? undefined,
		takeProfit: trade.take_profit ?? undefined,
		leverage: trade.leverage ?? undefined,
		openedAt: formatDateTimeISO(trade.opened_at),
		closePrice: trade.close_price ?? undefined,
		closedAt: trade.closed_at ? formatDateTimeISO(trade.closed_at) : undefined,
		createdAt: formatDateTimeISO(trade.created_at),
	};
};

export const convertUiTradeToTradeFormInput = (
	trade: Trade
): TradeFormInput => {
	return {
		...trade,
		leverage: trade.leverage || 1,
		useLeverage: Boolean(trade.leverage) && trade.leverage !== 1,
		openedAt: trade.openedAt ?? formatDateTimeISO(new Date().toISOString()), // default to current date-time in ISO format without seconds
		closePrice: trade.closePrice,
	};
};

export const normalizeTradeFormInputForApi = (
	trade: TradeFormInput
): TradeFormInput => {
	return {
		...trade,
		symbol: trade.symbol.toUpperCase(),
	};
};
