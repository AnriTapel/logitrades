import type { UtcIsoDateTime } from '$lib/dates';

export type TradeType = 'buy' | 'sell';
/** Filter-only side value; domain trades use TradeType only. */
export type TradeFilterType = TradeType | 'all';
export interface Trade {
	id: number;
	symbol: string;
	tradeType: TradeType;
	openPrice: number;
	quantity: number;
	stopLoss?: number;
	takeProfit?: number;
	leverage?: number;
	openedAt: UtcIsoDateTime;
	closePrice?: number;
	closedAt?: UtcIsoDateTime;
	createdAt: UtcIsoDateTime;
	comment?: string;
	tags?: string[];
}

export type ApiTrade = {
	id: number;
	symbol: string;
	type: TradeType;
	open_price: number;
	quantity: number;
	stop_loss?: number | null;
	take_profit?: number | null;
	leverage?: number | null;
	opened_at: string;
	close_price?: number | null;
	closed_at?: string | null;
	created_at: string;
	comment?: string | null;
	tags?: string[] | null;
};

export type ApiTradeListResponse = {
	items: ApiTrade[];
	total: number;
	limit: number | null;
	offset: number;
};

export type FilterActionResult = {
	success?: boolean;
	items?: Trade[];
	total?: number;
	limit?: number | null;
	offset?: number;
};

export type TradeFacets = {
	symbols: string[];
	tags: string[];
};

export type TradeSummary = {
	open_equity: number;
	pnl_last_7_days: number;
	volume_last_7_days: number;
	total_pnl: number;
};

export type TradeListResult = {
	items: Trade[];
	total: number;
	limit: number | null;
	offset: number;
};

export type TradeFilters = {
	symbol?: string;
	tradeType: TradeFilterType;
	tags?: string[];
	dateFrom?: string;
	dateTo?: string;
};

// Charts types/interfaces
export type BarChartData = {
	labels: string[];
	datasets: Array<{
		label: string;
		data: (number | null)[];
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
