import type { UtcIsoDateTime } from '$lib/dates';

export type TradeType = 'buy' | 'sell';
/** Filter-only side value; domain trades use TradeType only. */
export type TradeFilterType = TradeType | 'all';

export type SubscriptionPlan = 'free' | 'pro' | 'max';

export type PlanVariant =
	| 'pro_monthly'
	| 'pro_annually'
	| 'max_monthly'
	| 'max_annually';

export type Subscription = {
	id: number;
	user_id: number;
	lemonsqueezy_subscription_id: string;
	lemonsqueezy_customer_id: string | null;
	product_id: string | null;
	variant_id: string | null;
	plan_variant: PlanVariant | null;
	status: string;
	renews_at: string | null;
	ends_at: string | null;
	trial_ends_at: string | null;
	card_brand: string | null;
	card_last_four: string | null;
	created_at: string | null;
	updated_at: string | null;
	urls: Record<string, string> | null;
};

export type SubscriptionInvoice = {
	id: string;
	store_id: number | null;
	subscription_id: number | string | null;
	customer_id: number | string | null;
	status: string | null;
	billing_reason: string | null;
	card_brand: string | null;
	card_last_four: string | null;
	currency: string | null;
	total: number | null;
	total_formatted: string | null;
	refunded: boolean | null;
	refunded_at: string | null;
	created_at: string | null;
	updated_at: string | null;
	urls: Record<string, string> | null;
};

export type PortfolioStatus = 'active' | 'archived';

export interface Portfolio {
	id: number;
	user_id: number;
	name: string;
	is_default: boolean;
	status: PortfolioStatus;
	starting_capital: number;
	started_at: string | null;
	created_at: string | null;
	currency: string;
}

export type BalanceTransaction = {
	id: number;
	portfolio_id: number;
	user_id: number;
	type: 'deposit' | 'withdrawal';
	amount: number;
	note: string | null;
	occurred_at: string;
	created_at: string | null;
};

export type PortfolioSummary = {
	starting_capital: number;
	started_at: string | null;
	cash: number;
	realized_pnl: number;
	equity: number;
	return_pct: number;
	open_notional: number;
};

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
	fee?: number;
	portfolioId?: number;
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
	fee?: number | null;
	portfolio_id?: number | null;
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
	open_notional: number;
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
	portfolioId?: number;
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

export type ItemOption = {
	key: string;
	label: string;
}

export type CalendarHeatmapItemData = { date: string, pnl: number, tradesCount: number } | null;