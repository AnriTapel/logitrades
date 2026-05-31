/**
 * Unit tests for chart data helper functions.
 *
 * Focuses on pure data-transformation and aggregation functions.
 * All expected values are derived from first principles, independently
 * of the implementation source.
 */

import { describe, it, expect } from 'vitest';
import type { Trade } from '$lib/types';
import {
	getColorPalette,
	getSymbolStats,
	createTradeTypeStats,
	createRiskRewardDistribution,
} from '$lib/chartsHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _id = 0;

function makeTrade(params: {
	symbol?: string;
	tradeType: 'buy' | 'sell';
	openPrice: number;
	quantity: number;
	closePrice?: number;
	closedAt?: string;
	openedAt?: string;
	leverage?: number;
	stopLoss?: number;
}): Trade {
	const base: Trade = {
		id: ++_id,
		symbol: params.symbol ?? 'TEST',
		tradeType: params.tradeType,
		openPrice: params.openPrice,
		quantity: params.quantity,
		openedAt: params.openedAt ?? '2024-01-01T10:00:00Z',
		createdAt: '2024-01-01T10:00:00Z',
	};
	if (params.closePrice !== undefined) base.closePrice = params.closePrice;
	if (params.closedAt !== undefined) base.closedAt = params.closedAt;
	if (params.leverage !== undefined) base.leverage = params.leverage;
	if (params.stopLoss !== undefined) base.stopLoss = params.stopLoss;
	return base;
}

function closed(
	params: Parameters<typeof makeTrade>[0] & { closePrice: number },
): Trade {
	return makeTrade({
		...params,
		closedAt: params.closedAt ?? '2024-01-02T10:00:00Z',
	});
}

// ---------------------------------------------------------------------------
// getColorPalette
// ---------------------------------------------------------------------------

describe('getColorPalette', () => {
	it('returns an array of the requested length', () => {
		expect(getColorPalette(3)).toHaveLength(3);
		expect(getColorPalette(7)).toHaveLength(7);
	});

	it('returns an empty array for count = 0', () => {
		expect(getColorPalette(0)).toEqual([]);
	});

	it('wraps around the palette when count exceeds palette size', () => {
		// The palette has 7 entries; asking for 8 should cycle back to entry 0
		const palette7 = getColorPalette(7);
		const palette8 = getColorPalette(8);
		expect(palette8[7]).toBe(palette7[0]);
	});
});

// ---------------------------------------------------------------------------
// getSymbolStats
// ---------------------------------------------------------------------------

describe('getSymbolStats', () => {
	it('returns an empty array for no trades', () => {
		expect(getSymbolStats([])).toEqual([]);
	});

	it('aggregates PnL, notional volume and winrate per symbol', () => {
		// AAPL trades:
		//   t1: long open=100, close=120, qty=5 → pnl=+100, volume=(100+120)×5=1100
		//   t2: long open=100, close=85,  qty=5 → pnl=-75,  volume=(100+85)×5=925
		//   AAPL total pnl=25, notional=2025, winrate=1/2=0.5
		//
		// GOOG trades:
		//   t3: short open=200, close=175, qty=3 → pnl=+75, volume=(200+175)×3=1125
		//   GOOG total pnl=75, notional=1125, winrate=1/1=1.0
		const trades = [
			closed({
				symbol: 'AAPL',
				tradeType: 'buy',
				openPrice: 100,
				quantity: 5,
				closePrice: 120,
			}),
			closed({
				symbol: 'AAPL',
				tradeType: 'buy',
				openPrice: 100,
				quantity: 5,
				closePrice: 85,
			}),
			closed({
				symbol: 'GOOG',
				tradeType: 'sell',
				openPrice: 200,
				quantity: 3,
				closePrice: 175,
			}),
		];

		const stats = getSymbolStats(trades);

		const aapl = stats.find((s) => s.symbol === 'AAPL')!;
		expect(aapl).toBeDefined();
		expect(aapl.pnl).toBeCloseTo(25);
		expect(aapl.notionalVolume).toBeCloseTo(2025);
		expect(aapl.winrate).toBeCloseTo(0.5);

		const goog = stats.find((s) => s.symbol === 'GOOG')!;
		expect(goog).toBeDefined();
		expect(goog.pnl).toBeCloseTo(75);
		expect(goog.notionalVolume).toBeCloseTo(1125);
		expect(goog.winrate).toBeCloseTo(1.0);
	});

	it('sorts results by notional volume descending', () => {
		// AAPL notional=2025, GOOG notional=1125 → AAPL should appear first
		const trades = [
			closed({
				symbol: 'AAPL',
				tradeType: 'buy',
				openPrice: 100,
				quantity: 5,
				closePrice: 120,
			}),
			closed({
				symbol: 'AAPL',
				tradeType: 'buy',
				openPrice: 100,
				quantity: 5,
				closePrice: 85,
			}),
			closed({
				symbol: 'GOOG',
				tradeType: 'sell',
				openPrice: 200,
				quantity: 3,
				closePrice: 175,
			}),
		];
		const stats = getSymbolStats(trades);
		expect(stats[0].symbol).toBe('AAPL');
		expect(stats[1].symbol).toBe('GOOG');
	});

	it('notional volume uses 0 for missing closePrice on open trades', () => {
		const openTrade = makeTrade({
			symbol: 'BTC',
			tradeType: 'buy',
			openPrice: 30000,
			quantity: 1,
		});
		const stats = getSymbolStats([openTrade]);
		// volume = (30000 + 0) × 1 = 30000
		expect(stats[0].notionalVolume).toBe(30000);
	});
});

// ---------------------------------------------------------------------------
// createTradeTypeStats
// ---------------------------------------------------------------------------

describe('createTradeTypeStats', () => {
	it('always returns two entries: long and short', () => {
		const result = createTradeTypeStats([]);
		expect(result).toHaveLength(2);
		expect(result.map((r) => r.type)).toContain('long');
		expect(result.map((r) => r.type)).toContain('short');
	});

	it('counts all buy trades (including open) in tradeCount for long', () => {
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
			}),
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90 }),
			makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 1 }), // open
		];
		const longStats = createTradeTypeStats(trades).find(
			(s) => s.type === 'long',
		)!;
		expect(longStats.tradeCount).toBe(3);
	});

	it('computes winrate only from closed buy trades', () => {
		// 2 closed wins + 1 closed loss → winrate = 2/3 × 100 ≈ 66.67
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
			}), // W
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
			}), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90 }), // L
		];
		const longStats = createTradeTypeStats(trades).find(
			(s) => s.type === 'long',
		)!;
		expect(longStats.winrate).toBeCloseTo((2 / 3) * 100);
	});

	it('counts all sell trades in tradeCount for short', () => {
		const trades = [
			closed({
				tradeType: 'sell',
				openPrice: 200,
				quantity: 1,
				closePrice: 175,
			}), // W
			closed({
				tradeType: 'sell',
				openPrice: 200,
				quantity: 1,
				closePrice: 220,
			}), // L
		];
		const shortStats = createTradeTypeStats(trades).find(
			(s) => s.type === 'short',
		)!;
		expect(shortStats.tradeCount).toBe(2);
		expect(shortStats.winrate).toBeCloseTo(50);
	});

	it('returns winrate 0 when there are no closed trades of a given type', () => {
		const trades = [
			makeTrade({ tradeType: 'sell', openPrice: 200, quantity: 1 }), // open sell trade
		];
		const shortStats = createTradeTypeStats(trades).find(
			(s) => s.type === 'short',
		)!;
		expect(shortStats.winrate).toBe(0);
	});

	it('long tradeCount is 0 when there are only short trades', () => {
		const trades = [
			closed({
				tradeType: 'sell',
				openPrice: 200,
				quantity: 1,
				closePrice: 175,
			}),
		];
		const longStats = createTradeTypeStats(trades).find(
			(s) => s.type === 'long',
		)!;
		expect(longStats.tradeCount).toBe(0);
		expect(longStats.winrate).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// createRiskRewardDistribution
// ---------------------------------------------------------------------------

describe('createRiskRewardDistribution', () => {
	it('returns 9 buckets covering the full RR range', () => {
		const result = createRiskRewardDistribution([]);
		expect(result.datasets[0].data).toHaveLength(9);
		expect(result.labels).toHaveLength(9);
	});

	it('returns all-zero counts for empty trades', () => {
		const result = createRiskRewardDistribution([]);
		expect(result.datasets[0].data.every((v) => v === 0)).toBe(true);
	});

	it('places a trade with RR=1.5 in the [1.2, 2) bucket (index 6)', () => {
		// long, open=100, close=115, qty=10, SL=90
		// actualPnl = (115-100)×10 = 150
		// plannedRisk = |90-100|×10 = 100
		// RR = 150/100 = 1.5 → bucket index 6 → label "[1.2, 2)"
		const trade = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 115,
			stopLoss: 90,
		});
		const result = createRiskRewardDistribution([trade]);
		const counts = result.datasets[0].data as number[];
		expect(counts[6]).toBe(1);
		// All other buckets should be 0
		counts.forEach((c, i) => {
			if (i !== 6) expect(c).toBe(0);
		});
	});

	it('places a trade with RR=-2.0 in the [-2, -1.2) bucket (index 2)', () => {
		// long, open=100, close=80, qty=10, SL=90
		// actualPnl = (80-100)×10 = -200
		// plannedRisk = |90-100|×10 = 100
		// RR = -200/100 = -2.0 → bucket index 2 → label "[-2, -1.2)"
		const trade = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 80,
			stopLoss: 90,
		});
		const result = createRiskRewardDistribution([trade]);
		const counts = result.datasets[0].data as number[];
		expect(counts[2]).toBe(1);
	});

	it('ignores trades without a stop-loss', () => {
		const tradeNoSL = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 115,
		});
		const result = createRiskRewardDistribution([tradeNoSL]);
		const counts = result.datasets[0].data as number[];
		expect(counts.every((v) => v === 0)).toBe(true);
	});

	it('places a highly profitable trade (RR>4) in the >4 bucket (index 8)', () => {
		// open=100, close=160, qty=10, SL=95
		// actualPnl = (160-100)×10 = 600
		// plannedRisk = |95-100|×10 = 50
		// RR = 600/50 = 12.0 → index 8 → label ">4"
		const trade = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 160,
			stopLoss: 95,
		});
		const result = createRiskRewardDistribution([trade]);
		const counts = result.datasets[0].data as number[];
		expect(counts[8]).toBe(1);
	});

	it('accumulates multiple trades in the correct buckets', () => {
		// trade1: RR=1.5 → index 6
		// trade2: RR=-2.0 → index 2
		const trade1 = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 115,
			stopLoss: 90,
		});
		const trade2 = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 80,
			stopLoss: 90,
		});
		const result = createRiskRewardDistribution([trade1, trade2]);
		const counts = result.datasets[0].data as number[];
		expect(counts[6]).toBe(1);
		expect(counts[2]).toBe(1);
		// Total across all buckets should be 2
		const total = counts.reduce((sum, v) => sum + v, 0);
		expect(total).toBe(2);
	});
});
