import { deserialize } from '$app/forms';
import type {
	FilterActionResult,
	TradeListResult,
	TradeFilters,
} from '$lib/types';
import { TRADES_PAGE_SIZE } from './constants/trades';

export function filtersToFormData(filters: TradeFilters, offset = 0): FormData {
	const formData = new FormData();
	formData.set('symbol', filters.symbol ?? '');
	formData.set('tradeType', filters.tradeType ?? 'all');
	formData.set('tags', JSON.stringify(filters.tags ?? []));
	if (filters.dateFrom) formData.set('dateFrom', filters.dateFrom);
	if (filters.dateTo) formData.set('dateTo', filters.dateTo);
	formData.set('offset', String(offset));
	return formData;
}

export async function submitTradeFilterAction(
	action: 'filterOpened' | 'filterClosed' | 'filterDashboard',
	filters: TradeFilters,
	offset = 0,
): Promise<TradeListResult> {
	const response = await fetch(`?/${action}`, {
		method: 'POST',
		body: filtersToFormData(filters, offset),
	});

	const result = deserialize(await response.text());

	if (result.type !== 'success') {
		return {
			items: [],
			total: 0,
			limit: TRADES_PAGE_SIZE,
			offset,
		};
	}

	const data = (result.data ?? {}) as FilterActionResult;

	return {
		items: data.items ?? [],
		total: data.total ?? 0,
		limit: data.limit ?? TRADES_PAGE_SIZE,
		offset: data.offset ?? offset,
	};
}
