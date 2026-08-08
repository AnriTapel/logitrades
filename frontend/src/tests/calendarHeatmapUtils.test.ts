import { describe, it, expect } from 'vitest';
import type { Trade } from '$lib/types';
import { formatPortfolioDateLocal } from '$lib/dates';
import {
	getDaysMatrix,
	getWeekdayLabels,
} from '$lib/components/custom/charts/calendar-heatmap/utils';

const TIMEZONE = 'UTC';
const LOCALE_US = new Intl.Locale('en-US'); // week starts Sunday
const LOCALE_GB = new Intl.Locale('en-GB'); // week starts Monday

let _id = 0;

function makeClosedTrade(params: {
	closedAt: string;
	openPrice: number;
	closePrice: number;
	quantity?: number;
	tradeType?: 'buy' | 'sell';
}): Trade {
	return {
		id: ++_id,
		symbol: 'TEST',
		tradeType: params.tradeType ?? 'buy',
		openPrice: params.openPrice,
		quantity: params.quantity ?? 1,
		openedAt: '2024-06-01T10:00:00.000Z',
		createdAt: '2024-06-01T10:00:00.000Z',
		closePrice: params.closePrice,
		closedAt: params.closedAt,
	};
}

function dateKey(iso: string): string {
	return formatPortfolioDateLocal(iso);
}

describe('getDaysMatrix', () => {
	// June 2024: 30 days, Sat Jun 1 … Sun Jun 30
	const monthKey = '2024-06';

	it('pads leading/trailing adjacent-month days with null (en-US, Sunday start)', () => {
		const matrix = getDaysMatrix(monthKey, new Map(), LOCALE_US, TIMEZONE);

		// 6 weeks × 7 days for June 2024 when week starts on Sunday
		expect(matrix).toHaveLength(6);
		expect(matrix.every((week) => week.length === 7)).toBe(true);

		// Week 0: Sun–Fri (May) are null; Sat Jun 1 is present
		expect(matrix[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
		expect(matrix[0][6]).toMatchObject({
			date: dateKey('2024-06-01T00:00:00.000Z'),
			pnl: 0,
			tradesCount: 0,
		});

		// Last week: Sun Jun 30 present; Mon–Sat (Jul) are null
		expect(matrix[5][0]).toMatchObject({
			date: dateKey('2024-06-30T00:00:00.000Z'),
			pnl: 0,
			tradesCount: 0,
		});
		expect(matrix[5].slice(1)).toEqual([null, null, null, null, null, null]);
	});

	it('aligns first of month for Monday-start locales (en-GB)', () => {
		const matrix = getDaysMatrix(monthKey, new Map(), LOCALE_GB, TIMEZONE);

		// 5 weeks when week starts on Monday
		expect(matrix).toHaveLength(5);

		// Week 0: Mon–Fri (May) null; Sat Jun 1 at index 5
		expect(matrix[0].slice(0, 5)).toEqual([null, null, null, null, null]);
		expect(matrix[0][5]).toMatchObject({
			date: dateKey('2024-06-01T00:00:00.000Z'),
			tradesCount: 0,
		});
		expect(matrix[0][6]).toMatchObject({
			date: dateKey('2024-06-02T00:00:00.000Z'),
			tradesCount: 0,
		});
	});

	it('aggregates PnL and trade count per in-month day', () => {
		const jun15 = '2024-06-15T14:00:00.000Z';
		const jun15Key = dateKey(jun15);

		// Two buys on Jun 15: +10 and +5 → pnl 15, count 2
		const tradesPerDayMap = new Map<string, Trade[]>([
			[
				jun15Key,
				[
					makeClosedTrade({
						closedAt: jun15,
						openPrice: 100,
						closePrice: 110,
					}),
					makeClosedTrade({
						closedAt: '2024-06-15T18:00:00.000Z',
						openPrice: 50,
						closePrice: 55,
					}),
				],
			],
		]);

		const matrix = getDaysMatrix(
			monthKey,
			tradesPerDayMap,
			LOCALE_US,
			TIMEZONE,
		);

		// Jun 15 2024 is a Saturday → week index 2, day index 6 (Sun-start)
		const cell = matrix[2][6];
		expect(cell).toEqual({
			date: jun15Key,
			pnl: 15,
			tradesCount: 2,
		});

		// A day with no trades still has a cell (not null)
		expect(matrix[2][5]).toMatchObject({
			date: dateKey('2024-06-14T00:00:00.000Z'),
			pnl: 0,
			tradesCount: 0,
		});
	});

	it('fills exactly daysInMonth non-null cells (handles 30-day June)', () => {
		const matrix = getDaysMatrix(monthKey, new Map(), LOCALE_US, TIMEZONE);
		const filled = matrix.flat().filter((cell) => cell !== null);
		expect(filled).toHaveLength(30);
	});
});

describe('getWeekdayLabels', () => {
	it('returns 7 labels starting on Sunday for en-US', () => {
		const labels = getWeekdayLabels(new Intl.Locale('en-US'));
		expect(labels).toHaveLength(7);
		expect(labels[0].toLowerCase()).toMatch(/^sun/);
		expect(labels[1].toLowerCase()).toMatch(/^mon/);
	});

	it('returns 7 labels starting on Monday for en-GB', () => {
		const labels = getWeekdayLabels(new Intl.Locale('en-GB'));
		expect(labels).toHaveLength(7);
		expect(labels[0].toLowerCase()).toMatch(/^mon/);
		expect(labels[6].toLowerCase()).toMatch(/^sun/);
	});
});
