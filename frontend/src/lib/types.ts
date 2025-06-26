export type Trade = {
	id: number;
	symbol: string;
	tradeType: TradeType;
	leverage?: number;
	quantity: number;
	price: number;
	openedAt?: string;
	createdAt?: string;
	takeProfit?: number;
	stopLoss?: number;
	comment?: string;
};

export type TradeType = 'buy' | 'sell';
