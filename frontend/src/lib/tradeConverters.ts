import type { TradeFormInput } from '../routes/schema';
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
		stopLoss: trade.stop_loss,
		takeProfit: trade.take_profit,
		leverage: trade.leverage,
		openedAt: formatDateTimeISO(trade.opened_at),
		closePrice: trade.close_price,
		closedAt: trade.closed_at ? formatDateTimeISO(trade.closed_at) : undefined,
		createdAt: formatDateTimeISO(trade.created_at),
	};
};

export const convertUiTradeFormToApiTrade = (trade: TradeFormInput): any => {
	return {
		symbol: trade.symbol,
		type: trade.tradeType,
		open_price: trade.openPrice, // updated to match backend field name
		quantity: trade.quantity,
		opened_at: trade.openedAt,
		stop_loss: trade.stopLoss || null,
		take_profit: trade.takeProfit || null,
		leverage: trade.useLeverage ? trade.leverage : null,
		close_price: trade.closePrice || null,
		closed_at: trade.closedAt || null,
	};
};

export const convertUiTradeToTradeFormInput = (
	trade: Trade
): TradeFormInput => {
	return {
		...trade,
		leverage: trade.leverage || 1,
		useLeverage: trade.leverage !== 1 && trade.leverage !== null,
		openedAt: trade.openedAt ?? formatDateTimeISO(new Date().toISOString()), // default to current date-time in ISO format without seconds
		closePrice: trade.closePrice,
	};
};
