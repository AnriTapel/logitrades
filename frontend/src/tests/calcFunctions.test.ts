/**
 * Trading calc tests — expected values are hand-calculated from standard formulas.
 * Callers pass closed trades only (closePrice + closedAt set).
 */

import { describe, it, expect } from 'vitest';
import type { Trade } from '$lib/types';
import {
	calcAbsolutePnl,
	calcWinrate,
	calcAverageWin,
	calcAverageLoss,
	calcProfitFactor,
	calcExpectancy,
	calcPayoffRatio,
	calcAveragePlannedRiskReward,
	calcAverageRealizedR,
	calcMaxDrawdown,
	calcRecoveryFactor,
	pnlForPeriod,
} from '$lib/calcFunctions';

let _id = 0;

function closed(params: {
	tradeType: 'buy' | 'sell';
	openPrice: number;
	quantity: number;
	closePrice: number;
	closedAt?: string;
	stopLoss?: number;
	takeProfit?: number;
	fee?: number;
	leverage?: number;
}): Trade {
	return {
		id: ++_id,
		symbol: 'TEST',
		tradeType: params.tradeType,
		openPrice: params.openPrice,
		quantity: params.quantity,
		closePrice: params.closePrice,
		closedAt: params.closedAt ?? '2024-01-02T10:00:00Z',
		openedAt: '2024-01-01T10:00:00Z',
		createdAt: '2024-01-01T10:00:00Z',
		...(params.stopLoss !== undefined && { stopLoss: params.stopLoss }),
		...(params.takeProfit !== undefined && { takeProfit: params.takeProfit }),
		...(params.fee !== undefined && { fee: params.fee }),
		...(params.leverage !== undefined && { leverage: params.leverage }),
	};
}

// Fixture A: 4 longs, qty 1, SL 95, TP 110, exits 110/92/106/91
const fixtureA = [
	closed({
		tradeType: 'buy',
		openPrice: 100,
		quantity: 1,
		closePrice: 110,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-01T16:00:00Z',
	}),
	closed({
		tradeType: 'buy',
		openPrice: 100,
		quantity: 1,
		closePrice: 92,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-02T16:00:00Z',
	}),
	closed({
		tradeType: 'buy',
		openPrice: 100,
		quantity: 1,
		closePrice: 106,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-03T16:00:00Z',
	}),
	closed({
		tradeType: 'buy',
		openPrice: 100,
		quantity: 1,
		closePrice: 91,
		stopLoss: 95,
		takeProfit: 110,
		closedAt: '2024-01-04T16:00:00Z',
	}),
];

// Fixture B: fees on two trades (+18 net, -17 net → total +1)
const fixtureB = [
	closed({
		tradeType: 'buy',
		openPrice: 100,
		quantity: 1,
		closePrice: 120,
		stopLoss: 90,
		takeProfit: 120,
		fee: 2,
		closedAt: '2024-01-01T16:00:00Z',
	}),
	closed({
		tradeType: 'buy',
		openPrice: 100,
		quantity: 1,
		closePrice: 85,
		stopLoss: 90,
		takeProfit: 120,
		fee: 2,
		closedAt: '2024-01-02T16:00:00Z',
	}),
];

describe('calcAbsolutePnl', () => {
	it('returns null for open trades', () => {
		const open: Trade = {
			id: 1,
			symbol: 'TEST',
			tradeType: 'buy',
			openPrice: 100,
			quantity: 5,
			openedAt: '2024-01-01T10:00:00Z',
			createdAt: '2024-01-01T10:00:00Z',
		};
		expect(calcAbsolutePnl(open)).toBeNull();
	});

	it('long/short PnL with fees', () => {
		expect(
			calcAbsolutePnl(
				closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120, fee: 12 }),
			),
		).toBe(88);
		expect(
			calcAbsolutePnl(
				closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }),
			),
		).toBe(75);
	});

	it('leveraged liquidation loss', () => {
		// liq at 800 for 5x long; close 750 → -(1000×1)/5 = -200
		expect(
			calcAbsolutePnl(
				closed({
					tradeType: 'buy',
					openPrice: 1000,
					quantity: 1,
					closePrice: 750,
					leverage: 5,
				}),
			),
		).toBe(-200);
	});
});

describe('fixture A — mixed book, planned 1:2', () => {
	it('matches hand-calculated dashboard metrics', () => {
		expect(pnlForPeriod(fixtureA)).toBe(-1);
		expect(calcWinrate(fixtureA)).toBe(0.5);
		expect(calcAverageWin(fixtureA)).toBe(8);
		expect(calcAverageLoss(fixtureA)).toBe(-8.5);
		expect(calcProfitFactor(fixtureA)).toBeCloseTo(16 / 17);
		expect(calcExpectancy(fixtureA)).toBeCloseTo(-0.25);
		expect(calcPayoffRatio(fixtureA)).toBeCloseTo(8 / 8.5);
		expect(calcAveragePlannedRiskReward(fixtureA)).toBeCloseTo(2);
		expect(calcAverageRealizedR(fixtureA)).toBeCloseTo(-0.05);
		expect(calcMaxDrawdown(fixtureA).absolute).toBeCloseTo(-11);
		expect(calcRecoveryFactor(fixtureA)).toBeCloseTo(-1 / 11);
	});
});

describe('fixture B — fee-inclusive PnL and recovery', () => {
	it('matches hand-calculated metrics', () => {
		expect(pnlForPeriod(fixtureB)).toBe(1);
		expect(calcAveragePlannedRiskReward(fixtureB)).toBeCloseTo(2);
		expect(calcAverageRealizedR(fixtureB)).toBeCloseTo(0.05);
		expect(calcRecoveryFactor(fixtureB)).toBeCloseTo(1 / 17);
	});
});

describe('R:R eligibility', () => {
	it('planned R:R requires TP; realized R requires SL; zero risk is skipped', () => {
		expect(
			calcAveragePlannedRiskReward([
				closed({
					tradeType: 'buy',
					openPrice: 100,
					quantity: 1,
					closePrice: 110,
					stopLoss: 95,
				}),
			]),
		).toBeNull();

		expect(
			calcAverageRealizedR([
				closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110 }),
			]),
		).toBeNull();

		expect(
			calcAveragePlannedRiskReward([
				closed({
					tradeType: 'buy',
					openPrice: 100,
					quantity: 1,
					closePrice: 110,
					stopLoss: 100,
					takeProfit: 120,
				}),
			]),
		).toBeNull();
	});
});

describe('calcMaxDrawdown', () => {
	it('peak-to-trough on cumulative PnL', () => {
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 200,
				closedAt: '2024-01-01T00:00:00Z',
			}),
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 150,
				closedAt: '2024-01-02T00:00:00Z',
			}),
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 20,
				closedAt: '2024-01-03T00:00:00Z',
			}),
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 130,
				closedAt: '2024-01-04T00:00:00Z',
			}),
		];
		// equity: 100 → 150 → 70 → 100; max DD = 80 from peak 150
		const result = calcMaxDrawdown(trades);
		expect(result.absolute).toBeCloseTo(-80);
		expect(result.percentage).toBeCloseTo(-(80 / 150));
	});
});
