/**
 * Unit tests for trading calculation functions.
 *
 * All expected values are derived from first-principles financial formulas,
 * not from inspecting the implementation source.
 *
 * Core formulas used:
 *   Long PnL  = (closePrice - openPrice) × quantity
 *   Short PnL = (openPrice - closePrice) × quantity
 *   Leveraged liquidation (long)  when closePrice ≤ openPrice × (1 - 1/leverage)
 *   Leveraged liquidation (short) when closePrice ≥ openPrice × (1 + 1/leverage)
 *   Liquidation loss = -(openPrice × quantity) / leverage
 *   PnL%   = absolutePnl / (openPrice × quantity / leverage)
 *   Winrate = winning closed trades / total trades passed in
 *   Profit factor = Σgross profits / |Σgross losses|
 *   Expectancy = Σpnl of closed trades / number of closed trades
 *   Risk/Reward = actualPnl / plannedRisk  (plannedRisk = |SL - open| × qty)
 */

import { describe, it, expect } from 'vitest';
import type { Trade } from '$lib/types';
import {
	calcAbsolutePnl,
	calcPnlPercentage,
	calculatePnl,
	calcWinrate,
	calcAverageWin,
	calcAverageLoss,
	calcProfitFactor,
	calcExpectancy,
	calcBestTrade,
	calcWorstTrade,
	calcGrossProfit,
	calcGrossLoss,
	calcMaxWinStreak,
	calcMaxLossStreak,
	calcAverageTradeDuration,
	calcMaxDrawdown,
	calcAverageRiskReward,
	pnlForPeriod,
	totalTradedVolumeForPeriod,
	totalEquityInOpenedTrades,
} from '$lib/calcFunctions';

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
	takeProfit?: number;
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
	if (params.takeProfit !== undefined) base.takeProfit = params.takeProfit;
	return base;
}

/** Closed trade shorthand – closedAt defaults to one day after open. */
function closed(params: Parameters<typeof makeTrade>[0] & { closePrice: number }): Trade {
	return makeTrade({
		...params,
		closedAt: params.closedAt ?? '2024-01-02T10:00:00Z',
	});
}

// ---------------------------------------------------------------------------
// calcAbsolutePnl
// ---------------------------------------------------------------------------

describe('calcAbsolutePnl', () => {
	it('returns null for an open trade (no closePrice)', () => {
		const trade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 5 });
		expect(calcAbsolutePnl(trade)).toBeNull();
	});

	it('long win: PnL = (closePrice - openPrice) × quantity', () => {
		// (120 - 100) × 5 = 100
		const trade = closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 });
		expect(calcAbsolutePnl(trade)).toBe(100);
	});

	it('long loss: PnL is negative when closePrice < openPrice', () => {
		// (85 - 100) × 5 = -75
		const trade = closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 });
		expect(calcAbsolutePnl(trade)).toBe(-75);
	});

	it('short win: PnL = (openPrice - closePrice) × quantity', () => {
		// (200 - 175) × 3 = 75
		const trade = closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 });
		expect(calcAbsolutePnl(trade)).toBe(75);
	});

	it('short loss: PnL is negative when closePrice > openPrice', () => {
		// (200 - 220) × 3 = -60
		const trade = closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 220 });
		expect(calcAbsolutePnl(trade)).toBe(-60);
	});

	it('leveraged long (no liquidation): normal PnL formula applies', () => {
		// open=1000, close=1100, qty=1, leverage=5
		// liqPrice = 1000 × (1 - 1/5) = 800; close=1100 > 800 → no liquidation
		// PnL = (1100 - 1000) × 1 = 100
		const trade = closed({
			tradeType: 'buy',
			openPrice: 1000,
			quantity: 1,
			closePrice: 1100,
			leverage: 5,
		});
		expect(calcAbsolutePnl(trade)).toBe(100);
	});

	it('leveraged long liquidation: loss = -(openPrice × quantity) / leverage', () => {
		// open=1000, close=750, qty=1, leverage=5
		// liqPrice = 1000 × (1 - 0.2) = 800; close=750 ≤ 800 → liquidation
		// PnL = -(1000 × 1) / 5 = -200
		const trade = closed({
			tradeType: 'buy',
			openPrice: 1000,
			quantity: 1,
			closePrice: 750,
			leverage: 5,
		});
		expect(calcAbsolutePnl(trade)).toBe(-200);
	});

	it('leveraged long liquidation at exact liquidation price', () => {
		// liqPrice = 1000 × 0.8 = 800; close=800 ≤ 800 → liquidation
		const trade = closed({
			tradeType: 'buy',
			openPrice: 1000,
			quantity: 1,
			closePrice: 800,
			leverage: 5,
		});
		expect(calcAbsolutePnl(trade)).toBe(-200);
	});

	it('leveraged short (no liquidation): normal PnL formula applies', () => {
		// open=1000, close=900, qty=1, leverage=5
		// liqPriceShort = 1000 × (1 + 0.2) = 1200; close=900 < 1200 → no liquidation
		// PnL = (1000 - 900) × 1 = 100
		const trade = closed({
			tradeType: 'sell',
			openPrice: 1000,
			quantity: 1,
			closePrice: 900,
			leverage: 5,
		});
		expect(calcAbsolutePnl(trade)).toBe(100);
	});

	it('leveraged short liquidation: loss = -(openPrice × quantity) / leverage', () => {
		// open=1000, close=1250, qty=1, leverage=5
		// liqPriceShort = 1000 × 1.2 = 1200; close=1250 ≥ 1200 → liquidation
		// PnL = -(1000 × 1) / 5 = -200
		const trade = closed({
			tradeType: 'sell',
			openPrice: 1000,
			quantity: 1,
			closePrice: 1250,
			leverage: 5,
		});
		expect(calcAbsolutePnl(trade)).toBe(-200);
	});

	it('leveraged short liquidation at exact liquidation price', () => {
		// liqPriceShort = 1000 × 1.2 = 1200; close=1200 ≥ 1200 → liquidation
		const trade = closed({
			tradeType: 'sell',
			openPrice: 1000,
			quantity: 1,
			closePrice: 1200,
			leverage: 5,
		});
		expect(calcAbsolutePnl(trade)).toBe(-200);
	});

	it('break-even trade returns 0', () => {
		const trade = closed({ tradeType: 'buy', openPrice: 100, quantity: 10, closePrice: 100 });
		expect(calcAbsolutePnl(trade)).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// calcPnlPercentage
// ---------------------------------------------------------------------------

describe('calcPnlPercentage', () => {
	it('returns null for an open trade', () => {
		const trade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 5 });
		expect(calcPnlPercentage(trade)).toBeNull();
	});

	it('long win without leverage: pnl% = absolutePnl / (openPrice × qty)', () => {
		// absolutePnl = 100, invested = 100 × 5 = 500 → 100/500 = 0.20
		const trade = closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 });
		expect(calcPnlPercentage(trade)).toBeCloseTo(0.2);
	});

	it('long win with leverage: invested capital is reduced by leverage factor', () => {
		// absolutePnl = 100, invested = 100 × 5 / 5 = 100 → 100/100 = 1.0
		const trade = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 5,
			closePrice: 120,
			leverage: 5,
		});
		expect(calcPnlPercentage(trade)).toBeCloseTo(1.0);
	});

	it('short win: pnl% = absolutePnl / (openPrice × qty)', () => {
		// absolutePnl = 75, invested = 200 × 3 = 600 → 75/600 = 0.125
		const trade = closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 });
		expect(calcPnlPercentage(trade)).toBeCloseTo(0.125);
	});

	it('long loss produces a negative percentage', () => {
		// absolutePnl = -75, invested = 500 → -75/500 = -0.15
		const trade = closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 });
		expect(calcPnlPercentage(trade)).toBeCloseTo(-0.15);
	});
});

// ---------------------------------------------------------------------------
// calculatePnl  (variant that returns 0 instead of null for open trades)
// ---------------------------------------------------------------------------

describe('calculatePnl', () => {
	it('returns 0 for an open trade (no closePrice)', () => {
		const trade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 5 });
		expect(calculatePnl(trade)).toBe(0);
	});

	it('long trade: (close - open) × qty', () => {
		// (120 - 100) × 5 = 100
		const trade = closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 });
		expect(calculatePnl(trade)).toBe(100);
	});

	it('short trade: (open - close) × qty', () => {
		// (200 - 175) × 3 = 75
		const trade = closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 });
		expect(calculatePnl(trade)).toBe(75);
	});
});

// ---------------------------------------------------------------------------
// calcWinrate
// ---------------------------------------------------------------------------

describe('calcWinrate', () => {
	it('returns 0 for an empty array', () => {
		expect(calcWinrate([])).toBe(0);
	});

	it('returns 1.0 when every closed trade is a winner', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110 }),
			closed({ tradeType: 'sell', openPrice: 200, quantity: 1, closePrice: 180 }),
			closed({ tradeType: 'buy', openPrice: 50, quantity: 2, closePrice: 60 }),
		];
		expect(calcWinrate(trades)).toBe(1.0);
	});

	it('returns 0 when every closed trade is a loser', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90 }),
			closed({ tradeType: 'sell', openPrice: 200, quantity: 1, closePrice: 210 }),
		];
		expect(calcWinrate(trades)).toBe(0);
	});

	it('returns ratio of winners to total trades passed in', () => {
		// 2 wins + 1 loss → 2/3
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110 }),
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90 }),
			closed({ tradeType: 'sell', openPrice: 200, quantity: 1, closePrice: 180 }),
		];
		expect(calcWinrate(trades)).toBeCloseTo(2 / 3);
	});
});

// ---------------------------------------------------------------------------
// calcAverageWin
// ---------------------------------------------------------------------------

describe('calcAverageWin', () => {
	it('returns 0 for an empty array', () => {
		expect(calcAverageWin([])).toBe(0);
	});

	it('returns 0 when there are no winning trades', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90 }),
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 80 }),
		];
		expect(calcAverageWin(trades)).toBe(0);
	});

	it('returns the mean PnL of all winning closed trades', () => {
		// wins: +100, +50, +75 → avg = 75
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }), // +100
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 110 }), // +50
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }), // +75
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 90 }),  // -50 (loss, excluded)
		];
		expect(calcAverageWin(trades)).toBeCloseTo(75);
	});

	it('excludes open trades (no closePrice / closedAt)', () => {
		const closedWin = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 5,
			closePrice: 120,
		}); // +100
		const openTrade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 5 });
		expect(calcAverageWin([closedWin, openTrade])).toBeCloseTo(100);
	});
});

// ---------------------------------------------------------------------------
// calcAverageLoss
// ---------------------------------------------------------------------------

describe('calcAverageLoss', () => {
	it('returns 0 for an empty array', () => {
		expect(calcAverageLoss([])).toBe(0);
	});

	it('returns 0 when there are no losing trades', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110 }),
		];
		expect(calcAverageLoss(trades)).toBe(0);
	});

	it('returns the mean (negative) PnL of all losing closed trades', () => {
		// losses: -75, -60, -45 → avg = -60
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),  // -75
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 220 }), // -60
			closed({ tradeType: 'buy', openPrice: 100, quantity: 3, closePrice: 85 }),  // -45
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }), // +100 (win, excluded)
		];
		expect(calcAverageLoss(trades)).toBeCloseTo(-60);
	});

	it('excludes open trades', () => {
		const closedLoss = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 5,
			closePrice: 85,
		}); // -75
		const openTrade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 5 });
		expect(calcAverageLoss([closedLoss, openTrade])).toBeCloseTo(-75);
	});
});

// ---------------------------------------------------------------------------
// calcProfitFactor
// ---------------------------------------------------------------------------

describe('calcProfitFactor', () => {
	it('returns 0 for empty trades', () => {
		expect(calcProfitFactor([])).toBe(0);
	});

	it('returns Infinity when there are profits but zero losses', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110 }),
		];
		expect(calcProfitFactor(trades)).toBe(Infinity);
	});

	it('returns 0 when there are losses but zero profit', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90 }),
		];
		expect(calcProfitFactor(trades)).toBe(0);
	});

	it('profit factor = grossProfit / |grossLoss|', () => {
		// wins: +100, +50, +75 = 225 total profit
		// losses: -75, -60, -45 → |total| = 180
		// PF = 225 / 180 = 1.25
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 110 }),  // +50
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }), // +75
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),   // -75
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 220 }), // -60
			closed({ tradeType: 'buy', openPrice: 100, quantity: 3, closePrice: 85 }),   // -45
		];
		expect(calcProfitFactor(trades)).toBeCloseTo(1.25);
	});
});

// ---------------------------------------------------------------------------
// calcExpectancy
// ---------------------------------------------------------------------------

describe('calcExpectancy', () => {
	it('returns 0 for empty trades', () => {
		expect(calcExpectancy([])).toBe(0);
	});

	it('returns average PnL per closed trade', () => {
		// +100, -60, +50, -40 → total = 50 / 4 = 12.5
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 88 }),   // -60
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 110 }),  // +50
			closed({ tradeType: 'sell', openPrice: 200, quantity: 2, closePrice: 220 }), // -40
		];
		expect(calcExpectancy(trades)).toBeCloseTo(12.5);
	});

	it('excludes open trades from both numerator and denominator', () => {
		const closedWin = closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 150 }); // +50
		const openTrade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 1 });
		// Only 1 closed trade with PnL=50 → expectancy = 50
		expect(calcExpectancy([closedWin, openTrade])).toBeCloseTo(50);
	});
});

// ---------------------------------------------------------------------------
// calcBestTrade & calcWorstTrade
// ---------------------------------------------------------------------------

describe('calcBestTrade', () => {
	it('returns null for empty trades', () => {
		expect(calcBestTrade([])).toBeNull();
	});

	it('returns the highest PnL across closed trades', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }), // +75
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),   // -75
		];
		expect(calcBestTrade(trades)).toBe(100);
	});

	it('ignores open trades', () => {
		const closedLoss = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 5,
			closePrice: 90,
		}); // -50
		const openTrade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 100 });
		expect(calcBestTrade([closedLoss, openTrade])).toBe(-50);
	});
});

describe('calcWorstTrade', () => {
	it('returns null for empty trades', () => {
		expect(calcWorstTrade([])).toBeNull();
	});

	it('returns the lowest (most negative) PnL across closed trades', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }), // +75
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),   // -75
		];
		expect(calcWorstTrade(trades)).toBe(-75);
	});
});

// ---------------------------------------------------------------------------
// calcGrossProfit & calcGrossLoss
// ---------------------------------------------------------------------------

describe('calcGrossProfit', () => {
	it('returns 0 for empty trades', () => {
		expect(calcGrossProfit([])).toBe(0);
	});

	it('sums only winning closed trade PnLs', () => {
		// wins: +100, +75; losses excluded
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }), // +75
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),   // -75 (excluded)
		];
		expect(calcGrossProfit(trades)).toBe(175);
	});
});

describe('calcGrossLoss', () => {
	it('returns 0 for empty trades', () => {
		expect(calcGrossLoss([])).toBe(0);
	});

	it('sums only losing closed trade PnLs (result is negative)', () => {
		// losses: -75, -60; wins excluded
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100 (excluded)
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),   // -75
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 220 }), // -60
		];
		expect(calcGrossLoss(trades)).toBe(-135);
	});
});

// ---------------------------------------------------------------------------
// calcMaxWinStreak & calcMaxLossStreak
// ---------------------------------------------------------------------------

describe('calcMaxWinStreak', () => {
	it('returns 0 for empty trades', () => {
		expect(calcMaxWinStreak([])).toBe(0);
	});

	it('counts consecutive wins ordered by closedAt', () => {
		// Sequence: W, W, L, W, W, W → longest streak = 3
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-01T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-02T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90,  closedAt: '2024-01-03T10:00:00Z' }), // L
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-04T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-05T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-06T10:00:00Z' }), // W
		];
		expect(calcMaxWinStreak(trades)).toBe(3);
	});

	it('returns 0 when all trades are losses', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90, closedAt: '2024-01-01T10:00:00Z' }),
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90, closedAt: '2024-01-02T10:00:00Z' }),
		];
		expect(calcMaxWinStreak(trades)).toBe(0);
	});

	it('returns 1 for alternating win-loss sequence', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-01T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90,  closedAt: '2024-01-02T10:00:00Z' }), // L
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-03T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90,  closedAt: '2024-01-04T10:00:00Z' }), // L
		];
		expect(calcMaxWinStreak(trades)).toBe(1);
	});
});

describe('calcMaxLossStreak', () => {
	it('returns 0 for empty trades', () => {
		expect(calcMaxLossStreak([])).toBe(0);
	});

	it('counts consecutive losses ordered by closedAt', () => {
		// Sequence: L, W, L, L, W → longest loss streak = 2
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90,  closedAt: '2024-01-01T10:00:00Z' }), // L
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-02T10:00:00Z' }), // W
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90,  closedAt: '2024-01-03T10:00:00Z' }), // L
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 90,  closedAt: '2024-01-04T10:00:00Z' }), // L
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-05T10:00:00Z' }), // W
		];
		expect(calcMaxLossStreak(trades)).toBe(2);
	});

	it('returns 0 when all trades are wins', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-01T10:00:00Z' }),
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-02T10:00:00Z' }),
		];
		expect(calcMaxLossStreak(trades)).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// calcAverageTradeDuration
// ---------------------------------------------------------------------------

describe('calcAverageTradeDuration', () => {
	it('returns "0m" for empty trades', () => {
		expect(calcAverageTradeDuration([])).toBe('0m');
	});

	it('formats average duration in minutes when < 1 hour', () => {
		// Both trades last 30 minutes → avg = 30m
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
				openedAt: '2024-01-01T10:00:00Z',
				closedAt: '2024-01-01T10:30:00Z',
			}),
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
				openedAt: '2024-01-02T10:00:00Z',
				closedAt: '2024-01-02T10:30:00Z',
			}),
		];
		expect(calcAverageTradeDuration(trades)).toBe('30m');
	});

	it('formats average duration in hours when ≥ 1 hour', () => {
		// Both trades last 2.5 hours (150 min) → avg = 2.5h
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
				openedAt: '2024-01-01T10:00:00Z',
				closedAt: '2024-01-01T12:30:00Z',
			}),
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
				openedAt: '2024-01-02T10:00:00Z',
				closedAt: '2024-01-02T12:30:00Z',
			}),
		];
		expect(calcAverageTradeDuration(trades)).toBe('2.5h');
	});

	it('formats average duration in days when ≥ 24 hours', () => {
		// Both trades last exactly 48 hours = 2 days → avg = 2.0d
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
				openedAt: '2024-01-01T00:00:00Z',
				closedAt: '2024-01-03T00:00:00Z',
			}),
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 1,
				closePrice: 110,
				openedAt: '2024-01-05T00:00:00Z',
				closedAt: '2024-01-07T00:00:00Z',
			}),
		];
		expect(calcAverageTradeDuration(trades)).toBe('2.0d');
	});
});

// ---------------------------------------------------------------------------
// calcMaxDrawdown
// ---------------------------------------------------------------------------

describe('calcMaxDrawdown', () => {
	it('returns {absolute: 0, percentage: 0} for empty trades', () => {
		expect(calcMaxDrawdown([])).toEqual({ absolute: 0, percentage: 0 });
	});

	it('returns zero drawdown when all trades are profitable', () => {
		// equity only grows: no drawdown
		// Note: the return value is -maxDrawdownAbs, which yields IEEE -0 when there
		// is no drawdown. toBeCloseTo(0) treats -0 and +0 as equal.
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 110, closedAt: '2024-01-01T00:00:00Z' }), // +10
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 120, closedAt: '2024-01-02T00:00:00Z' }), // +20
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 130, closedAt: '2024-01-03T00:00:00Z' }), // +30
		];
		const result = calcMaxDrawdown(trades);
		expect(result.absolute).toBeCloseTo(0);
		expect(result.percentage).toBeCloseTo(0);
	});

	it('calculates max drawdown from equity peak to trough', () => {
		// Running equity after each trade (chronological):
		//   t1: +100 → equity=100, peak=100, dd=0
		//   t2: +50  → equity=150, peak=150, dd=0
		//   t3: -80  → equity=70,  peak=150, dd=80  ← maximum
		//   t4: +30  → equity=100, peak=150, dd=50
		// maxDrawdownAbs = 80, maxDrawdownPct = 80/150 ≈ 0.5333
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 200, closedAt: '2024-01-01T00:00:00Z' }), // +100
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 150, closedAt: '2024-01-02T00:00:00Z' }), // +50
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 20,  closedAt: '2024-01-03T00:00:00Z' }), // -80
			closed({ tradeType: 'buy', openPrice: 100, quantity: 1, closePrice: 130, closedAt: '2024-01-04T00:00:00Z' }), // +30
		];
		const result = calcMaxDrawdown(trades);
		expect(result.absolute).toBeCloseTo(-80);
		expect(result.percentage).toBeCloseTo(-(80 / 150));
	});
});

// ---------------------------------------------------------------------------
// calcAverageRiskReward
// ---------------------------------------------------------------------------

describe('calcAverageRiskReward', () => {
	it('returns null when no trades have a stop-loss defined', () => {
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 10, closePrice: 110 }),
		];
		expect(calcAverageRiskReward(trades)).toBeNull();
	});

	it('returns null for empty trades', () => {
		expect(calcAverageRiskReward([])).toBeNull();
	});

	it('single trade: actualPnl / plannedRisk', () => {
		// long, open=100, close=115, qty=10, SL=90
		// actualPnl = (115-100)×10 = 150
		// plannedRisk = |90-100|×10 = 100
		// RR = 150/100 = 1.5
		const trades = [
			closed({
				tradeType: 'buy',
				openPrice: 100,
				quantity: 10,
				closePrice: 115,
				stopLoss: 90,
			}),
		];
		expect(calcAverageRiskReward(trades)).toBeCloseTo(1.5);
	});

	it('averages RR ratios across multiple trades', () => {
		// trade1: open=100, close=110, qty=10, SL=95 → actualPnl=100, risk=50, RR=2.0
		// trade2: open=100, close=90,  qty=10, SL=95 → actualPnl=-100, risk=50, RR=-2.0
		// avg = 0
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 10, closePrice: 110, stopLoss: 95 }),
			closed({ tradeType: 'buy', openPrice: 100, quantity: 10, closePrice: 90,  stopLoss: 95 }),
		];
		expect(calcAverageRiskReward(trades)).toBeCloseTo(0);
	});

	it('ignores trades without a stop-loss when computing the average', () => {
		// Only the trade with SL is counted: RR = 1.5
		const tradeWithSL = closed({
			tradeType: 'buy',
			openPrice: 100,
			quantity: 10,
			closePrice: 115,
			stopLoss: 90,
		}); // RR = 1.5
		const tradeWithoutSL = closed({
			tradeType: 'buy',
			openPrice: 200,
			quantity: 5,
			closePrice: 150,
		}); // no SL
		expect(calcAverageRiskReward([tradeWithSL, tradeWithoutSL])).toBeCloseTo(1.5);
	});
});

// ---------------------------------------------------------------------------
// pnlForPeriod
// ---------------------------------------------------------------------------

describe('pnlForPeriod', () => {
	it('returns 0 for empty trades', () => {
		expect(pnlForPeriod([])).toBe(0);
	});

	it('sums PnL of all closed trades', () => {
		// +100 + (-75) = 25
		const trades = [
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }),  // +100
			closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 85 }),   // -75
		];
		expect(pnlForPeriod(trades)).toBe(25);
	});

	it('excludes open trades (no closePrice or closedAt)', () => {
		const closedWin = closed({ tradeType: 'buy', openPrice: 100, quantity: 5, closePrice: 120 }); // +100
		const openTrade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 100 });
		expect(pnlForPeriod([closedWin, openTrade])).toBe(100);
	});
});

// ---------------------------------------------------------------------------
// totalTradedVolumeForPeriod
// ---------------------------------------------------------------------------

describe('totalTradedVolumeForPeriod', () => {
	it('returns 0 for empty trades', () => {
		expect(totalTradedVolumeForPeriod([])).toBe(0);
	});

	it('volume per trade = (openPrice + closePrice) × quantity, summed', () => {
		// t1: (100 + 120) × 5 = 1100
		// t2: (200 + 175) × 3 = 1125
		// total = 2225
		const trades = [
			closed({ tradeType: 'buy',  openPrice: 100, quantity: 5, closePrice: 120 }),
			closed({ tradeType: 'sell', openPrice: 200, quantity: 3, closePrice: 175 }),
		];
		expect(totalTradedVolumeForPeriod(trades)).toBe(2225);
	});

	it('uses 0 for missing closePrice in volume calculation', () => {
		// open trade: (100 + 0) × 5 = 500
		const openTrade = makeTrade({ tradeType: 'buy', openPrice: 100, quantity: 5 });
		expect(totalTradedVolumeForPeriod([openTrade])).toBe(500);
	});
});

// ---------------------------------------------------------------------------
// totalEquityInOpenedTrades
// ---------------------------------------------------------------------------

describe('totalEquityInOpenedTrades', () => {
	it('returns 0 for empty trades', () => {
		expect(totalEquityInOpenedTrades([])).toBe(0);
	});

	it('sums openPrice × quantity for each trade', () => {
		// t1: 100 × 5 = 500
		// t2: 200 × 3 = 600
		// total = 1100
		const trades = [
			makeTrade({ tradeType: 'buy',  openPrice: 100, quantity: 5 }),
			makeTrade({ tradeType: 'sell', openPrice: 200, quantity: 3 }),
		];
		expect(totalEquityInOpenedTrades(trades)).toBe(1100);
	});
});
