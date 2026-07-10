/**
 * Unit tests for tradeConverters public functions.
 *
 * Covers API ↔ UI ↔ form payload mapping used by journal create/update flows.
 */

import { describe, it, expect } from 'vitest';
import {
	convertApiTradeToUiTrade,
	convertApiTradeListToUi,
	convertUiTradeToTradeFormInput,
	normalizeTradeFormInputForApi,
} from '$lib/tradeConverters';
import type { ApiTrade, ApiTradeListResponse, Trade } from '$lib/types';
import type { TradeFormInput } from '$lib/schemas/tradeSchemas';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const apiTradeFull: ApiTrade = {
	id: 1,
	symbol: 'BTCUSDT',
	type: 'buy',
	open_price: 100,
	quantity: 10,
	stop_loss: 80,
	take_profit: 150,
	leverage: 5,
	opened_at: '2025-01-01T10:00:00Z',
	close_price: 120,
	closed_at: '2025-01-05T15:00:00Z',
	created_at: '2025-01-01T09:00:00Z',
	comment: 'Breakout entry',
	tags: ['breakout', 'scalp'],
};

const apiTradeMinimal: ApiTrade = {
	id: 2,
	symbol: 'ETHUSDT',
	type: 'sell',
	open_price: 2000,
	quantity: 1,
	stop_loss: null,
	take_profit: null,
	leverage: null,
	opened_at: '2025-02-01T12:00:00Z',
	close_price: null,
	closed_at: null,
	created_at: '2025-02-01T11:00:00Z',
	comment: null,
	tags: null,
};

const apiTradeEmptyTags: ApiTrade = {
	...apiTradeMinimal,
	id: 3,
	tags: [],
};

const uiTradeFull: Trade = {
	id: 1,
	symbol: 'BTCUSDT',
	tradeType: 'buy',
	openPrice: 100,
	quantity: 10,
	stopLoss: 80,
	takeProfit: 150,
	leverage: 5,
	openedAt: '2025-01-01T10:00:00.000Z',
	closePrice: 120,
	closedAt: '2025-01-05T15:00:00.000Z',
	createdAt: '2025-01-01T09:00:00.000Z',
	comment: 'Breakout entry',
	tags: ['breakout', 'scalp'],
};

const uiTradeNoLeverage: Trade = {
	id: 4,
	symbol: 'AAPL',
	tradeType: 'buy',
	openPrice: 150,
	quantity: 5,
	openedAt: '2025-03-01T10:00:00.000Z',
	createdAt: '2025-03-01T09:00:00.000Z',
};

const uiTradeLeverageOne: Trade = {
	...uiTradeNoLeverage,
	id: 5,
	leverage: 1,
};

const uiTradeEmptyTags: Trade = {
	...uiTradeNoLeverage,
	id: 6,
	tags: [],
};

const formInputBase: TradeFormInput = {
	symbol: 'btcusdt',
	tradeType: 'buy',
	useLeverage: false,
	leverage: 1,
	quantity: 10,
	openPrice: 100,
	openedAt: '2025-01-01T10:00:00.000Z',
};

const apiTradeListResponse: ApiTradeListResponse = {
	items: [apiTradeFull, apiTradeMinimal],
	total: 2,
	limit: 50,
	offset: 0,
};

// ---------------------------------------------------------------------------
// convertApiTradeToUiTrade
// ---------------------------------------------------------------------------

describe('convertApiTradeToUiTrade', () => {
	it('maps a full API trade to UI camelCase fields', () => {
		const result = convertApiTradeToUiTrade(apiTradeFull);

		expect(result).toEqual({
			id: 1,
			symbol: 'BTCUSDT',
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			stopLoss: 80,
			takeProfit: 150,
			leverage: 5,
			openedAt: '2025-01-01T10:00:00.000Z',
			closePrice: 120,
			closedAt: '2025-01-05T15:00:00.000Z',
			createdAt: '2025-01-01T09:00:00.000Z',
			comment: 'Breakout entry',
			tags: ['breakout', 'scalp'],
		});
	});

	it('converts null optional fields to undefined', () => {
		const result = convertApiTradeToUiTrade(apiTradeMinimal);

		expect(result.stopLoss).toBeUndefined();
		expect(result.takeProfit).toBeUndefined();
		expect(result.leverage).toBeUndefined();
		expect(result.closePrice).toBeUndefined();
		expect(result.closedAt).toBeUndefined();
		expect(result.comment).toBeUndefined();
		expect(result.tags).toBeUndefined();
		expect(result.tradeType).toBe('sell');
		expect(result.openedAt).toBe('2025-02-01T12:00:00.000Z');
		expect(result.createdAt).toBe('2025-02-01T11:00:00.000Z');
	});

	it('treats empty tags array as undefined', () => {
		const result = convertApiTradeToUiTrade(apiTradeEmptyTags);

		expect(result.tags).toBeUndefined();
	});

	it('normalizes datetime strings to UTC ISO via toUtcIso', () => {
		const result = convertApiTradeToUiTrade({
			...apiTradeMinimal,
			opened_at: '2025-02-01T12:00:00+00:00',
			created_at: '2025-02-01T11:00:00.000Z',
		});

		expect(result.openedAt).toBe('2025-02-01T12:00:00.000Z');
		expect(result.createdAt).toBe('2025-02-01T11:00:00.000Z');
	});
});

// ---------------------------------------------------------------------------
// convertUiTradeToTradeFormInput
// ---------------------------------------------------------------------------

describe('convertUiTradeToTradeFormInput', () => {
	it('maps a leveraged UI trade into form input with useLeverage true', () => {
		const result = convertUiTradeToTradeFormInput(uiTradeFull);

		expect(result.leverage).toBe(5);
		expect(result.useLeverage).toBe(true);
		expect(result.symbol).toBe('BTCUSDT');
		expect(result.tradeType).toBe('buy');
		expect(result.closePrice).toBe(120);
		expect(result.tags).toEqual(['breakout', 'scalp']);
	});

	it('defaults missing leverage to 1 and useLeverage to false', () => {
		const result = convertUiTradeToTradeFormInput(uiTradeNoLeverage);

		expect(result.leverage).toBe(1);
		expect(result.useLeverage).toBe(false);
	});

	it('treats leverage of 1 as useLeverage false', () => {
		const result = convertUiTradeToTradeFormInput(uiTradeLeverageOne);

		expect(result.leverage).toBe(1);
		expect(result.useLeverage).toBe(false);
	});

	it('treats empty tags as undefined', () => {
		const result = convertUiTradeToTradeFormInput(uiTradeEmptyTags);

		expect(result.tags).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// normalizeTradeFormInputForApi
// ---------------------------------------------------------------------------

describe('normalizeTradeFormInputForApi', () => {
	it('uppercases symbol before API submit', () => {
		const result = normalizeTradeFormInputForApi(formInputBase);

		expect(result.symbol).toBe('BTCUSDT');
		expect(result.quantity).toBe(10);
		expect(result.openPrice).toBe(100);
	});

	it('preserves tags when present', () => {
		const result = normalizeTradeFormInputForApi({
			...formInputBase,
			symbol: 'ethusdt',
			tags: ['breakout'],
		});

		expect(result.symbol).toBe('ETHUSDT');
		expect(result.tags).toEqual(['breakout']);
	});

	it('clears empty tags to undefined', () => {
		const result = normalizeTradeFormInputForApi({
			...formInputBase,
			tags: [],
		});

		expect(result.tags).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// convertApiTradeListToUi
// ---------------------------------------------------------------------------

describe('convertApiTradeListToUi', () => {
	it('maps list items and preserves pagination metadata', () => {
		const result = convertApiTradeListToUi(apiTradeListResponse);

		expect(result.total).toBe(2);
		expect(result.limit).toBe(50);
		expect(result.offset).toBe(0);
		expect(result.items).toHaveLength(2);
		expect(result.items[0]).toEqual(convertApiTradeToUiTrade(apiTradeFull));
		expect(result.items[1]).toEqual(convertApiTradeToUiTrade(apiTradeMinimal));
	});

	it('handles an empty list with null limit', () => {
		const result = convertApiTradeListToUi({
			items: [],
			total: 0,
			limit: null,
			offset: 0,
		});

		expect(result.items).toEqual([]);
		expect(result.total).toBe(0);
		expect(result.limit).toBeNull();
		expect(result.offset).toBe(0);
	});
});
