import type { TradeFilterType, TradeFilters } from '$lib/types';

export const EMPTY_TRADE_FILTERS: TradeFilters = {
	symbol: '',
	tradeType: 'all',
	tags: [],
	dateFrom: undefined,
	dateTo: undefined,
};

export function normalizeTradeFilterType(
	value: string | undefined | null,
): TradeFilterType {
	if (value === 'buy' || value === 'sell') {
		return value;
	}
	return 'all';
}

function isTradeTypeFilterActive(tradeType?: TradeFilterType): boolean {
	return tradeType === 'buy' || tradeType === 'sell';
}

export function hasActiveTradeFilters(filters: TradeFilters): boolean {
	return Boolean(
		filters.symbol?.trim() ||
			isTradeTypeFilterActive(filters.tradeType) ||
			(filters.tags?.length ?? 0) > 0 ||
			filters.dateFrom ||
			filters.dateTo,
	);
}

type TradeListQueryContext = {
	status: 'open' | 'closed';
	limit?: number;
	offset?: number;
	paginate?: boolean;
};

export function tradeFiltersToSearchParams(
	filters: TradeFilters,
	ctx: TradeListQueryContext,
): URLSearchParams {
	const params = new URLSearchParams();
	params.set('status', ctx.status);

	if (filters.symbol?.trim()) {
		params.set('symbol', filters.symbol.trim());
	}
	if (isTradeTypeFilterActive(filters.tradeType)) {
		params.set('type', filters.tradeType!);
	}
	for (const tag of filters.tags ?? []) {
		params.append('tags', tag);
	}
	if (filters.dateFrom) {
		params.set('date_from', filters.dateFrom);
	}
	if (filters.dateTo) {
		params.set('date_to', filters.dateTo);
	}
	if (ctx.paginate === false) {
		params.set('paginate', 'false');
	} else {
		params.set('limit', String(ctx.limit ?? 50));
		params.set('offset', String(ctx.offset ?? 0));
	}
	return params;
}

export function searchParamsToTradeFilters(
	params: URLSearchParams,
): TradeFilters {
	const tags = params.getAll('tags');
	const typeParam = params.get('type');
	return {
		symbol: params.get('symbol') ?? '',
		tradeType: typeParam ? normalizeTradeFilterType(typeParam) : 'all',
		tags: tags.length ? tags : [],
		dateFrom: params.get('date_from') ?? undefined,
		dateTo: params.get('date_to') ?? undefined,
	};
}

export function tradeFiltersFromFormData(formData: FormData): TradeFilters {
	const tagsRaw = formData.get('tags');
	let tags: string[] = [];
	if (typeof tagsRaw === 'string' && tagsRaw) {
		try {
			tags = JSON.parse(tagsRaw) as string[];
		} catch {
			tags = [];
		}
	}
	return {
		symbol: String(formData.get('symbol') ?? ''),
		tradeType: normalizeTradeFilterType(
			String(formData.get('tradeType') ?? ''),
		),
		tags,
		dateFrom: String(formData.get('dateFrom') ?? '') || undefined,
		dateTo: String(formData.get('dateTo') ?? '') || undefined,
	};
}
