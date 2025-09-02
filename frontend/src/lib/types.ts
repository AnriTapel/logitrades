export type TradeType = 'buy' | 'sell';
export interface Trade {
	id: number;
	symbol: string;
	tradeType: TradeType;
	openPrice: number;
	quantity: number;
	stopLoss?: number;
	takeProfit?: number;
	leverage?: number;
	openedAt: string;
	closePrice?: number;
	closedAt?: string;
	createdAt: string;
}
