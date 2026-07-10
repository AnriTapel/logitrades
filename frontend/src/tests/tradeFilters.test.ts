import { describe, expect, it } from 'vitest';
import {
	EMPTY_TRADE_FILTERS,
	hasActiveTradeFilters,
	normalizeTradeFilterType,
	tradeFiltersFromFormData,
	tradeFiltersToSearchParams,
} from '$lib/filters/tradeFilters';

describe('tradeFilters', () => {
	it('defaults tradeType to all', () => {
		expect(EMPTY_TRADE_FILTERS.tradeType).toBe('all');
	});

	it('normalizes empty and unknown values to all', () => {
		expect(normalizeTradeFilterType('')).toBe('all');
		expect(normalizeTradeFilterType(undefined)).toBe('all');
		expect(normalizeTradeFilterType('invalid')).toBe('all');
	});

	it('does not treat all as an active filter', () => {
		expect(hasActiveTradeFilters({ ...EMPTY_TRADE_FILTERS })).toBe(false);
		expect(
			hasActiveTradeFilters({ ...EMPTY_TRADE_FILTERS, tradeType: 'buy' }),
		).toBe(true);
	});

	it('omits type query param when tradeType is all', () => {
		const params = tradeFiltersToSearchParams(EMPTY_TRADE_FILTERS, {
			status: 'open',
		});
		expect(params.get('type')).toBeNull();
		expect(params.get('status')).toBe('open');
	});

	it('includes type query param for buy and sell', () => {
		const buyParams = tradeFiltersToSearchParams(
			{ ...EMPTY_TRADE_FILTERS, tradeType: 'buy' },
			{ status: 'closed' },
		);
		expect(buyParams.get('type')).toBe('buy');

		const sellParams = tradeFiltersToSearchParams(
			{ ...EMPTY_TRADE_FILTERS, tradeType: 'sell' },
			{ status: 'closed' },
		);
		expect(sellParams.get('type')).toBe('sell');
	});

	it('parses tradeType from form data', () => {
		const formData = new FormData();
		formData.set('symbol', 'BTC');
		formData.set('tradeType', 'all');
		formData.set('tags', '[]');

		expect(tradeFiltersFromFormData(formData)).toEqual({
			symbol: 'BTC',
			tradeType: 'all',
			tags: [],
			dateFrom: undefined,
			dateTo: undefined,
		});
	});

	it('passes ISO date filter values through to API params', () => {
		const iso = '2026-07-01T00:00:00.000Z';
		const params = tradeFiltersToSearchParams(
			{
				...EMPTY_TRADE_FILTERS,
				dateFrom: iso,
				dateTo: '2026-07-10',
			},
			{ status: 'open' },
		);
		expect(params.get('date_from')).toBe(iso);
		expect(params.get('date_to')).toBe('2026-07-10');
	});
});
