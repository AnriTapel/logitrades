import { describe, expect, it } from 'vitest';
import {
	EMPTY_TRADE_FILTERS,
	hasActiveTradeFilters,
	normalizeTradeFilterType,
	tradeFiltersFromFormData,
	tradeFiltersToSearchParams,
	searchParamsToTradeFilters,
} from '$lib/filters/tradeFilters';

describe('tradeFilters', () => {
	it('defaults tradeType to all', () => {
		expect(EMPTY_TRADE_FILTERS.tradeType).toBe('all');
	});

	it('defaults portfolioId to undefined', () => {
		expect(EMPTY_TRADE_FILTERS.portfolioId).toBeUndefined();
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

	it('includes portfolio_id in search params when portfolioId is set', () => {
		const params = tradeFiltersToSearchParams(
			{ ...EMPTY_TRADE_FILTERS, portfolioId: 42 },
			{ status: 'open' },
		);
		expect(params.get('portfolio_id')).toBe('42');
	});

	it('omits portfolio_id in search params when portfolioId is undefined', () => {
		const params = tradeFiltersToSearchParams(EMPTY_TRADE_FILTERS, {
			status: 'open',
		});
		expect(params.get('portfolio_id')).toBeNull();
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
			portfolioId: undefined,
		});
	});

	it('parses portfolioId from form data', () => {
		const formData = new FormData();
		formData.set('symbol', '');
		formData.set('tradeType', 'all');
		formData.set('tags', '[]');
		formData.set('portfolioId', '7');

		const result = tradeFiltersFromFormData(formData);
		expect(result.portfolioId).toBe(7);
	});

	it('treats empty portfolioId form value as undefined', () => {
		const formData = new FormData();
		formData.set('symbol', '');
		formData.set('tradeType', 'all');
		formData.set('tags', '[]');
		formData.set('portfolioId', '');

		expect(tradeFiltersFromFormData(formData).portfolioId).toBeUndefined();
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

	describe('searchParamsToTradeFilters', () => {
		it('round-trips portfolioId through URL params', () => {
			const params = new URLSearchParams({ portfolio_id: '5' });
			const result = searchParamsToTradeFilters(params);
			expect(result.portfolioId).toBe(5);
		});

		it('returns undefined portfolioId when param is absent', () => {
			const params = new URLSearchParams();
			expect(searchParamsToTradeFilters(params).portfolioId).toBeUndefined();
		});

		it('returns undefined for non-numeric portfolio_id', () => {
			const params = new URLSearchParams({ portfolio_id: 'abc' });
			expect(searchParamsToTradeFilters(params).portfolioId).toBeUndefined();
		});
	});
});
