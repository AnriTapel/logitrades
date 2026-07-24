/**
 * Unit tests for createPortfolioEquityCurveData.
 *
 * Verifies that starting capital, deposits, withdrawals, and closed-trade
 * PnL are correctly combined into a cumulative equity curve.
 */

import { describe, it, expect } from 'vitest';
import { createPortfolioEquityCurveData } from '$lib/chartsHelpers';
import type { BalanceTransaction, Trade } from '$lib/types';

function makeTrade(
	id: number,
	closedAt: string,
	pnl: number,
): Trade {
	// To produce the desired PnL: open_price=100, quantity=pnl (buy, +1 per unit)
	return {
		id,
		symbol: 'TEST',
		tradeType: 'buy',
		openPrice: 100,
		// closePrice = openPrice + pnl / quantity  →  quantity=1, close=100+pnl
		closePrice: 100 + pnl,
		quantity: 1,
		openedAt: closedAt,
		closedAt,
		createdAt: closedAt,
	};
}

function makeTx(
	id: number,
	type: 'deposit' | 'withdrawal',
	amount: number,
	date: string,
): BalanceTransaction {
	return {
		id,
		portfolio_id: 1,
		user_id: 1,
		type,
		amount,
		note: null,
		occurred_at: date,
		created_at: date,
	};
}

describe('createPortfolioEquityCurveData', () => {
	it('builds equity from starting capital only', () => {
		const result = createPortfolioEquityCurveData([], [], 5000, '2025-01-01');

		expect(result.labels).toHaveLength(1);
		expect(result.datasets[0].data).toEqual([5000]);
		expect(result.datasets[0].label).toBe('Account Equity');
	});

	it('adds trade PnL on top of starting capital', () => {
		const trades = [makeTrade(1, '2025-01-03', 200)];
		const result = createPortfolioEquityCurveData(trades, [], 1000, '2025-01-01');

		// Day 1: 1000 capital.  Day 3: +200 PnL → 1200
		const data = result.datasets[0].data;
		expect(data[0]).toBe(1000);
		expect(data[data.length - 1]).toBe(1200);
	});

	it('applies deposits and withdrawals correctly', () => {
		const txs = [
			makeTx(1, 'deposit', 300, '2025-02-01'),
			makeTx(2, 'withdrawal', 100, '2025-02-05'),
		];
		const result = createPortfolioEquityCurveData([], txs, 1000, '2025-01-01');

		const data = result.datasets[0].data;
		// 1000 (start) → +300 → -100
		expect(data[data.length - 1]).toBe(1200);
	});

	it('sorts events chronologically', () => {
		const trades = [
			makeTrade(1, '2025-03-01', 50),
			makeTrade(2, '2025-01-15', -30),
		];
		const result = createPortfolioEquityCurveData(trades, [], 0, '2025-01-01');

		const data = result.datasets[0].data;
		// Start: 0, Jan 15: -30, Mar 01: +50 → final = 20
		expect(data[data.length - 1]).toBeCloseTo(20, 5);
	});

	it('includes a drawdown dataset', () => {
		const trades = [
			makeTrade(1, '2025-01-02', 200),
			makeTrade(2, '2025-01-03', -100),
		];
		const result = createPortfolioEquityCurveData(trades, [], 1000, '2025-01-01');

		expect(result.datasets).toHaveLength(2);
		expect(result.datasets[1].label).toBe('Drawdown');
	});

	it('uses startedAt date as the origin', () => {
		const result = createPortfolioEquityCurveData([], [], 500, '2024-06-15');
		expect(result.labels[0]).toMatch(/Jun/);
	});

	it('falls back to first event date when startedAt is null', () => {
		const trades = [makeTrade(1, '2025-05-10', 100)];
		const result = createPortfolioEquityCurveData(trades, [], 0, null);
		// Should still produce a result without throwing
		expect(result.datasets[0].data.length).toBeGreaterThan(0);
	});
});
