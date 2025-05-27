import type { TradeFormInput } from '../routes/schema';
import type { Trade } from './types';

// TODO: resolve any type
export const convertApiTradeToUiTrade = (trade: any): Trade => {
	return {
		id: trade.id,
		symbol: trade.symbol,
		tradeType: trade.type,
		price: trade.price,
		quantity: trade.quantity,
		stopLoss: trade.stop_loss,
		takeProfit: trade.take_profit,
		leverage: trade.leverage,
		comment: trade.comment || '',
		createdAt: trade.created_at,
	};
};

export const convertUiTradeFormToApiTrade = (trade: TradeFormInput): any => {
	return {
		symbol: trade.symbol,
		type: trade.tradeType,
		price: trade.price,
		quantity: trade.quantity,
		stop_loss: trade.stopLoss || null,
		take_profit: trade.takeProfit || null,
		leverage: trade.useLeverage ? trade.leverage : null,
		comment: trade.comment || null,
	};
};
