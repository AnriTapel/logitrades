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

// Charts types/interfaces
export type BarChartData = {
	labels: string[];
	datasets: Array<{
		label: string;
		data: number[];
		backgroundColor?: string | string[];
		borderColor?: string | string[];
		borderWidth?: number;
		borderRadius?: number;
		borderSkipped?: boolean | string;
		barPercentage?: number;
		categoryPercentage?: number;
	}>;
};

export type LineChartData = {
	labels: string[];
	datasets: Array<{
		label: string;
		data: number[];
		borderColor?: string;
		backgroundColor?: string;
		tension?: number;
		fill?: boolean | string;
		borderWidth?: number;
		pointRadius?: number;
		pointHoverRadius?: number;
	}>;
};

export type PieChartData = {
	labels: string[];
	datasets: Array<{
		label: string;
		data: number[];
		backgroundColor?: string[];
		borderColor?: string[];
		borderWidth?: number;
	}>;
};
