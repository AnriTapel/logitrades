export type Trade = {
	id: number;
	symbol: string;
	tradeType: TradeType;
	leverage?: number;
	quantity: number;
	price: number;
	createdAt?: string;
	takeProfit?: number;
	stopLoss?: number;
	comment?: string;
};

export type TradeType = 'buy' | 'sell';
